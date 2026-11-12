<?php

namespace App\Services;

use App\Enums\OpenPlayStackStatus;
use App\Enums\PaymentStatus;
use App\Exceptions\OpenPlayStackException;
use App\Models\OpenPlayRegistration;
use App\Models\OpenPlaySession;
use App\Models\OpenPlayStackEntry;
use App\Models\Player;
use App\Models\Resource;
use App\Models\User;
use Closure;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Runs a paddle-stacking open play session.
 *
 * Players "stack their paddle" to join the line. Whenever a reserved court
 * is free and enough players are waiting (4 for doubles, 2 for singles), the
 * front of the line is sent to it. When a game ends, everyone on that court
 * goes to the back of the line and the next group is called.
 *
 * Every change runs under a lock on the session row, so two staff phones (or
 * a player and staff) tapping at once can't put a player on two courts.
 */
class OpenPlayStackService
{
    /**
     * Put a registered player at the back of the line, then fill free courts.
     *
     * Staff may stack any player on the session's list, paid or not — they
     * settle payment at the counter. Players stacking themselves go through
     * stackSelf(), which requires a paid spot.
     *
     * @throws OpenPlayStackException
     */
    public function stack(OpenPlaySession $session, Player $player): void
    {
        $this->assertPaddleStacking($session);

        if (! $this->registeredPlayerIds($session)->contains($player->id)) {
            throw new OpenPlayStackException(__('Register this player for the session first.'));
        }

        $this->locked($session, function () use ($session, $player): void {
            $this->placeAtBack($session, $player->id);
            $this->fillCourts($session);
        });
    }

    /**
     * Stack every paid player who hasn't been stacked yet, in the order they
     * registered. Players sitting out stay out.
     *
     * @return int How many players were stacked.
     *
     * @throws OpenPlayStackException
     */
    public function stackEveryone(OpenPlaySession $session): int
    {
        $this->assertPaddleStacking($session);

        return $this->locked($session, function () use ($session): int {
            $stacked = $session->stackEntries()->pluck('player_id');
            $newcomers = $this->registeredPlayerIds($session, paidOnly: true)->diff($stacked)->values();
            $position = $this->nextPosition($session);

            foreach ($newcomers as $playerId) {
                $session->stackEntries()->create([
                    'player_id' => $playerId,
                    'status' => OpenPlayStackStatus::Waiting,
                    'position' => $position++,
                ]);
            }

            $this->fillCourts($session);

            return $newcomers->count();
        });
    }

    /**
     * A player stacking their own paddle from their phone.
     *
     * @throws OpenPlayStackException
     */
    public function stackSelf(OpenPlaySession $session, User $user): void
    {
        $playerId = $this->selfPlayerId($session, $user);

        $this->locked($session, function () use ($session, $playerId): void {
            $this->placeAtBack($session, $playerId);
            $this->fillCourts($session);
        });
    }

    /**
     * Take a player out of the line (or off a court). Their games played are
     * kept, and stacking them again puts them at the back.
     *
     * @throws OpenPlayStackException
     */
    public function sitOut(OpenPlaySession $session, OpenPlayStackEntry $entry): void
    {
        $this->assertPaddleStacking($session);

        $this->locked($session, function () use ($entry): void {
            $entry->refresh()->update([
                'status' => OpenPlayStackStatus::SittingOut,
                'resource_id' => null,
            ]);
        });
    }

    /**
     * A player pulling their own paddle from the line. Not while they're on a
     * court: the other players there are counting on them to finish.
     *
     * @throws OpenPlayStackException
     */
    public function sitOutSelf(OpenPlaySession $session, User $user): void
    {
        $playerId = $this->selfPlayerId($session, $user);

        $this->locked($session, function () use ($session, $playerId): void {
            $entry = $session->stackEntries()->where('player_id', $playerId)->first();

            if ($entry === null || $entry->status === OpenPlayStackStatus::SittingOut) {
                throw new OpenPlayStackException(__('Your paddle is not in the stack.'));
            }

            if ($entry->status === OpenPlayStackStatus::Playing) {
                throw new OpenPlayStackException(__('Finish your game first — you are on court right now.'));
            }

            $entry->update(['status' => OpenPlayStackStatus::SittingOut]);
        });
    }

    /**
     * The game on a court has ended: its players go to the back of the line,
     * in the order they came on, and the next group is called.
     *
     * @throws OpenPlayStackException
     */
    public function finishGame(OpenPlaySession $session, Resource $court): void
    {
        $this->assertPaddleStacking($session);

        $this->locked($session, function () use ($session, $court): void {
            $players = $session->stackEntries()
                ->where('status', OpenPlayStackStatus::Playing)
                ->where('resource_id', $court->id)
                ->orderBy('position')
                ->orderBy('id')
                ->get();

            if ($players->isEmpty()) {
                throw new OpenPlayStackException(__('There is no game on :court right now.', ['court' => $court->name]));
            }

            $position = $this->nextPosition($session);

            foreach ($players as $entry) {
                $entry->update([
                    'status' => OpenPlayStackStatus::Waiting,
                    'resource_id' => null,
                    'position' => $position++,
                    'games_played' => $entry->games_played + 1,
                ]);
            }

            $this->fillCourts($session);
        });
    }

    /**
     * What the courts and the line look like right now, or null for a
     * bracket session.
     *
     * Players see the courts and the line. Staff also get who is sitting out
     * and who has registered but not stacked yet, to stack them.
     *
     * @return array<string, mixed>|null
     */
    public function board(OpenPlaySession $session, bool $forStaff = false): ?array
    {
        if (! $session->isPaddleStacking()) {
            return null;
        }

        $entries = $session->stackEntries()
            ->with(['player:id,user_id,gender', 'player.user:id,name,avatar'])
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        $byStatus = $entries->groupBy(fn (OpenPlayStackEntry $entry): string => $entry->status->value);
        $playing = $byStatus->get(OpenPlayStackStatus::Playing->value, collect())->groupBy('resource_id');

        $courts = $this->courts($session)->map(fn (Resource $court): array => [
            'id' => $court->id,
            'name' => $court->name,
            'players' => $playing->get($court->id, collect())->map($this->present(...))->values()->all(),
        ]);

        $board = [
            'playersPerCourt' => $session->team_size->playersPerCourt(),
            'selfStackOpen' => $session->acceptsSelfStacking(),
            'courts' => $courts->values()->all(),
            'waiting' => $byStatus->get(OpenPlayStackStatus::Waiting->value, collect())->map($this->present(...))->values()->all(),
        ];

        if (! $forStaff) {
            return $board;
        }

        return [
            ...$board,
            'sittingOut' => $byStatus->get(OpenPlayStackStatus::SittingOut->value, collect())->map($this->present(...))->values()->all(),
            'notStacked' => $this->notStacked($session, $entries->pluck('player_id')),
        ];
    }

    /**
     * @throws OpenPlayStackException
     */
    private function selfPlayerId(OpenPlaySession $session, User $user): int
    {
        $this->assertPaddleStacking($session);

        if (! $session->acceptsSelfStacking()) {
            throw new OpenPlayStackException(__('The paddle stack opens :minutes minutes before the session starts.', [
                'minutes' => OpenPlaySession::SELF_STACK_OPENS_MINUTES,
            ]));
        }

        return $session->seatedPlayerIdFor($user)
            ?? throw new OpenPlayStackException(__('Only registered players can stack a paddle in this session.'));
    }

    /**
     * @throws OpenPlayStackException
     */
    private function placeAtBack(OpenPlaySession $session, int $playerId): void
    {
        $entry = $session->stackEntries()->firstOrNew(['player_id' => $playerId]);

        if ($entry->exists && $entry->status === OpenPlayStackStatus::Waiting) {
            throw new OpenPlayStackException(__('That paddle is already in the stack.'));
        }

        if ($entry->exists && $entry->status === OpenPlayStackStatus::Playing) {
            throw new OpenPlayStackException(__('That player is on court right now.'));
        }

        $entry->fill([
            'status' => OpenPlayStackStatus::Waiting,
            'resource_id' => null,
            'position' => $this->nextPosition($session),
        ])->save();
    }

    /**
     * Send the front of the line to each free court, while enough players
     * are waiting to make up a full game.
     */
    private function fillCourts(OpenPlaySession $session): void
    {
        $perCourt = $session->team_size->playersPerCourt();

        $busy = $session->stackEntries()
            ->where('status', OpenPlayStackStatus::Playing)
            ->whereNotNull('resource_id')
            ->distinct()
            ->pluck('resource_id');

        foreach ($this->courts($session)->reject(fn (Resource $court): bool => $busy->contains($court->id)) as $court) {
            $next = $session->stackEntries()
                ->where('status', OpenPlayStackStatus::Waiting)
                ->orderBy('position')
                ->orderBy('id')
                ->limit($perCourt)
                ->pluck('id');

            if ($next->count() < $perCourt) {
                return;
            }

            OpenPlayStackEntry::query()->whereKey($next)->update([
                'status' => OpenPlayStackStatus::Playing,
                'resource_id' => $court->id,
            ]);
        }
    }

    /**
     * The session's reserved courts, in court-number order.
     *
     * @return Collection<int, resource>
     */
    private function courts(OpenPlaySession $session): Collection
    {
        return $session->resources()
            ->orderBy('resource_number')
            ->orderBy('name')
            ->get(['resources.id', 'resources.name'])
            ->toBase();
    }

    private function nextPosition(OpenPlaySession $session): int
    {
        return (int) $session->stackEntries()->max('position') + 1;
    }

    /**
     * Everyone on the session's list: each registration's player and their
     * named partner.
     *
     * @return Collection<int, int>
     */
    private function registeredPlayerIds(OpenPlaySession $session, bool $paidOnly = false): Collection
    {
        return $session->registrations()
            ->when($paidOnly, fn ($query) => $query->where('payment_status', PaymentStatus::Paid))
            ->orderBy('id')
            ->get(['player_id', 'partner_player_id'])
            ->flatMap(fn (OpenPlayRegistration $registration): array => [$registration->player_id, $registration->partner_player_id])
            ->filter()
            ->unique()
            ->values()
            ->toBase();
    }

    /**
     * Registered players with no stack entry yet, for staff to stack.
     *
     * @param  Collection<int, int>  $stackedPlayerIds
     * @return list<array<string, mixed>>
     */
    private function notStacked(OpenPlaySession $session, Collection $stackedPlayerIds): array
    {
        $registrations = $session->registrations()
            ->with(['player:id,user_id,gender', 'player.user:id,name,avatar', 'partner:id,user_id,gender', 'partner.user:id,name,avatar'])
            ->orderBy('id')
            ->get();

        return $registrations
            ->flatMap(fn (OpenPlayRegistration $registration): array => array_filter([
                [$registration->player, $registration->payment_status],
                $registration->partner !== null ? [$registration->partner, $registration->payment_status] : null,
            ]))
            ->reject(fn (array $pair): bool => $pair[0] === null || $stackedPlayerIds->contains($pair[0]->id))
            ->unique(fn (array $pair): int => $pair[0]->id)
            ->map(fn (array $pair): array => [
                'playerId' => $pair[0]->id,
                'name' => $pair[0]->user?->name ?? __('Player #:id', ['id' => $pair[0]->id]),
                'avatar' => $pair[0]->user?->avatar,
                'gender' => $pair[0]->gender,
                'paid' => $pair[1] === PaymentStatus::Paid,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function present(OpenPlayStackEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'playerId' => $entry->player_id,
            'name' => $entry->player?->user?->name ?? __('Player #:id', ['id' => $entry->player_id]),
            'avatar' => $entry->player?->user?->avatar,
            'gender' => $entry->player?->gender,
            'gamesPlayed' => $entry->games_played,
        ];
    }

    /**
     * @throws OpenPlayStackException
     */
    private function assertPaddleStacking(OpenPlaySession $session): void
    {
        if (! $session->isPaddleStacking()) {
            throw new OpenPlayStackException(__('This session runs as a bracket, not paddle stacking.'));
        }
    }

    /**
     * Run a stack change while holding the session row, so concurrent taps
     * apply one after the other instead of racing.
     *
     * @template T
     *
     * @param  Closure(): T  $callback
     * @return T
     */
    private function locked(OpenPlaySession $session, Closure $callback): mixed
    {
        return DB::transaction(function () use ($session, $callback): mixed {
            OpenPlaySession::query()->whereKey($session->id)->lockForUpdate()->first(['id']);

            return $callback();
        });
    }
}
