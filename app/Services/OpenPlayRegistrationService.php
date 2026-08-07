<?php

namespace App\Services;

use App\Enums\TeamSize;
use App\Models\OpenPlaySession;
use App\Models\OpenPlayRegistration;
use App\Models\Player;

class OpenPlayRegistrationService
{
    /**
     * @return string|null An error message, or null on success.
     */
    public function register(OpenPlaySession $event, Player $player, ?Player $partner, int $createdBy): ?string
    {
        if ($this->isRegistered($event, $player)) {
            return 'This player is already registered for this session.';
        }

        if ($event->team_size !== TeamSize::Doubles) {
            OpenPlayRegistration::query()->create([
                'open_play_session_id' => $event->id,
                'player_id' => $player->id,
                'created_by' => $createdBy,
            ]);

            return null;
        }

        if ($partner !== null) {
            if ($partner->id === $player->id) {
                return 'Choose a different player as your partner.';
            }

            if ($this->isRegistered($event, $partner)) {
                return 'Your partner is already registered for this session.';
            }

            OpenPlayRegistration::query()->create([
                'open_play_session_id' => $event->id,
                'player_id' => $player->id,
                'partner_player_id' => $partner->id,
                'created_by' => $createdBy,
            ]);

            return null;
        }

        // No partner specified — pair with whoever is already waiting for a
        // random partner, or register solo and wait to be paired.
        $waitingSolo = $event->registrations()
            ->whereNull('partner_player_id')
            ->where('player_id', '!=', $player->id)
            ->oldest('id')
            ->first();

        if ($waitingSolo !== null) {
            $waitingSolo->update(['partner_player_id' => $player->id]);

            return null;
        }

        OpenPlayRegistration::query()->create([
            'open_play_session_id' => $event->id,
            'player_id' => $player->id,
            'created_by' => $createdBy,
        ]);

        return null;
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
            if ($this->register($event, $player, null, $createdBy) === null) {
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

        $solos = $event->registrations()->whereNull('partner_player_id')->get()->shuffle()->values();
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
