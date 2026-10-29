<?php

use App\Enums\PaymentStatus;
use App\Enums\Role as RoleEnum;
use App\Enums\TeamSize;
use App\Models\OpenPlayRegistration;
use App\Models\OpenPlaySession;
use App\Models\Player;
use App\Models\User;
use Spatie\Permission\Models\Role;

/**
 * Open Play shows members who else is playing. It must show names only — and
 * naming someone as a friend must not expose them or lock them out.
 */
function privacyMember(array $playerAttributes = []): array
{
    Role::findOrCreate(RoleEnum::Player->value, 'web');

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole(RoleEnum::Player->value);

    $player = Player::factory()->for($user)->create([
        'birthdate' => '1990-01-01',
        'phone' => '09170000000',
        'address' => '12 Secret St, Makati',
        'emergency_contact_name' => 'Mama Secret',
        'emergency_contact_phone' => '09179999999',
        ...$playerAttributes,
    ]);

    return [$user, $player];
}

function privacySession(): OpenPlaySession
{
    return OpenPlaySession::factory()->create([
        'team_size' => TeamSize::Singles,
        'price_per_player' => 150,
        'max_players' => 16,
        'starts_at' => now()->addDays(2),
        'ends_at' => now()->addDays(2)->addHours(2),
    ]);
}

it('shows other registrants by name only on the browse page', function () {
    $session = privacySession();
    [, $victim] = privacyMember();
    OpenPlayRegistration::query()->create([
        'open_play_session_id' => $session->id,
        'player_id' => $victim->id,
        'created_by' => $victim->user_id,
        'payment_status' => PaymentStatus::Paid,
        'amount' => 150,
    ]);

    [$viewer] = privacyMember(['phone' => null, 'address' => null, 'emergency_contact_name' => null, 'emergency_contact_phone' => null]);

    $content = $this->actingAs($viewer)->get(route('open-play.browse'))->assertOk()->getContent();

    expect($content)
        ->not->toContain('09170000000')
        ->not->toContain('Secret St')
        ->not->toContain('Mama Secret')
        ->not->toContain('09179999999')
        ->not->toContain('1990-01-01');
});

it('does not reveal a named friend\'s personal details at checkout', function () {
    $session = privacySession();
    [, $victim] = privacyMember();
    [$attacker] = privacyMember(['phone' => null, 'address' => null, 'emergency_contact_name' => null, 'emergency_contact_phone' => null]);

    $this->actingAs($attacker)
        ->post(route('open-play.join.store', $session), ['friend_player_ids' => [$victim->id]])
        ->assertRedirect(route('open-play.checkout', $session));

    $content = $this->get(route('open-play.checkout', $session))->assertOk()->getContent();

    expect($content)
        ->not->toContain('09170000000')
        ->not->toContain('Secret St')
        ->not->toContain('Mama Secret');
});

it('does not lock a player out because a stranger named them in an unpaid group', function () {
    $session = privacySession();
    [$victimUser, $victim] = privacyMember();
    [$attacker] = privacyMember();

    $this->actingAs($attacker)->post(route('open-play.join.store', $session), ['friend_player_ids' => [$victim->id]]);

    // The victim can still sign up and is sent to their own checkout.
    $this->actingAs($victimUser)
        ->post(route('open-play.join.store', $session))
        ->assertRedirect(route('open-play.checkout', $session));

    expect(OpenPlayRegistration::query()
        ->where('player_id', $victim->id)
        ->whereNull('group_lead_id')
        ->exists())->toBeTrue();
});

it('drops the self-registered friend from the unpaid group and lowers what the group owes', function () {
    $session = privacySession();
    [$friendUser, $friend] = privacyMember();
    [$payer, $payerPlayer] = privacyMember();

    $this->actingAs($payer)->post(route('open-play.join.store', $session), ['friend_player_ids' => [$friend->id]]);
    $lead = OpenPlayRegistration::query()->where('player_id', $payerPlayer->id)->sole();
    expect((float) $lead->amount)->toBe(300.0);

    $this->actingAs($friendUser)->post(route('open-play.join.store', $session));

    expect((float) $lead->fresh()->amount)->toBe(150.0)
        ->and($lead->groupMembers()->count())->toBe(0);
});

it('keeps a friend in the group while the payer has a live QR, so nobody pays for a seat given away', function () {
    $session = privacySession();
    [$friendUser, $friend] = privacyMember();
    [$payer, $payerPlayer] = privacyMember();

    $this->actingAs($payer)->post(route('open-play.join.store', $session), ['friend_player_ids' => [$friend->id]]);
    $lead = OpenPlayRegistration::query()->where('player_id', $payerPlayer->id)->sole();
    $lead->payments()->create([
        'user_id' => $payer->id,
        'invoice_number' => 'INV-PRIV-1',
        'amount' => '300.00',
        'currency' => 'PHP',
        'status' => PaymentStatus::Pending,
        'qr_code_url' => 'https://api.paymongo.com/qr/x.png',
        'qr_expires_at' => now()->addMinutes(10),
    ]);

    $this->actingAs($friendUser)->post(route('open-play.join.store', $session))->assertRedirect();

    expect($lead->groupMembers()->count())->toBe(1)
        ->and((float) $lead->fresh()->amount)->toBe(300.0);
});
