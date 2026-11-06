<?php

use App\Enums\MessengerTemplate;
use App\Models\ResourceBooking;
use App\Models\User;
use App\Notifications\BookingApprovedNotification;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'app.url' => 'https://courts.test',
        'services.messenger.page_id' => '111222333',
        'services.messenger.page_username' => 'venuepage',
        'services.messenger.page_access_token' => 'page-token',
        'services.messenger.app_secret' => 'app-secret',
        'services.messenger.verify_token' => 'verify-me',
        'services.messenger.graph_version' => 'v27.0',
    ]);
    url()->forceRootUrl('https://courts.test');

    Http::fake(['graph.facebook.com/*' => Http::response(['recipient_id' => 'psid', 'message_id' => 'mid.1'])]);
});

function postSignedMessengerWebhook(array $payload)
{
    $body = json_encode($payload);

    return test()->call('POST', '/webhooks/messenger', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_X_HUB_SIGNATURE_256' => 'sha256='.hash_hmac('sha256', $body, 'app-secret'),
    ], $body);
}

function referralEvent(string $psid, string $ref): array
{
    return [
        'object' => 'page',
        'entry' => [[
            'id' => '111222333',
            'messaging' => [[
                'sender' => ['id' => $psid],
                'recipient' => ['id' => '111222333'],
                'postback' => ['payload' => 'GET_STARTED', 'referral' => ['ref' => $ref, 'source' => 'SHORTLINK']],
            ]],
        ]],
    ];
}

function connectRef(User $user): string
{
    $location = test()->actingAs($user)->get(route('messenger.connect'))->headers->get('Location');
    parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

    return $query['ref'];
}

test('the webhook handshake echoes the challenge only for the right verify token', function () {
    $this->get('/webhooks/messenger?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=abc123')
        ->assertOk()
        ->assertSeeText('abc123');

    $this->get('/webhooks/messenger?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc123')
        ->assertForbidden();
});

test('unsigned webhook deliveries are rejected', function () {
    $this->postJson('/webhooks/messenger', referralEvent('999', 'anything'))->assertForbidden();
});

test('opening the connect link and tapping Get Started links Messenger to the account', function () {
    $user = User::factory()->create(['name' => 'Juan Dela Cruz']);

    $location = $this->actingAs($user)->get(route('messenger.connect'))->assertRedirect()->headers->get('Location');
    expect($location)->toStartWith('https://m.me/venuepage?ref=');

    postSignedMessengerWebhook(referralEvent('psid-123', connectRef($user)))->assertOk();

    $user->refresh();
    expect($user->messenger_psid)->toBe('psid-123')
        ->and($user->messenger_connected_at)->not->toBeNull()
        ->and($user->hasOpenMessengerWindow())->toBeTrue();

    Http::assertSent(fn (Request $request) => str_contains($request->url(), '/111222333/messages')
        && $request['recipient']['id'] === 'psid-123'
        && str_contains($request['message']['text'], "You're all set, Juan"));
});

test('a connect link works only once', function () {
    $first = User::factory()->create();
    $ref = connectRef($first);

    postSignedMessengerWebhook(referralEvent('psid-a', $ref));
    postSignedMessengerWebhook(referralEvent('psid-b', $ref));

    expect($first->refresh()->messenger_psid)->toBe('psid-a')
        ->and(User::query()->where('messenger_psid', 'psid-b')->exists())->toBeFalse();
});

test('linking a Messenger account already linked elsewhere moves it to the new account', function () {
    $old = User::factory()->create(['messenger_psid' => 'psid-shared', 'messenger_connected_at' => now()]);
    $new = User::factory()->create();

    postSignedMessengerWebhook(referralEvent('psid-shared', connectRef($new)));

    expect($old->refresh()->messenger_psid)->toBeNull()
        ->and($new->refresh()->messenger_psid)->toBe('psid-shared');
});

test('an incoming message reopens the 24-hour window', function () {
    $user = User::factory()->create([
        'messenger_psid' => 'psid-123',
        'messenger_last_inbound_at' => now()->subDays(3),
    ]);

    postSignedMessengerWebhook([
        'object' => 'page',
        'entry' => [['messaging' => [['sender' => ['id' => 'psid-123'], 'message' => ['mid' => 'm1', 'text' => 'hi']]]]],
    ])->assertOk();

    expect($user->refresh()->hasOpenMessengerWindow())->toBeTrue();
});

test('inside the 24-hour window a notification goes out as an ordinary message with a button', function () {
    $user = User::factory()->create([
        'name' => 'Juan Dela Cruz',
        'messenger_psid' => 'psid-123',
        'messenger_last_inbound_at' => now()->subHour(),
    ]);
    $booking = ResourceBooking::factory()->create(['user_id' => $user->id]);

    $user->notify(new BookingApprovedNotification($booking));

    Http::assertSent(function (Request $request) use ($booking) {
        $payload = $request['message']['attachment']['payload'] ?? null;

        return $request['messaging_type'] === 'UPDATE'
            && str_starts_with($payload['text'], 'Good news, Juan!')
            && $payload['buttons'][0]['url'] === route('bookings.show', $booking);
    });
});

test('outside the 24-hour window a notification uses the approved utility template', function () {
    $user = User::factory()->create([
        'messenger_psid' => 'psid-123',
        'messenger_last_inbound_at' => now()->subDays(2),
    ]);
    $booking = ResourceBooking::factory()->create(['user_id' => $user->id]);

    $user->notify(new BookingApprovedNotification($booking));

    Http::assertSent(function (Request $request) use ($booking) {
        $template = $request['message']['template'] ?? null;

        return $request['messaging_type'] === 'UTILITY'
            && $template['name'] === 'booking_approved_v1'
            && collect($template['components'][0]['parameters'])->pluck('parameter_name')->sort()->values()->all() === ['court', 'name', 'schedule']
            && $template['components'][1]['parameters'][0]['url'] === "bookings/{$booking->id}";
    });
});

test('staff get the staff wording for a customer booking', function () {
    $customer = User::factory()->create(['name' => 'Maria Santos']);
    $staff = User::factory()->create(['messenger_psid' => 'psid-staff', 'messenger_last_inbound_at' => now()]);
    $booking = ResourceBooking::factory()->create(['user_id' => $customer->id]);

    $staff->notify(new BookingApprovedNotification($booking));

    Http::assertSent(fn (Request $request) => str_starts_with(
        $request['message']['attachment']['payload']['text'] ?? '',
        'Booking confirmed for Maria Santos',
    ));
});

test('users without Messenger connected are never messaged', function () {
    $user = User::factory()->create();
    $booking = ResourceBooking::factory()->create(['user_id' => $user->id]);

    $user->notify(new BookingApprovedNotification($booking));

    Http::assertNothingSent();
});

test('a Messenger failure is swallowed and an unreachable recipient is disconnected', function () {
    // Stubs match in registration order, so drop the success stub from beforeEach.
    Http::swap(new HttpFactory);
    Http::fake(['graph.facebook.com/*' => Http::response([
        'error' => ['message' => "(#551) This person isn't available right now.", 'code' => 551, 'error_subcode' => 1545041],
    ], 400)]);

    $user = User::factory()->create(['messenger_psid' => 'psid-123', 'messenger_last_inbound_at' => now()]);
    $booking = ResourceBooking::factory()->create(['user_id' => $user->id]);

    $user->notify(new BookingApprovedNotification($booking));

    expect($user->refresh()->messenger_psid)->toBeNull();
    $this->assertDatabaseHas('notifications', ['notifiable_id' => $user->id]);
});

test('nothing is sent while Messenger is not configured', function () {
    config(['services.messenger.page_access_token' => null]);

    $user = User::factory()->create(['messenger_psid' => 'psid-123', 'messenger_last_inbound_at' => now()]);
    $booking = ResourceBooking::factory()->create(['user_id' => $user->id]);

    $user->notify(new BookingApprovedNotification($booking));

    Http::assertNothingSent();
    $this->actingAs($user)->get(route('messenger.connect'))->assertRedirect(route('messenger.edit'));
});

test('the settings page shows the connection status and disconnect clears it', function () {
    $this->withoutVite();
    $user = User::factory()->create(['messenger_psid' => 'psid-123', 'messenger_connected_at' => now()]);

    $this->actingAs($user)->get(route('messenger.edit'))
        ->assertInertia(fn ($page) => $page
            ->component('settings/messenger')
            ->where('messenger.available', true)
            ->where('messenger.connected', true));

    $this->actingAs($user)->delete(route('messenger.destroy'))->assertRedirect(route('messenger.edit'));

    expect($user->refresh()->messenger_psid)->toBeNull();
});

test('every template body follows Meta template rules', function (MessengerTemplate $template) {
    $body = $template->body();

    expect($body)->not->toMatch('/^\s*\{\{/')
        ->and($body)->not->toMatch('/\}\}[\s.!?]*$/')
        ->and(array_keys($template->examples()))->toEqualCanonicalizing($template->placeholders())
        ->and($template->templateName())->toMatch('/^[a-z0-9_]+$/');
})->with(MessengerTemplate::cases());
