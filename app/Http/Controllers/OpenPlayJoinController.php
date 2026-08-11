<?php

namespace App\Http\Controllers;

use App\Models\OpenPlaySession;
use App\Models\OpenPlayRegistration;
use App\Models\Player;
use App\Services\OpenPlayRegistrationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OpenPlayJoinController extends Controller
{
    public function __construct(
        private readonly OpenPlayRegistrationService $registrationService,
    ) {}

    public function browse(Request $request): Response
    {
        $user = $request->user();
        $playerIds = $user->players()->pluck('id');

        $sessions = OpenPlaySession::query()
            ->withCount('registrations')
            ->with([
                'registrations.player.user:id,name',
                'registrations.partner.user:id,name',
            ])
            ->orderByDesc('starts_at')
            ->get()
            ->map(fn (OpenPlaySession $session) => [
                ...$session->toArray(),
                'is_registered' => $session->registrations
                    ->contains(fn (OpenPlayRegistration $registration) => $playerIds->contains($registration->player_id)
                        || $playerIds->contains($registration->partner_player_id)),
                'is_full' => $session->max_players !== null
                    && $session->registrations_count >= $session->max_players,
            ]);

        return Inertia::render('open-play/browse', [
            'sessions' => $sessions,
        ]);
    }

    public function show(OpenPlaySession $open_play): Response
    {
        $open_play->load([
            'registrations.player:id,user_id',
            'registrations.player.user:id,name',
            'registrations.partner:id,user_id',
            'registrations.partner.user:id,name',
            'matches' => fn ($query) => $query->orderBy('round')->orderBy('bracket_position'),
            'matches.entry1.player:id,user_id',
            'matches.entry1.player.user:id,name',
            'matches.entry1.partner:id,user_id',
            'matches.entry1.partner.user:id,name',
            'matches.entry2.player:id,user_id',
            'matches.entry2.player.user:id,name',
            'matches.entry2.partner:id,user_id',
            'matches.entry2.partner.user:id,name',
        ]);

        return Inertia::render('open-play/show', [
            'session' => $open_play,
        ]);
    }

    public function mine(Request $request, OpenPlaySession $open_play): RedirectResponse|Response
    {
        $playerIds = $request->user()->players()->pluck('id');

        $registration = OpenPlayRegistration::query()
            ->where('open_play_session_id', $open_play->id)
            ->where(fn ($query) => $query
                ->whereIn('player_id', $playerIds)
                ->orWhereIn('partner_player_id', $playerIds))
            ->first();

        if ($registration === null) {
            return to_route('open-play.join', $open_play);
        }

        $open_play->load([
            'registrations.player:id,user_id',
            'registrations.player.user:id,name',
            'registrations.partner:id,user_id',
            'registrations.partner.user:id,name',
            'matches' => fn ($query) => $query->orderBy('round')->orderBy('bracket_position'),
            'matches.entry1.player:id,user_id',
            'matches.entry1.player.user:id,name',
            'matches.entry1.partner:id,user_id',
            'matches.entry1.partner.user:id,name',
            'matches.entry2.player:id,user_id',
            'matches.entry2.player.user:id,name',
            'matches.entry2.partner:id,user_id',
            'matches.entry2.partner.user:id,name',
        ]);

        return Inertia::render('open-play/mine', [
            'session' => $open_play,
            'registrationId' => $registration->id,
        ]);
    }

    public function join(Request $request, OpenPlaySession $open_play): Response
    {
        $registrationsCount = $open_play->registrations()->count();

        $player = $request->user()->players()->first();

        $isRegistered = $player !== null && $open_play->registrations()
            ->where(fn ($query) => $query
                ->where('player_id', $player->id)
                ->orWhere('partner_player_id', $player->id))
            ->exists();

        $open_play->load([
            'registrations.player:id,user_id',
            'registrations.player.user:id,name',
            'registrations.partner:id,user_id',
            'registrations.partner.user:id,name',
        ]);

        return Inertia::render('open-play/join', [
            'session' => $open_play,
            'registrationsCount' => $registrationsCount,
            'isRegistered' => $isRegistered,
            'isFull' => $open_play->max_players !== null && $registrationsCount >= $open_play->max_players,
            'needsProfile' => $player === null || $player->birthdate === null,
        ]);
    }

    public function store(Request $request, OpenPlaySession $open_play): RedirectResponse
    {
        if ($open_play->is_registration_closed) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Registration for this session has closed.')]);

            return back();
        }

        $registrationsCount = $open_play->registrations()->count();

        if ($open_play->max_players !== null && $registrationsCount >= $open_play->max_players) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This session is full.')]);

            return back();
        }

        $validated = $request->validate([
            'partner_player_id' => ['nullable', 'integer', 'exists:players,id'],
        ]);

        $player = Player::query()->firstOrCreate([
            'user_id' => $request->user()->id,
        ]);

        if ($player->birthdate === null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Please add your birthdate to your profile before joining Open Play.')]);

            return to_route('profile.edit');
        }

        $partner = isset($validated['partner_player_id'])
            ? Player::query()->findOrFail($validated['partner_player_id'])
            : null;

        $error = $this->registrationService->register($open_play, $player, $partner, $request->user()->id);

        if ($error !== null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __($error)]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __("You're registered! See you on the court.")]);

        return back();
    }
}
