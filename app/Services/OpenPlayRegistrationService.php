<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\TeamSize;
use App\Models\OpenPlaySession;
use App\Models\OpenPlayRegistration;
use App\Models\Player;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class OpenPlayRegistrationService
{
    /**
     * Registers a player for a session. If the session charges a fee, the
     * registration is created unpaid and doesn't hold a roster slot (and
     * doubles random-pairing is deferred) until payment succeeds — see
     * PaymentService::markPaid(), which calls pairRandomly() afterward.
     *
     * @return OpenPlayRegistration|string The new registration, or an error message.
     */
    public function register(OpenPlaySession $event, Player $player, ?Player $partner, int $createdBy): OpenPlayRegistration|string
    {
        if ($this->isRegistered($event, $player)) {
            return 'This player is already registered for this session.';
        }

        $requiresPayment = $event->price_per_player !== null && (float) $event->price_per_player > 0;
        $attributes = [
            'payment_status' => $requiresPayment ? PaymentStatus::Unpaid : PaymentStatus::Paid,
            'amount' => $requiresPayment ? $event->price_per_player : 0,
        ];

        if ($event->team_size !== TeamSize::Doubles) {
            return OpenPlayRegistration::query()->create([
                'open_play_session_id' => $event->id,
                'player_id' => $player->id,
                'created_by' => $createdBy,
                ...$attributes,
            ]);
        }

        if ($partner !== null) {
            if ($partner->id === $player->id) {
                return 'Choose a different player as your partner.';
            }

            if ($this->isRegistered($event, $partner)) {
                return 'Your partner is already registered for this session.';
            }

            return OpenPlayRegistration::query()->create([
                'open_play_session_id' => $event->id,
                'player_id' => $player->id,
                'partner_player_id' => $partner->id,
                'created_by' => $createdBy,
                ...$attributes,
                // This one registration row seats both the player and their
                // partner, so the fee must cover both slots.
                'amount' => $requiresPayment ? $event->price_per_player * 2 : 0,
            ]);
        }

        // No partner specified — register solo and wait to be paired. Free
        // sessions pair immediately below; paid sessions wait until this
        // player's payment succeeds (see PaymentService::markPaid()).
        $registration = OpenPlayRegistration::query()->create([
            'open_play_session_id' => $event->id,
            'player_id' => $player->id,
            'created_by' => $createdBy,
            ...$attributes,
        ]);

        if (! $requiresPayment) {
            $this->pairRandomly($event);
        }

        return $registration;
    }

    /**
     * Registers a player together with friends they are paying for. One
     * payment covers the whole group: the lead registration carries the
     * total (price × everyone, computed here from the session price — never
     * from client input) and each friend's row carries 0, so revenue sums
     * stay correct. Friends are marked paid when the lead's payment succeeds
     * (see markGroupPaid()).
     *
     * @param  Collection<int, Player>  $friends
     * @return OpenPlayRegistration|string The lead registration, or an error message.
     */
    public function registerWithFriends(OpenPlaySession $event, Player $lead, Collection $friends, int $createdBy): OpenPlayRegistration|string
    {
        if ($event->team_size === TeamSize::Doubles) {
            return 'Paying for friends is only available for singles sessions.';
        }

        $friends = $friends->unique('id')->values();

        if ($friends->contains(fn (Player $friend) => $friend->id === $lead->id)) {
            return 'You are already part of this registration — pick other players.';
        }

        foreach ([$lead, ...$friends->all()] as $player) {
            if ($this->isRegistered($event, $player)) {
                return $player->id === $lead->id
                    ? 'This player is already registered for this session.'
                    : 'One of your friends is already registered for this session.';
            }
        }

        $requiresPayment = $event->price_per_player !== null && (float) $event->price_per_player > 0;
        $status = $requiresPayment ? PaymentStatus::Unpaid : PaymentStatus::Paid;
        $groupSize = $friends->count() + 1;

        return DB::transaction(function () use ($event, $lead, $friends, $createdBy, $requiresPayment, $status, $groupSize): OpenPlayRegistration {
            $leadRegistration = OpenPlayRegistration::query()->create([
                'open_play_session_id' => $event->id,
                'player_id' => $lead->id,
                'created_by' => $createdBy,
                'payment_status' => $status,
                'amount' => $requiresPayment ? round((float) $event->price_per_player * $groupSize, 2) : 0,
            ]);

            foreach ($friends as $friend) {
                OpenPlayRegistration::query()->create([
                    'open_play_session_id' => $event->id,
                    'player_id' => $friend->id,
                    'group_lead_id' => $leadRegistration->id,
                    'created_by' => $createdBy,
                    'payment_status' => $status,
                    'amount' => 0,
                ]);
            }

            return $leadRegistration;
        });
    }

    /**
     * Cascade a paid lead registration to the friends it covers.
     */
    public function markGroupPaid(OpenPlayRegistration $lead): void
    {
        $lead->groupMembers()->update(['payment_status' => PaymentStatus::Paid]);
    }

    /**
     * Register every active player not already registered, up to the
     * session's max_players cap (if any). Doubles sessions get their
     * solo entries paired up afterward via pairRandomly().
     *
     * @return int Number of players newly registered.
     */
    public function registerAll(OpenPlaySession $event, int $createdBy): int
    {
        $alreadyRegisteredIds = $event->registrations()
            ->get(['player_id', 'partner_player_id'])
            ->flatMap(fn (OpenPlayRegistration $registration) => [
                $registration->player_id,
                $registration->partner_player_id,
            ])
            ->filter()
            ->all();

        $slotsRemaining = $event->max_players !== null
            ? max(0, $event->max_players - $event->registrations()->count())
            : null;

        $candidates = Player::query()
            ->where('is_active', true)
            ->whereNotIn('id', $alreadyRegisteredIds)
            ->when($slotsRemaining !== null, fn ($query) => $query->limit($slotsRemaining))
            ->get();

        $registered = 0;

        foreach ($candidates as $player) {
            if (! is_string($this->register($event, $player, null, $createdBy))) {
                $registered++;
            }
        }

        if ($event->team_size === TeamSize::Doubles) {
            $this->pairRandomly($event);
        }

        return $registered;
    }

    /**
     * Randomly pair up any players still waiting for a partner.
     *
     * @return int Number of pairs formed.
     */
    public function pairRandomly(OpenPlaySession $event): int
    {
        if ($event->team_size !== TeamSize::Doubles) {
            return 0;
        }

        $solos = $event->registrations()
            ->whereNull('partner_player_id')
            ->where('payment_status', PaymentStatus::Paid)
            ->get()
            ->shuffle()
            ->values();
        $pairsFormed = 0;

        while ($solos->count() >= 2) {
            $first = $solos->shift();
            $second = $solos->shift();

            $first->update(['partner_player_id' => $second->player_id]);
            $second->delete();

            $pairsFormed++;
        }

        return $pairsFormed;
    }

    private function isRegistered(OpenPlaySession $event, Player $player): bool
    {
        return $event->registrations()
            ->where(fn ($query) => $query
                ->where('player_id', $player->id)
                ->orWhere('partner_player_id', $player->id))
            ->exists();
    }
}
