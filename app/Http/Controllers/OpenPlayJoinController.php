<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Models\OpenPlaySession;
use App\Models\OpenPlayRegistration;
use App\Models\Player;
use App\Services\OpenPlayRegistrationService;
use App\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class OpenPlayJoinController extends Controller
{
    public function __construct(
        private readonly OpenPlayRegistrationService $registrationService,
        private readonly PaymentService $paymentService,
    ) {}

    public function browse(Request $request): Response
    {
        $user = $request->user();
        $playerIds = $user->players()->pluck('id');

        $sessions = OpenPlaySession::query()
            ->withCount(['registrations as registrations_count' => fn ($query) => $query->where('payment_status', PaymentStatus::Paid)])
            ->with([
                'registrations' => fn ($query) => $query->where('payment_status', PaymentStatus::Paid),
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
            'registrations' => fn ($query) => $query->where('payment_status', PaymentStatus::Paid),
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
            ->where('payment_status', PaymentStatus::Paid)
            ->where(fn ($query) => $query
                ->whereIn('player_id', $playerIds)
                ->orWhereIn('partner_player_id', $playerIds))
            ->first();

        if ($registration === null) {
            return to_route('open-play.join', $open_play);
        }

        $open_play->load([
            'registrations' => fn ($query) => $query->where('payment_status', PaymentStatus::Paid),
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
        $player = $request->user()->players()->first();

        $myRegistration = $player !== null
            ? OpenPlayRegistration::query()
                ->where('open_play_session_id', $open_play->id)
                ->where(fn ($query) => $query
                    ->where('player_id', $player->id)
                    ->orWhere('partner_player_id', $player->id))
                ->first()
            : null;

        $registrationsCount = $open_play->registrations()->where('payment_status', PaymentStatus::Paid)->count();

        $open_play->load([
            'registrations' => fn ($query) => $query->where('payment_status', PaymentStatus::Paid),
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

        return Inertia::render('open-play/join', [
            'session' => $open_play,
            'registrationsCount' => $registrationsCount,
            'isRegistered' => $myRegistration !== null && $myRegistration->payment_status === PaymentStatus::Paid,
            'paymentPending' => $myRegistration !== null && $myRegistration->payment_status === PaymentStatus::Unpaid,
            'isFull' => $open_play->max_players !== null && $registrationsCount >= $open_play->max_players,
            'needsProfile' => $player === null || $player->birthdate === null,
            'myRegistrationId' => $myRegistration?->payment_status === PaymentStatus::Paid ? $myRegistration->id : null,
        ]);
    }

    public function store(Request $request, OpenPlaySession $open_play): RedirectResponse
    {
        if ($open_play->is_registration_closed) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Registration for this session has closed.')]);

            return back();
        }

        $registrationsCount = $open_play->registrations()->where('payment_status', PaymentStatus::Paid)->count();

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

        $pendingRegistration = OpenPlayRegistration::query()
            ->where('open_play_session_id', $open_play->id)
            ->where('player_id', $player->id)
            ->where('payment_status', PaymentStatus::Unpaid)
            ->exists();

        if ($pendingRegistration) {
            return to_route('open-play.checkout', $open_play);
        }

        $partner = isset($validated['partner_player_id'])
            ? Player::query()->findOrFail($validated['partner_player_id'])
            : null;

        $result = $this->registrationService->register($open_play, $player, $partner, $request->user()->id);

        if (is_string($result)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __($result)]);

            return back();
        }

        if ($result->payment_status === PaymentStatus::Unpaid) {
            return to_route('open-play.checkout', $open_play);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __("You're registered! See you on the court.")]);

        return back();
    }

    public function showCheckout(Request $request, OpenPlaySession $open_play): RedirectResponse|Response
    {
        // Not filtered to unpaid only: once PayMongo confirms payment (via
        // webhook -> broadcast -> a partial reload of this same page), the
        // registration is already paid by the time this reloads. Redirecting
        // away here would yank the customer off the checkout page instead of
        // letting the "Payment Successful" confirmation step render.
        $registration = $this->registrationFor($request, $open_play);

        if ($registration === null) {
            return to_route('open-play.join', $open_play);
        }

        // Deliberately not filtered by qr_expires_at > now() — an expired QR
        // still needs to be reported to the frontend so a page refresh keeps
        // the customer on the payment step (with a "generate new QR" prompt)
        // instead of silently bouncing them back to step 1.
        $pendingPayment = $registration->payments()
            ->where('status', PaymentStatus::Pending)
            ->latest()
            ->first();

        Log::info('checkout.show.qr_state', [
            'registration_id' => $registration->id,
            'payment_id' => $pendingPayment?->id,
            'qr_expires_at' => $pendingPayment?->qr_expires_at?->toIso8601String(),
            'qr_expires_at_is_future' => $pendingPayment?->qr_expires_at?->isFuture(),
            'now' => now()->toIso8601String(),
        ]);

        return Inertia::render('open-play/checkout', [
            'session' => $open_play,
            'registration' => $registration,
            'qrPayment' => $pendingPayment ? [
                'id' => $pendingPayment->id,
                'qrCodeUrl' => $pendingPayment->qr_code_url,
                'expiresAt' => $pendingPayment->qr_expires_at,
            ] : null,
        ]);
    }

    public function checkout(Request $request, OpenPlaySession $open_play): RedirectResponse|Response
    {
        $request->validate([
            'payment_method' => ['required', 'in:qrph'],
        ]);

        $registration = $this->unpaidRegistrationFor($request, $open_play);

        if ($registration === null) {
            return to_route('open-play.join', $open_play);
        }

        $payment = $this->paymentService->createQrphPaymentForOpenPlayRegistration($registration, $request->user());

        Log::info('checkout.generate.qr_state', [
            'registration_id' => $registration->id,
            'payment_id' => $payment->id,
            'qr_expires_at' => $payment->qr_expires_at?->toIso8601String(),
            'qr_expires_at_is_future' => $payment->qr_expires_at?->isFuture(),
            'now' => now()->toIso8601String(),
        ]);

        return Inertia::render('open-play/checkout', [
            'session' => $open_play,
            'registration' => $registration,
            'qrPayment' => [
                'id' => $payment->id,
                'qrCodeUrl' => $payment->qr_code_url,
                'expiresAt' => $payment->qr_expires_at,
            ],
        ]);
    }

    private function unpaidRegistrationFor(Request $request, OpenPlaySession $open_play): ?OpenPlayRegistration
    {
        $player = $request->user()->players()->first();

        if ($player === null) {
            return null;
        }

        return OpenPlayRegistration::query()
            ->where('open_play_session_id', $open_play->id)
            ->where('player_id', $player->id)
            ->where('payment_status', PaymentStatus::Unpaid)
            ->first();
    }

    private function registrationFor(Request $request, OpenPlaySession $open_play): ?OpenPlayRegistration
    {
        $player = $request->user()->players()->first();

        if ($player === null) {
            return null;
        }

        return OpenPlayRegistration::query()
            ->where('open_play_session_id', $open_play->id)
            ->where('player_id', $player->id)
            ->latest()
            ->first();
    }
}
