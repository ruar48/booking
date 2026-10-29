<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\TeamSize;
use App\Exceptions\PaymentUnavailableException;
use App\Models\OpenPlayRegistration;
use App\Models\OpenPlaySession;
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
        if (! $this->releaseFromUnpaidGroup($event, $player)) {
            return 'Another player is paying for you in this session right now. Try again in a few minutes.';
        }

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
            if (! $this->releaseFromUnpaidGroup($event, $player)) {
                return 'Someone in your group is being paid for by another player right now. Try again in a few minutes.';
            }

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
    /**
     * An unpaid registration holds no roster slot, so by the time the payer
     * reaches checkout the session may have started or filled up with paid
     * players. Taking their money then would seat more players than allowed
     * (or charge for a session that is already over).
     *
     * @throws PaymentUnavailableException
     */
    public function assertPayable(OpenPlayRegistration $lead): void
    {
        $session = $lead->openPlaySession;

        if ($session->starts_at !== null && $session->starts_at->isPast()) {
            throw new PaymentUnavailableException(__('This session has already started, so it can no longer be paid for.'));
        }

        // Someone named in this group may since have registered and paid on
        // their own; charging for them again would seat them twice.
        $partyIds = collect([$lead->player_id, $lead->partner_player_id])
            ->merge($lead->groupMembers()->pluck('player_id'))
            ->filter();

        $alreadySeated = $session->registrations()
            ->where('payment_status', PaymentStatus::Paid)
            ->where(fn ($query) => $query
                ->whereIn('player_id', $partyIds)
                ->orWhereIn('partner_player_id', $partyIds))
            ->exists();

        if ($alreadySeated) {
            throw new PaymentUnavailableException(__('Someone in your group is already registered for this session. Please register again without them.'));
        }

        if ($session->max_players === null) {
            return;
        }

        $partySize = ($lead->partner_player_id !== null ? 2 : 1) + $lead->groupMembers()->count();

        if ($session->registeredPlayersCount() + $partySize > $session->max_players) {
            throw new PaymentUnavailableException(__('This session filled up before your payment — there are no longer enough spots.'));
        }
    }

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

    /**
     * A player named as a "friend" in someone else's group that was never
     * paid for is taken back out of it, so they can register themselves (the
     * table allows one row per player per session). The group's total drops
     * by one seat. Refused while that group has a QR that can still be paid,
     * so nobody is charged for a seat that has just been given away.
     *
     * @return bool False when the player is held by a live payment.
     */
    private function releaseFromUnpaidGroup(OpenPlaySession $event, Player $player): bool
    {
        $held = $event->registrations()
            ->where('player_id', $player->id)
            ->whereNotNull('group_lead_id')
            ->where('payment_status', PaymentStatus::Unpaid)
            ->with('groupLead')
            ->first();

        if ($held === null) {
            return true;
        }

        $lead = $held->groupLead;

        $paying = $lead?->payments()
            ->where('status', PaymentStatus::Pending)
            ->where('qr_expires_at', '>', now())
            ->exists();

        if ($paying) {
            return false;
        }

        DB::transaction(function () use ($held, $lead, $event): void {
            $held->delete();

            if ($lead !== null && $lead->payment_status === PaymentStatus::Unpaid) {
                $lead->update([
                    'amount' => max(0, round((float) $lead->amount - (float) $event->price_per_player, 2)),
                ]);
            }
        });

        return true;
    }

    private function isRegistered(OpenPlaySession $event, Player $player): bool
    {
        // A paid spot always counts. An unpaid one counts only if it is the
        // player's own pending registration — otherwise anyone could lock a
        // stranger out by naming them as a friend or partner and never paying.
        return $event->registrations()
            ->where(fn ($query) => $query
                ->where(fn ($query) => $query
                    ->where('payment_status', PaymentStatus::Paid)
                    ->where(fn ($query) => $query
                        ->where('player_id', $player->id)
                        ->orWhere('partner_player_id', $player->id)))
                ->orWhere(fn ($query) => $query
                    ->where('payment_status', PaymentStatus::Unpaid)
                    ->where('player_id', $player->id)
                    ->whereNull('group_lead_id')))
            ->exists();
    }
}
