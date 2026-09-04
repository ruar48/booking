<?php

namespace App\Http\Controllers;

use App\Actions\Booking\CreateBooking;
use App\Actions\Booking\CreateBulkBookings;
use App\Actions\Booking\CreateWalkInBookings;
use App\Actions\Booking\SetDateAvailability;
use App\Actions\Booking\StartQrphCheckout;
use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Events\BookingFailed;
use App\Exceptions\BookingConflictException;
use App\Http\Requests\Booking\CheckoutRequest;
use App\Http\Requests\Booking\CloseDateRequest;
use App\Http\Requests\Booking\ReopenDateRequest;
use App\Http\Requests\Booking\RescheduleResourceBookingRequest;
use App\Http\Requests\Booking\SearchCustomersRequest;
use App\Http\Requests\Booking\StoreBulkResourceBookingRequest;
use App\Http\Requests\Booking\StoreResourceBookingRequest;
use App\Http\Requests\Booking\StoreWalkInBookingRequest;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\User;
use App\Services\Booking\BookingPresenter;
use App\Services\Booking\BookingScheduleService;
use App\Services\ResourceBookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ResourceBookingController extends Controller
{
    public function __construct(
        private readonly ResourceBookingRepositoryInterface $bookingRepository,
        private readonly ResourceBookingService $bookingService,
        private readonly BookingScheduleService $scheduleService,
        private readonly BookingPresenter $presenter,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ResourceBooking::class);

        $user = $request->user();
        $filters = $request->only(['search', 'status', 'payment_status', 'resource_id', 'date']);
        $canManage = $user->isVenueAdmin();

        $bookings = $this->bookingRepository->paginateForUser($user, $filters);
        $bookings->through(fn (ResourceBooking $booking) => $this->presenter->withPermissionFlags($booking, $user));

        $nextBooking = $canManage ? null : $this->bookingRepository->nextBookingForUser($user);

        return Inertia::render('bookings/index', [
            'bookings' => $bookings,
            'canManage' => $canManage,
            'filters' => $filters,
            'resources' => $canManage
                ? Resource::query()->orderBy('name')->get(['id', 'name'])
                : [],
            'stats' => $canManage ? null : $this->bookingRepository->statsForUser($user),
            'nextBooking' => $nextBooking
                ? $this->presenter->withPermissionFlags($nextBooking, $user)
                : null,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', ResourceBooking::class);

        return Inertia::render('bookings/create', $this->scheduleService->pickerData($request->user()));
    }

    public function store(StoreResourceBookingRequest $request, CreateBooking $createBooking): RedirectResponse
    {
        $user = $request->user();

        try {
            $booking = $createBooking->execute($request->validated(), $user->id);
        } catch (BookingConflictException $e) {
            event(new BookingFailed(
                $user,
                (int) $request->validated('resource_id'),
                Carbon::parse($request->validated('starts_at')),
                Carbon::parse($request->validated('ends_at')),
                $e->getMessage(),
            ));

            throw $this->slotUnavailable($e);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking confirmed. Complete payment to secure your reservation.')]);

        return to_route('bookings.checkout', $booking);
    }

    public function storeBulk(StoreBulkResourceBookingRequest $request, CreateBulkBookings $createBulk): RedirectResponse
    {
        $bookings = $request->validated('bookings');

        try {
            $first = $createBulk->execute($bookings, $request->user());
        } catch (BookingConflictException $e) {
            throw $this->slotUnavailable($e);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':count booking(s) submitted.', ['count' => count($bookings)]),
        ]);

        return to_route('bookings.checkout', $first);
    }

    public function storeWalkIn(StoreWalkInBookingRequest $request, CreateWalkInBookings $createWalkIn): RedirectResponse
    {
        try {
            $count = $createWalkIn->execute(
                $request->validated('customer'),
                $request->validated('bookings'),
                $request->boolean('mark_paid'),
                $request->user(),
            );
        } catch (BookingConflictException $e) {
            throw $this->slotUnavailable($e);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':count booking(s) submitted.', ['count' => $count]),
        ]);

        return to_route('bookings.index');
    }

    public function searchCustomers(SearchCustomersRequest $request): JsonResponse
    {
        $query = $request->validated('q');

        return response()->json(
            User::query()
                ->where('name', 'like', "%{$query}%")
                ->orWhere('phone', 'like', "%{$query}%")
                ->limit(10)
                ->get(['id', 'name', 'phone']),
        );
    }

    public function show(Request $request, ResourceBooking $booking): Response
    {
        $this->authorize('view', $booking);

        return Inertia::render('bookings/show', $this->presenter->showProps($booking, $request->user()));
    }

    public function showCheckout(Request $request, ResourceBooking $booking): Response
    {
        $this->authorize('view', $booking);

        // Deliberately not filtered by qr_expires_at > now() — an expired QR
        // still has to reach the frontend so a refresh keeps the customer on
        // the payment step (with a "generate new QR" prompt) instead of
        // silently bouncing them back to step 1.
        $pendingPayment = $booking->payments()
            ->where('payment_method', PaymentMethod::Qrph->value)
            ->where('status', PaymentStatus::Pending)
            ->latest()
            ->first();

        Log::info('checkout.show.qr_state', [
            'booking_id' => $booking->id,
            'payment_id' => $pendingPayment?->id,
            'qr_expires_at' => $pendingPayment?->qr_expires_at?->toIso8601String(),
            'qr_expires_at_is_future' => $pendingPayment?->qr_expires_at?->isFuture(),
            'now' => now()->toIso8601String(),
        ]);

        return Inertia::render('bookings/checkout', [
            ...$this->presenter->showProps($booking, $request->user()),
            'qrPayment' => $pendingPayment ? [
                'id' => $pendingPayment->id,
                'qrCodeUrl' => $pendingPayment->qr_code_url,
                'expiresAt' => $pendingPayment->qr_expires_at,
            ] : null,
        ]);
    }

    public function checkout(CheckoutRequest $request, ResourceBooking $booking, StartQrphCheckout $startCheckout): Response
    {
        return Inertia::render('bookings/checkout', [
            ...$this->presenter->showProps($booking, $request->user()),
            'qrPayment' => $startCheckout->execute($booking, $request->user()),
        ]);
    }

    public function markPaid(ResourceBooking $booking): RedirectResponse
    {
        $this->authorize('markPaid', $booking);

        $this->bookingService->markGroupPaid($booking);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment marked as paid.')]);

        return to_route('bookings.show', $booking);
    }

    public function cancel(Request $request, ResourceBooking $booking): RedirectResponse
    {
        $this->authorize('cancel', $booking);

        $this->bookingService->cancelGroup($booking, $request->input('cancellation_reason'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking cancelled.')]);

        return to_route('bookings.show', $booking);
    }

    public function editReschedule(Request $request, ResourceBooking $booking): Response
    {
        $this->authorize('reschedule', $booking);

        return Inertia::render('bookings/reschedule', [
            'booking' => $booking->load('resource'),
            ...$this->scheduleService->pickerData($request->user(), $booking->id),
        ]);
    }

    public function reschedule(RescheduleResourceBookingRequest $request, ResourceBooking $booking): RedirectResponse
    {
        try {
            $rescheduled = $this->bookingService->reschedule(
                $booking,
                (int) $request->validated('resource_id'),
                Carbon::parse($request->validated('starts_at')),
                Carbon::parse($request->validated('ends_at')),
            );
        } catch (BookingConflictException $e) {
            throw $this->slotUnavailable($e);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking rescheduled.')]);

        return to_route('bookings.show', $rescheduled);
    }

    public function calendar(Request $request): Response
    {
        $this->authorize('viewAny', ResourceBooking::class);

        return Inertia::render('bookings/calendar', [
            ...$this->scheduleService->calendarData($request->input('start'), $request->input('end')),
            'filters' => $request->only(['start', 'end']),
        ]);
    }

    public function closeDate(CloseDateRequest $request, SetDateAvailability $availability): RedirectResponse
    {
        $availability->close(
            $request->validated('date'),
            $request->validated('reason'),
            $request->user(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Date closed. Members cannot book on this date until it is reopened.')]);

        return $this->redirectToCalendar($request->validated());
    }

    public function reopenDate(ReopenDateRequest $request, SetDateAvailability $availability): RedirectResponse
    {
        $availability->open(
            $request->validated('date'),
            $request->validated('open_time'),
            $request->validated('close_time'),
            $request->user(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Date opened for bookings.')]);

        return $this->redirectToCalendar($request->validated());
    }

    /**
     * A booking conflict is a domain failure; the HTTP layer is where it turns
     * into a field-level validation error the form can display.
     */
    private function slotUnavailable(BookingConflictException $e): ValidationException
    {
        return ValidationException::withMessages(['starts_at' => $e->getMessage()]);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function redirectToCalendar(array $validated): RedirectResponse
    {
        if (empty($validated['redirect_start']) || empty($validated['redirect_end'])) {
            return back();
        }

        return redirect()->route('bookings.calendar', [
            'start' => $validated['redirect_start'],
            'end' => $validated['redirect_end'],
        ]);
    }
}
