<?php

use App\Enums\MessengerDirection;
use App\Enums\MessengerMessageSource;
use App\Enums\MessengerMessageStatus;
use App\Enums\MessengerTemplate;
use App\Jobs\AnnounceOpenPlayOnMessenger;
use App\Models\MessengerConversation;
use App\Models\OpenPlaySession;
use App\Models\ResourceBooking;
use App\Models\User;
use App\Notifications\BookingApprovedNotification;
use App\Services\Messenger\MessengerWebhookProcessor;
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

function messengerEvent(array $event): array
{
    return ['object' => 'page', 'entry' => [['id' => '111222333', 'messaging' => [$event]]]];
}

function getStartedEvent(string $psid, string $ref): array
{
    return messengerEvent([
        'sender' => ['id' => $psid],
        'recipient' => ['id' => '111222333'],
        'timestamp' => now()->getTimestampMs(),
        'postback' => ['title' => 'Get Started', 'payload' => 'GET_STARTED', 'referral' => ['ref' => $ref, 'source' => 'SHORTLINK']],
    ]);
}

function connectRef(User $user): string
{
    $location = test()->actingAs($user)->get(route('messenger.connect'))->headers->get('Location');
    parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

    return $query['ref'];
}

function linkedConversation(User $user, array $attributes = []): MessengerConversation
{
    return MessengerConversation::query()->create([
        'psid' => 'psid-'.$user->id,
        'user_id' => $user->id,
        'linked_at' => now(),
        'last_inbound_at' => now()->subHour(),
        ...$attributes,
    ]);
}

function venueAdmin(): User
{
    return tap(User::factory()->create(), fn (User $user) => $user->assignRole('club_admin'));
}

// --- Webhook --------------------------------------------------------------

test('the webhook handshake echoes the challenge only for the right verify token', function () {
    $this->get('/webhooks/messenger?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=abc123')
        ->assertOk()
        ->assertSeeText('abc123');

    $this->get('/webhooks/messenger?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc123')
        ->assertForbidden();
});

test('unsigned webhook deliveries are rejected', function () {
    $this->postJson('/webhooks/messenger', getStartedEvent('999', 'anything'))->assertForbidden();

    expect(MessengerConversation::query()->count())->toBe(0);
});

// --- Linking --------------------------------------------------------------

test('opening the connect link and tapping Get Started links Messenger to the account', function () {
    $user = User::factory()->create(['name' => 'Juan Dela Cruz']);

    $location = $this->actingAs($user)->get(route('messenger.connect'))->assertRedirect()->headers->get('Location');
    expect($location)->toStartWith('https://m.me/venuepage?ref=');

    postSignedMessengerWebhook(getStartedEvent('psid-123', connectRef($user)))->assertOk();

    $conversation = $user->refresh()->messengerConversation;
    expect($conversation->psid)->toBe('psid-123')
        ->and($conversation->linked_at)->not->toBeNull()
        ->and($conversation->hasOpenWindow())->toBeTrue();

    // The tapped button shows in the thread, followed by the welcome.
    expect($conversation->messages()->pluck('text')->all())->toBe([
        'Get Started',
        "You're all set, Juan! Booking and payment updates from ".config('app.name').' will arrive here.',
    ]);

    Http::assertSent(fn (Request $request) => str_contains($request->url(), '/111222333/messages')
        && $request['recipient']['id'] === 'psid-123'
        && str_contains($request['message']['text'] ?? '', "You're all set, Juan"));
});

test('a connect link works only once', function () {
    $first = User::factory()->create();
    $ref = connectRef($first);

    postSignedMessengerWebhook(getStartedEvent('psid-a', $ref));
    postSignedMessengerWebhook(getStartedEvent('psid-b', $ref));

    expect($first->refresh()->messengerConversation->psid)->toBe('psid-a')
        ->and(MessengerConversation::query()->where('psid', 'psid-b')->value('user_id'))->toBeNull();
});

test('linking a Messenger account already linked elsewhere moves it to the new account', function () {
    $old = User::factory()->create();
    linkedConversation($old, ['psid' => 'psid-shared']);
    $new = User::factory()->create();

    postSignedMessengerWebhook(getStartedEvent('psid-shared', connectRef($new)));

    expect($old->refresh()->messengerConversation)->toBeNull()
        ->and($new->refresh()->messengerConversation->psid)->toBe('psid-shared');
});

test('disconnecting unlinks the account but keeps the chat history', function () {
    $this->withoutVite();
    $user = User::factory()->create();
    $conversation = linkedConversation($user);

    $this->actingAs($user)->get(route('messenger.edit'))
        ->assertInertia(fn ($page) => $page
            ->component('settings/messenger')
            ->where('messenger.available', true)
            ->where('messenger.connected', true));

    $this->actingAs($user)->delete(route('messenger.destroy'))->assertRedirect(route('messenger.edit'));

    expect($user->refresh()->messengerConversation)->toBeNull()
        ->and($conversation->fresh())->not->toBeNull();
});

// --- Inbound, echoes and receipts ------------------------------------------

test('a message to the Page lands in the inbox as unread and opens the window', function () {
    postSignedMessengerWebhook(messengerEvent([
        'sender' => ['id' => 'psid-new'],
        'recipient' => ['id' => '111222333'],
        'timestamp' => now()->getTimestampMs(),
        'message' => ['mid' => 'm_in_1', 'text' => 'Is court 2 free tonight?'],
    ]))->assertOk();

    $conversation = MessengerConversation::query()->where('psid', 'psid-new')->sole();

    expect($conversation->unread_count)->toBe(1)
        ->and($conversation->hasOpenWindow())->toBeTrue()
        ->and($conversation->last_message_preview)->toBe('Is court 2 free tonight?')
        ->and($conversation->messages()->sole()->direction)->toBe(MessengerDirection::Inbound);

    // Meta redelivers webhooks; the same mid must not be stored twice.
    postSignedMessengerWebhook(messengerEvent([
        'sender' => ['id' => 'psid-new'],
        'timestamp' => now()->getTimestampMs(),
        'message' => ['mid' => 'm_in_1', 'text' => 'Is court 2 free tonight?'],
    ]));

    expect($conversation->messages()->count())->toBe(1);
});

test('a reply typed in Facebook\'s own inbox shows up in the thread', function () {
    $conversation = MessengerConversation::query()->create(['psid' => 'psid-1', 'unread_count' => 2]);

    postSignedMessengerWebhook(messengerEvent([
        'sender' => ['id' => '111222333'],
        'recipient' => ['id' => 'psid-1'],
        'timestamp' => now()->getTimestampMs(),
        'message' => ['mid' => 'm_echo_1', 'text' => 'Yes, see you at 7!', 'is_echo' => true],
    ]));

    $message = $conversation->messages()->sole();
    expect($message->source)->toBe(MessengerMessageSource::PageInbox)
        ->and($message->direction)->toBe(MessengerDirection::Outbound)
        ->and($conversation->refresh()->unread_count)->toBe(0);
});

test('the echo of our own send updates it instead of duplicating it', function () {
    $user = User::factory()->create();
    $conversation = linkedConversation($user);
    $booking = ResourceBooking::factory()->create(['user_id' => $user->id]);

    $user->notify(new BookingApprovedNotification($booking));
    $sent = $conversation->messages()->sole();

    postSignedMessengerWebhook(messengerEvent([
        'sender' => ['id' => '111222333'],
        'recipient' => ['id' => $conversation->psid],
        'timestamp' => now()->addSeconds(2)->getTimestampMs(),
        'message' => ['mid' => 'mid.1', 'is_echo' => true, 'metadata' => 'local:'.$sent->id, 'text' => $sent->text],
    ]));

    expect($conversation->messages()->count())->toBe(1);
});

test('delivery and read receipts move sent messages to Delivered and then Seen', function () {
    $user = User::factory()->create();
    $conversation = linkedConversation($user);
    $booking = ResourceBooking::factory()->create(['user_id' => $user->id]);

    $user->notify(new BookingApprovedNotification($booking));
    $message = $conversation->messages()->sole();
    expect($message->status)->toBe(MessengerMessageStatus::Sent);

    postSignedMessengerWebhook(messengerEvent([
        'sender' => ['id' => $conversation->psid],
        'delivery' => ['mids' => ['mid.1'], 'watermark' => now()->addSecond()->getTimestampMs()],
    ]));
    expect($message->refresh()->status)->toBe(MessengerMessageStatus::Delivered);

    postSignedMessengerWebhook(messengerEvent([
        'sender' => ['id' => $conversation->psid],
        'read' => ['watermark' => now()->addSecond()->getTimestampMs()],
    ]));
    expect($message->refresh()->status)->toBe(MessengerMessageStatus::Read);
});

// --- Notifications ----------------------------------------------------------

test('inside the 24-hour window a notification goes out as an ordinary message and is kept in the thread', function () {
    $user = User::factory()->create(['name' => 'Juan Dela Cruz']);
    $conversation = linkedConversation($user);
    $booking = ResourceBooking::factory()->create(['user_id' => $user->id]);

    $user->notify(new BookingApprovedNotification($booking));

    Http::assertSent(function (Request $request) use ($booking) {
        $payload = $request['message']['attachment']['payload'] ?? null;

        return $request['messaging_type'] === 'UPDATE'
            && str_starts_with($payload['text'], 'Good news, Juan!')
            && $payload['buttons'][0]['url'] === route('bookings.show', $booking);
    });

    expect($conversation->messages()->sole()->source)->toBe(MessengerMessageSource::Notification);
});

test('outside the 24-hour window a notification uses the approved utility template', function () {
    $user = User::factory()->create();
    linkedConversation($user, ['last_inbound_at' => now()->subDays(2)]);
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
    $staff = User::factory()->create();
    linkedConversation($staff);
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

test('a failed send is kept as Failed and an unreachable recipient is unlinked', function () {
    // Stubs match in registration order, so drop the success stub from beforeEach.
    Http::swap(new HttpFactory);
    Http::fake(['graph.facebook.com/*' => Http::response([
        'error' => ['message' => "(#551) This person isn't available right now.", 'code' => 551, 'error_subcode' => 1545041],
    ], 400)]);

    $user = User::factory()->create();
    $conversation = linkedConversation($user);
    $booking = ResourceBooking::factory()->create(['user_id' => $user->id]);

    $user->notify(new BookingApprovedNotification($booking));

    $message = $conversation->messages()->sole();
    expect($message->status)->toBe(MessengerMessageStatus::Failed)
        ->and($message->error)->toContain('isn\'t available')
        ->and($conversation->refresh()->user_id)->toBeNull();
    $this->assertDatabaseHas('notifications', ['notifiable_id' => $user->id]);
});

test('nothing is sent while Messenger is not configured', function () {
    config(['services.messenger.page_access_token' => null]);

    $user = User::factory()->create();
    linkedConversation($user);
    $booking = ResourceBooking::factory()->create(['user_id' => $user->id]);

    $user->notify(new BookingApprovedNotification($booking));

    Http::assertNothingSent();
    $this->actingAs($user)->get(route('messenger.connect'))->assertRedirect(route('messenger.edit'));
});

// --- Staff inbox -------------------------------------------------------------

test('only venue admins can open the inbox', function () {
    $this->withoutVite();
    $conversation = MessengerConversation::query()->create(['psid' => 'psid-1', 'last_message_at' => now()]);

    // Non-admins are bounced by the venue.admin middleware before the policy.
    $this->actingAs(User::factory()->create())->get(route('admin.messenger.index'))->assertRedirect();
    $this->actingAs(User::factory()->create())
        ->post(route('admin.messenger.reply', $conversation), ['text' => 'hi'])
        ->assertRedirect();
    expect($conversation->messages()->count())->toBe(0);
    Http::assertNothingSent();

    $this->actingAs(venueAdmin())->get(route('admin.messenger.show', $conversation))
        ->assertInertia(fn ($page) => $page
            ->component('admin/messenger/index')
            ->has('conversations', 1)
            ->where('active.id', $conversation->id));
});

test('staff can reply from the inbox inside the window', function () {
    $admin = venueAdmin();
    $conversation = MessengerConversation::query()->create([
        'psid' => 'psid-1', 'last_inbound_at' => now()->subMinutes(5), 'unread_count' => 1,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.messenger.reply', $conversation), ['text' => '  Yes, court 2 is free at 7.  '])
        ->assertRedirect(route('admin.messenger.show', $conversation));

    Http::assertSent(fn (Request $request) => $request['messaging_type'] === 'RESPONSE'
        && $request['message']['text'] === 'Yes, court 2 is free at 7.');

    $message = $conversation->messages()->sole();
    expect($message->source)->toBe(MessengerMessageSource::Reply)
        ->and($message->sent_by_id)->toBe($admin->id)
        ->and($conversation->refresh()->unread_count)->toBe(0);
});

test('replies outside the window are refused unless the Human Agent tag is enabled', function () {
    $admin = venueAdmin();
    $conversation = MessengerConversation::query()->create(['psid' => 'psid-1', 'last_inbound_at' => now()->subDays(3)]);

    $this->actingAs($admin)
        ->post(route('admin.messenger.reply', $conversation), ['text' => 'Hello?'])
        ->assertSessionHasErrors('text');
    Http::assertNothingSent();

    config(['services.messenger.human_agent' => true]);

    $this->actingAs($admin)
        ->post(route('admin.messenger.reply', $conversation), ['text' => 'Hello?'])
        ->assertSessionHasNoErrors();

    Http::assertSent(fn (Request $request) => $request['messaging_type'] === 'MESSAGE_TAG' && $request['tag'] === 'HUMAN_AGENT');
});

test('opening a chat marks it read and shows Seen in Messenger', function () {
    $conversation = MessengerConversation::query()->create([
        'psid' => 'psid-1', 'last_inbound_at' => now(), 'unread_count' => 3,
    ]);
    $conversation->messages()->create([
        'direction' => MessengerDirection::Inbound,
        'source' => MessengerMessageSource::Customer,
        'status' => MessengerMessageStatus::Received,
        'text' => 'Hi',
        'sent_at' => now(),
    ]);

    $this->actingAs(venueAdmin())->post(route('admin.messenger.read', $conversation))->assertRedirect();

    expect($conversation->refresh()->unread_count)->toBe(0);
    Http::assertSent(fn (Request $request) => ($request['sender_action'] ?? null) === 'mark_seen');
});

// --- Open Play announcements -------------------------------------------------

test('a new Open Play session is announced to everyone inside the window', function () {
    $session = OpenPlaySession::factory()->create(['title' => 'Friday Night Dinks']);
    $recent = MessengerConversation::query()->create(['psid' => 'psid-recent', 'last_inbound_at' => now()->subHours(2)]);
    $stale = MessengerConversation::query()->create(['psid' => 'psid-stale', 'last_inbound_at' => now()->subDays(3)]);

    app()->call([new AnnounceOpenPlayOnMessenger($session), 'handle']);

    expect($recent->messages()->sole()->source)->toBe(MessengerMessageSource::Announcement)
        ->and($stale->messages()->count())->toBe(0);

    Http::assertSent(fn (Request $request) => $request['recipient']['id'] === 'psid-recent'
        && str_contains($request['message']['attachment']['payload']['text'], 'New Open Play: Friday Night Dinks')
        && $request['message']['attachment']['payload']['buttons'][0]['url'] === route('open-play.join', $session));
    Http::assertNotSent(fn (Request $request) => ($request['recipient']['id'] ?? null) === 'psid-stale');
});

// --- Templates ---------------------------------------------------------------

test('every template body follows Meta template rules', function (MessengerTemplate $template) {
    $body = $template->body();

    expect($body)->not->toMatch('/^\s*\{\{/')
        ->and($body)->not->toMatch('/\}\}[\s.!?]*$/')
        ->and(array_keys($template->examples()))->toEqualCanonicalizing($template->placeholders())
        ->and($template->templateName())->toMatch('/^[a-z0-9_]+$/');
})->with(MessengerTemplate::cases());

test('setup submits each template with its URL button example nested the way Meta expects', function () {
    $this->artisan('messenger:setup', ['--templates-only' => true])->assertSuccessful();

    Http::assertSent(function (Request $request) {
        if (! str_ends_with(parse_url($request->url(), PHP_URL_PATH), '/message_templates') || $request['name'] !== 'booking_approved_v1') {
            return false;
        }

        $button = $request['components'][1]['buttons'][0];

        return $request['category'] === 'UTILITY'
            && $request['parameter_format'] === 'NAMED'
            && $button['url'] === 'https://courts.test/{{url_suffix}}'
            && $button['example'] === ['url_suffix_example' => 'https://courts.test/bookings/1']
            && ! array_key_exists('url_suffix_example', $button);
    });
});

// --- Floating prompt ---------------------------------------------------------

test('the floating prompt asks customers to connect until they have, and stays out of staff\'s way', function () {
    $this->withoutVite();
    $customer = User::factory()->create();

    $this->get(route('home'))
        ->assertInertia(fn ($page) => $page
            ->where('messengerPrompt.available', true)
            ->where('messengerPrompt.signedIn', false)
            ->where('messengerPrompt.chatUrl', 'https://m.me/venuepage'));

    $this->actingAs($customer)->get(route('messenger.edit'))
        ->assertInertia(fn ($page) => $page
            ->where('messengerPrompt.signedIn', true)
            ->where('messengerPrompt.connected', false));

    linkedConversation($customer);

    $this->actingAs($customer)->get(route('messenger.edit'))
        ->assertInertia(fn ($page) => $page->where('messengerPrompt.connected', true));

    $this->actingAs(venueAdmin())->get(route('messenger.edit'))
        ->assertInertia(fn ($page) => $page->where('messengerPrompt', null));
});

test('the floating prompt is switched off while Messenger is not configured', function () {
    $this->withoutVite();
    config(['services.messenger.page_access_token' => null]);

    $this->actingAs(User::factory()->create())->get(route('messenger.edit'))
        ->assertInertia(fn ($page) => $page
            ->where('messengerPrompt.available', false)
            ->where('messengerPrompt.chatUrl', null));
});

test('the FAQ explains Messenger updates only while Messenger is set up', function () {
    $this->withoutVite();
    $questionIds = fn () => collect($this->get(route('faq'))->viewData('page')['props']['topics'])
        ->flatMap(fn (array $topic) => collect($topic['questions'])->pluck('id'))
        ->all();

    expect($questionIds())->toContain('messenger');

    config(['services.messenger.page_access_token' => null]);

    expect($questionIds())->not->toContain('messenger');
});

test('a nameless chat picks up the person\'s name once Meta shares it, without asking on every message', function () {
    Http::swap(new HttpFactory);
    Http::fake([
        'graph.facebook.com/v27.0/psid-anon*' => Http::response(['first_name' => 'Edrian', 'last_name' => 'Ramos', 'profile_pic' => 'https://cdn.test/edrian.jpg']),
        'graph.facebook.com/*' => Http::response(['message_id' => 'mid.x']),
    ]);
    $conversation = MessengerConversation::query()->create(['psid' => 'psid-anon']);
    $message = fn (string $mid) => messengerEvent([
        'sender' => ['id' => 'psid-anon'],
        'timestamp' => now()->getTimestampMs(),
        'message' => ['mid' => $mid, 'text' => 'Hello'],
    ]);

    // Straight to the processor: one app instance re-runs every earlier
    // request's after-response work on each test request, which would
    // double-count lookups that production makes once.
    $processor = app(MessengerWebhookProcessor::class);
    $processor->handle($message('m_a'));
    $processor->handle($message('m_b'));
    app()->terminate();

    expect($conversation->refresh()->name)->toBe('Edrian Ramos')
        ->and($conversation->avatar_url)->toBe('https://cdn.test/edrian.jpg');

    $profileLookups = collect(Http::recorded())->filter(fn ($pair) => str_contains($pair[0]->url(), '/psid-anon'));
    expect($profileLookups)->toHaveCount(1);
});

// --- Connect code fallback ---------------------------------------------------

function connectCodeFor(User $user): ?string
{
    test()->withoutVite();

    return test()->actingAs($user)->get(route('messenger.edit'))->viewData('page')['props']['messenger']['connectCode'];
}

function plainMessage(string $psid, string $mid, string $text): array
{
    return messengerEvent([
        'sender' => ['id' => $psid],
        'timestamp' => now()->getTimestampMs(),
        'message' => ['mid' => $mid, 'text' => $text],
    ]);
}

test('sending the connect code as a plain message links the chat, even when the link\'s ref was lost', function () {
    $user = User::factory()->create(['name' => 'Edrian Ramos']);
    $code = connectCodeFor($user);

    expect($code)->toMatch('/^GRP-[A-Z2-9]{6}$/')
        ->and(connectCodeFor($user))->toBe($code); // stable across page reloads

    // Typed on a phone: lower case, a space instead of the dash.
    postSignedMessengerWebhook(plainMessage('psid-lite', 'm_code', 'hi '.strtolower(str_replace('-', ' ', $code))))->assertOk();

    $conversation = $user->refresh()->messengerConversation;
    expect($conversation->psid)->toBe('psid-lite')
        ->and($conversation->displayName())->toBe('Edrian Ramos');

    Http::assertSent(fn (Request $request) => str_contains($request['message']['text'] ?? '', "You're all set, Edrian"));

    // Used up: the page offers no code once connected.
    expect(connectCodeFor($user))->toBeNull();
});

test('a wrong code gets a helpful reply and links nothing, and ordinary messages are left alone', function () {
    postSignedMessengerWebhook(plainMessage('psid-x', 'm_wrong', 'GRP-ZZZZZZ'));

    expect(MessengerConversation::query()->where('psid', 'psid-x')->value('user_id'))->toBeNull();
    Http::assertSent(fn (Request $request) => str_contains($request['message']['text'] ?? '', "That code didn't work"));

    postSignedMessengerWebhook(plainMessage('psid-y', 'm_plain', 'Is the GRPS court open?'));

    $plain = MessengerConversation::query()->where('psid', 'psid-y')->sole();
    expect($plain->messages()->where('direction', MessengerDirection::Outbound)->count())->toBe(0);
});
