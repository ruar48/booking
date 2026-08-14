<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\TeamSize;
use App\Models\OpenPlaySession;
use App\Models\OpenPlayRegistration;
use App\Models\Player;

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
