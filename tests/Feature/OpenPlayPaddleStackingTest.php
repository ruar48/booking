<?php

use App\Enums\OpenPlayFormat;
use App\Enums\OpenPlayStackStatus;
use App\Enums\PaymentStatus;
use App\Enums\Role as RoleEnum;
use App\Enums\TeamSize;
use App\Models\OpenPlayRegistration;
use App\Models\OpenPlaySession;
use App\Models\OpenPlayStackEntry;
use App\Models\Player;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Paddle stacking: players queue, the first group in line takes the next
 * free court, and finished players go to the back of the line.
 */
function stackStaff(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole(RoleEnum::ClubAdmin->value);

    return $user;
}

/**
 * A running paddle-stacking session with $courts reserved courts.
 */
function stackSession(int $courts = 1, TeamSize $teamSize = TeamSize::Doubles, array $attributes = []): OpenPlaySession
{
    $session = OpenPlaySession::factory()->paddleStacking()->create([
        'team_size' => $teamSize,
        'price_per_player' => 0,
        'max_players' => 32,
        'starts_at' => now()->subMinutes(10),
        'ends_at' => now()->addHours(2),
        ...$attributes,
    ]);

    for ($number = 1; $number <= $courts; $number++) {
        $session->resources()->attach(
            Resource::factory()->create(['name' => "Court {$number}", 'resource_number' => (string) $number])->id,
        );
    }

    return $session;
}

/**
 * @return Collection<int, Player>
 */
function stackRegister(OpenPlaySession $session, int $count, PaymentStatus $status = PaymentStatus::Paid): Collection
{
    return collect(range(1, $count))->map(function () use ($session, $status): Player {
        $player = Player::factory()->create();

        OpenPlayRegistration::query()->create([
            'open_play_session_id' => $session->id,
            'player_id' => $player->id,
            'payment_status' => $status,
            'amount' => 0,
        ]);

        return $player;
    });
}

/** Player ids in line, front first. */
function stackLine(OpenPlaySession $session): array
{
    return $session->stackEntries()
        ->where('status', OpenPlayStackStatus::Waiting)
        ->orderBy('position')
        ->orderBy('id')
        ->pluck('player_id')
        ->all();
}

/** Player ids on a court. */
function stackCourt(OpenPlaySession $session, string $name): array
{
    $court = $session->resources()->where('name', $name)->sole();

    return $session->stackEntries()
        ->where('status', OpenPlayStackStatus::Playing)
        ->where('resource_id', $court->id)
        ->orderBy('position')
        ->pluck('player_id')
        ->all();
}

it('sends the first four stacked paddles to each free court and keeps the rest in line', function () {
    $session = stackSession(courts: 2);
    $players = stackRegister($session, 10)->pluck('id');

    $this->actingAs(stackStaff())
        ->post(route('open-play.stack.everyone', $session))
        ->assertRedirect();

    expect(stackCourt($session, 'Court 1'))->toBe($players->slice(0, 4)->values()->all())
        ->and(stackCourt($session, 'Court 2'))->toBe($players->slice(4, 4)->values()->all())
        ->and(stackLine($session))->toBe($players->slice(8)->values()->all());
});

it('sends finished players to the back of the line and calls the next group', function () {
    $session = stackSession(courts: 1);
    [$p1, $p2, $p3, $p4, $p5, $p6] = stackRegister($session, 6)->pluck('id')->all();
    $staff = stackStaff();

    $this->actingAs($staff)->post(route('open-play.stack.everyone', $session));

    expect(stackCourt($session, 'Court 1'))->toBe([$p1, $p2, $p3, $p4])
        ->and(stackLine($session))->toBe([$p5, $p6]);

    $court = $session->resources()->sole();

    $this->actingAs($staff)
        ->post(route('open-play.courts.finish', [$session, $court]))
        ->assertRedirect();

    // The two who waited go on first, joined by the front of the returning group.
    expect(stackCourt($session, 'Court 1'))->toBe([$p5, $p6, $p1, $p2])
        ->and(stackLine($session))->toBe([$p3, $p4])
        ->and(OpenPlayStackEntry::query()->where('player_id', $p3)->value('games_played'))->toBe(1)
        ->and(OpenPlayStackEntry::query()->where('player_id', $p5)->value('games_played'))->toBe(0);
});

it('waits for a full group before calling anyone to a court', function () {
    $session = stackSession(courts: 1);
    stackRegister($session, 3);

    $this->actingAs(stackStaff())->post(route('open-play.stack.everyone', $session));

    expect(stackCourt($session, 'Court 1'))->toBe([])
        ->and(stackLine($session))->toHaveCount(3);

    // The fourth paddle completes the group.
    $late = stackRegister($session, 1)->first();
    $this->post(route('open-play.stack.store', $session), ['player_id' => $late->id]);

    expect(stackCourt($session, 'Court 1'))->toHaveCount(4)
        ->and(stackLine($session))->toBe([]);
});

it('calls two players per court for singles', function () {
    $session = stackSession(courts: 1, teamSize: TeamSize::Singles);
    $players = stackRegister($session, 3)->pluck('id');

    $this->actingAs(stackStaff())->post(route('open-play.stack.everyone', $session));

    expect(stackCourt($session, 'Court 1'))->toBe($players->slice(0, 2)->values()->all())
        ->and(stackLine($session))->toBe([$players[2]]);
});

it('lets staff sit a player out and stack them again at the back', function () {
    $session = stackSession(courts: 1);
    [$p1, $p2, $p3, $p4, $p5, $p6] = stackRegister($session, 6)->pluck('id')->all();
    $staff = stackStaff();
    $this->actingAs($staff)->post(route('open-play.stack.everyone', $session));

    $entry = OpenPlayStackEntry::query()->where('player_id', $p5)->sole();
    $this->delete(route('open-play.stack.destroy', [$session, $entry]))->assertRedirect();

    expect(stackLine($session))->toBe([$p6])
        ->and($entry->fresh()->status)->toBe(OpenPlayStackStatus::SittingOut);

    // "Stack everyone" leaves players who are sitting out alone.
    $this->post(route('open-play.stack.everyone', $session));
    expect(stackLine($session))->toBe([$p6]);

    $this->post(route('open-play.stack.store', $session), ['player_id' => $p5]);
    expect(stackLine($session))->toBe([$p6, $p5]);
});

it('only stacks players registered for the session, and scopes entries and courts to it', function () {
    $session = stackSession(courts: 1);
    $other = stackSession(courts: 1);
    $outsider = Player::factory()->create();
    $otherPlayer = stackRegister($other, 1)->first();
    $staff = stackStaff();

    $this->actingAs($staff)->post(route('open-play.stack.store', $session), ['player_id' => $outsider->id]);
    expect($session->stackEntries()->count())->toBe(0);

    $this->post(route('open-play.stack.store', $other), ['player_id' => $otherPlayer->id]);
    $otherEntry = $other->stackEntries()->sole();

    $this->delete(route('open-play.stack.destroy', [$session, $otherEntry]))->assertNotFound();
    $this->post(route('open-play.courts.finish', [$session, $other->resources()->sole()]))->assertNotFound();
});

it('keeps the stack controls to staff', function () {
    $session = stackSession(courts: 1);
    $player = stackRegister($session, 1)->first();
    $member = User::factory()->create(['email_verified_at' => now()]);
    $member->assignRole(RoleEnum::Player->value);

    // The venue-admin middleware turns members away before the policy runs.
    $this->actingAs($member)->post(route('open-play.stack.everyone', $session))->assertRedirect();
    $this->actingAs($member)->post(route('open-play.stack.store', $session), ['player_id' => $player->id])->assertRedirect();

    expect($session->stackEntries()->count())->toBe(0);
});

it('lets a paid player stack and pull their own paddle while the session runs', function () {
    $session = stackSession(courts: 1);
    stackRegister($session, 1);
    $player = stackRegister($session, 1)->first();
    $user = $player->user;
    $user->assignRole(RoleEnum::Player->value);

    $this->actingAs($user)->post(route('open-play.my-paddle.store', $session))->assertRedirect();

    $entry = $session->stackEntries()->where('player_id', $player->id)->sole();
    expect($entry->status)->toBe(OpenPlayStackStatus::Waiting);

    $this->actingAs($user)->delete(route('open-play.my-paddle.destroy', $session))->assertRedirect();
    expect($entry->fresh()->status)->toBe(OpenPlayStackStatus::SittingOut);
});

it('does not let a player leave mid-game', function () {
    $session = stackSession(courts: 1, teamSize: TeamSize::Singles);
    $players = stackRegister($session, 2);
    $this->actingAs(stackStaff())->post(route('open-play.stack.everyone', $session));

    $this->actingAs($players->first()->user)->delete(route('open-play.my-paddle.destroy', $session));

    expect($session->stackEntries()->where('player_id', $players->first()->id)->value('status'))
        ->toBe(OpenPlayStackStatus::Playing);
});

it('refuses self-stacking to unpaid or unregistered players and outside the session', function () {
    $session = stackSession(courts: 1);
    $unpaid = stackRegister($session, 1, PaymentStatus::Unpaid)->first();
    $stranger = Player::factory()->create();

    $this->actingAs($unpaid->user)->post(route('open-play.my-paddle.store', $session))->assertForbidden();
    $this->actingAs($stranger->user)->post(route('open-play.my-paddle.store', $session))->assertForbidden();

    $later = stackSession(courts: 1, attributes: ['starts_at' => now()->addDay(), 'ends_at' => now()->addDay()->addHours(2)]);
    $early = stackRegister($later, 1)->first();

    $this->actingAs($early->user)->post(route('open-play.my-paddle.store', $later))->assertRedirect();

    expect($session->stackEntries()->count())->toBe(0)
        ->and($later->stackEntries()->count())->toBe(0);
});

it('registers paddle-stacking players one by one, even for doubles', function () {
    $session = stackSession(courts: 1, attributes: ['starts_at' => now()->addDay(), 'ends_at' => now()->addDay()->addHours(2)]);

    foreach (range(1, 2) as $ignored) {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole(RoleEnum::Player->value);
        Player::factory()->for($user)->create(['birthdate' => '1995-05-05']);

        $this->actingAs($user)->post(route('open-play.join.store', $session))->assertRedirect();
    }

    // A doubles bracket would have merged these two into one pair.
    expect($session->registrations()->count())->toBe(2)
        ->and($session->registrations()->whereNotNull('partner_player_id')->count())->toBe(0);
});

it('creates a paddle-stacking session without bracket settings', function () {
    $court = Resource::factory()->create();

    $this->actingAs(stackStaff())->post(route('open-play.store'), [
        'title' => 'Friday Open Play',
        'starts_at' => now()->addDay()->setTime(18, 0)->toDateTimeString(),
        'ends_at' => now()->addDay()->setTime(22, 0)->toDateTimeString(),
        'skill_level' => 'all_levels',
        'team_size' => 'doubles',
        'format' => 'paddle_stacking',
        'resource_ids' => [$court->id],
    ])->assertRedirect();

    $session = OpenPlaySession::query()->where('title', 'Friday Open Play')->sole();

    expect($session->format)->toBe(OpenPlayFormat::PaddleStacking)
        ->and($session->bracket_format)->toBeNull();

    $this->post(route('open-play.store'), [
        'title' => 'Bracket night',
        'starts_at' => now()->addDay()->setTime(18, 0)->toDateTimeString(),
        'ends_at' => now()->addDay()->setTime(22, 0)->toDateTimeString(),
        'skill_level' => 'all_levels',
        'team_size' => 'doubles',
        'format' => 'bracket',
    ])->assertSessionHasErrors(['bracket_format', 'bracket_generation']);
});

it('shows the courts and the line on the manage and player pages', function () {
    $session = stackSession(courts: 1);
    $players = stackRegister($session, 5);
    $staff = stackStaff();
    $this->actingAs($staff)->post(route('open-play.stack.everyone', $session));

    $this->actingAs($staff)
        ->get(route('open-play.manage', $session))
        ->assertInertia(fn (Assert $page) => $page
            ->component('open-play/manage')
            ->where('stack.playersPerCourt', 4)
            ->has('stack.courts', 1)
            ->has('stack.courts.0.players', 4)
            ->has('stack.waiting', 1)
            ->where('stack.waiting.0.playerId', $players->last()->id)
            ->has('stack.notStacked', 0));

    $me = $players->last();

    $this->actingAs($me->user)
        ->get(route('open-play.mine', $session))
        ->assertInertia(fn (Assert $page) => $page
            ->component('open-play/mine')
            ->where('myPlayerId', $me->id)
            ->where('stack.selfStackOpen', true)
            ->has('stack.waiting', 1)
            // Staff-only lists stay off the player's page.
            ->missing('stack.notStacked'));
});

it('leaves bracket sessions without a stack', function () {
    $session = OpenPlaySession::factory()->create(['format' => OpenPlayFormat::Bracket]);

    $this->actingAs(stackStaff())
        ->get(route('open-play.manage', $session))
        ->assertInertia(fn (Assert $page) => $page->where('stack', null));
});
