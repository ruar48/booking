<?php

namespace App\Http\Controllers;

use App\Actions\CreateWalkInCustomer;
use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Exceptions\BookingConflictException;
use App\Http\Requests\StoreBulkResourceBookingRequest;
use App\Http\Requests\StoreResourceBookingRequest;
use App\Http\Requests\StoreWalkInBookingRequest;
use App\Models\DateOverride;
use App\Models\Policy;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Models\User;
use App\Services\PaymentService;
use App\Services\ResourceBookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ResourceBookingController extends Controller
{
    public function __construct(
        private readonly ResourceBookingRepositoryInterface $resourceBookingRepository,
        private readonly ResourceBookingService $resourceBookingService,
        private readonly PaymentService $paymentService,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ResourceBooking::class);

        $user = $request->user();
        $filters = $request->only(['search', 'status', 'payment_status', 'resource_id', 'date']);
        $canManage = $user->isVenueAdmin();

        return Inertia::render('bookings/index', [
            'bookings' => $this->resourceBookingRepository->paginateForUser($user, $filters),
            'canManage' => $canManage,
            'filters' => $filters,
            'resources' => $canManage
                ? Resource::query()->orderBy('name')->get(['id', 'name'])
                : [],
            'stats' => $canManage ? null : $this->resourceBookingRepository->statsForUser($user),
            'nextBooking' => $canManage ? null : $this->resourceBookingRepository->nextBookingForUser($user),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', ResourceBooking::class);

        return Inertia::render('bookings/create', $this->bookingScheduleData());
    }

    public function store(StoreResourceBookingRequest $request): RedirectResponse
    {
        try {
            $booking = $this->resourceBookingService->create(
                $this->attributesForNewBooking(
                    $request->validated(),
                    $request->user()->id,
                ),
            );
        } catch (BookingConflictException $e) {
            throw ValidationException::withMessages(['starts_at' => $e->getMessage()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking confirmed. Complete payment to secure your reservation.')]);

        return to_route('bookings.checkout', $booking);
    }

    public function storeBulk(StoreBulkResourceBookingRequest $request): RedirectResponse
    {
        $firstBooking = null;

        try {
            foreach ($request->validated('bookings') as $data) {
                $booking = $this->resourceBookingService->create(
                    $this->attributesForNewBooking($data, $request->user()->id),
                );

                $firstBooking ??= $booking;
            }
        } catch (BookingConflictException $e) {
            throw ValidationException::withMessages(['starts_at' => $e->getMessage()]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':count booking(s) submitted.', ['count' => count($request->validated('bookings'))]),
        ]);

        return to_route('bookings.checkout', $firstBooking);
    }

    public function storeWalkIn(StoreWalkInBookingRequest $request, CreateWalkInCustomer $createWalkInCustomer): RedirectResponse
    {
        $customer = $request->validated('customer');
        $bookings = $request->validated('bookings');
        $markPaid = $request->boolean('mark_paid');

        try {
            DB::transaction(function () use ($customer, $bookings, $markPaid, $request, $createWalkInCustomer) {
                $customerId = $customer['mode'] === 'existing'
                    ? (int) $customer['user_id']
                    : $createWalkInCustomer->create($customer['name'], $customer['phone'])->id;

                foreach ($bookings as $data) {
                    $attributes = $this->attributesForNewBooking($data, $customerId);
                    $attributes['created_by'] = $request->user()->id;
                    // Walk-ins are confirmed in person by staff, not routed through
                    // the self-service checkout/payment-window flow.
                    $attributes['status'] = BookingStatus::Approved;

                    $booking = $this->resourceBookingService->create($attributes);

                    if ($markPaid) {
                        $this->resourceBookingRepository->update($booking, [
                            'payment_status' => PaymentStatus::Paid,
                        ]);
                    }
                }
            });
        } catch (BookingConflictException $e) {
            throw ValidationException::withMessages(['starts_at' => $e->getMessage()]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':count booking(s) submitted.', ['count' => count($bookings)]),
        ]);

        return to_route('bookings.index');
    }

    public function searchCustomers(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['required', 'string', 'min:2'],
        ]);

        $q = $request->string('q')->toString();

        $users = User::query()
            ->where('name', 'like', "%{$q}%")
            ->orWhere('phone', 'like', "%{$q}%")
            ->limit(10)
            ->get(['id', 'name', 'phone']);

        return response()->json($users);
    }

    public function show(ResourceBooking $booking): Response
    {
        $this->authorize('view', $booking);

        return Inertia::render('bookings/show', $this->bookingShowProps($booking));
    }

    public function showCheckout(ResourceBooking $booking): Response
    {
        $this->authorize('view', $booking);

        // Deliberately not filtered by qr_expires_at > now() — an expired QR
        // still needs to be reported to the frontend so a page refresh keeps
        // the customer on the payment step (with a "generate new QR" prompt)
        // instead of silently bouncing them back to step 1.
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
            ...$this->bookingShowProps($booking),
            'qrPayment' => $pendingPayment ? [
                'id' => $pendingPayment->id,
                'qrCodeUrl' => $pendingPayment->qr_code_url,
                'expiresAt' => $pendingPayment->qr_expires_at,
            ] : null,
            'paymentDeadline' => $this->paymentDeadline($booking),
        ]);
    }

    public function checkout(Request $request, ResourceBooking $booking): Response
    {
        $this->authorize('view', $booking);

        $validated = $request->validate([
            'payment_method' => ['required', 'in:qrph,gcash,maya'],
        ]);

        if ($validated['payment_method'] !== 'qrph') {
            throw ValidationException::withMessages([
                'payment_method' => __(':method is coming soon — please pay with QR Ph for now.', [
                    'method' => PaymentMethod::from($validated['payment_method'])->label(),
                ]),
            ]);
        }

        $qrPayment = null;

        if ($booking->payment_status !== PaymentStatus::Paid) {
            $payment = $this->paymentService->createQrphPaymentForBooking($booking, $request->user());

            $qrPayment = [
                'id' => $payment->id,
                'qrCodeUrl' => $payment->qr_code_url,
                'expiresAt' => $payment->qr_expires_at,
            ];

            Log::info('checkout.generate.qr_state', [
                'booking_id' => $booking->id,
                'payment_id' => $payment->id,
                'qr_expires_at' => $payment->qr_expires_at?->toIso8601String(),
                'qr_expires_at_is_future' => $payment->qr_expires_at?->isFuture(),
                'now' => now()->toIso8601String(),
            ]);
        }

        return Inertia::render('bookings/checkout', [
            ...$this->bookingShowProps($booking),
            'qrPayment' => $qrPayment,
            'paymentDeadline' => $this->paymentDeadline($booking),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function bookingShowProps(ResourceBooking $booking): array
    {
        $booking->load(['resource', 'user', 'approver']);

        return [
            'booking' => $booking,
            'canManage' => request()->user()->isVenueAdmin(),
            'policies' => $this->checkoutPolicies(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function checkoutPolicies(): array
    {
        return Policy::query()
            ->where('placement', 'checkout')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get(['id', 'title', 'body'])
            ->all();
    }

    protected function paymentDeadline(ResourceBooking $booking): ?string
    {
        if ($booking->payment_status !== PaymentStatus::Unpaid) {
            return null;
        }

        $minutes = Setting::query()
            ->where('group', 'bookings')
            ->where('key', 'unpaid_cancel_minutes')
            ->value('value');

        if (! $minutes) {
            return null;
        }

        return $booking->created_at->addMinutes((int) $minutes)->toIso8601String();
    }

    public function markPaid(ResourceBooking $booking): RedirectResponse
    {
        $this->authorize('markPaid', $booking);

        $updates = ['payment_status' => PaymentStatus::Paid];

        if ($booking->status === BookingStatus::Pending) {
            $updates['status'] = BookingStatus::Approved;
        }

        $this->resourceBookingRepository->update($booking, $updates);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment marked as paid.')]);

        return to_route('bookings.show', $booking);
    }

    public function cancel(Request $request, ResourceBooking $booking): RedirectResponse
    {
        $this->authorize('cancel', $booking);

        $this->resourceBookingRepository->update($booking, [
            'status' => BookingStatus::Cancelled,
            'cancellation_reason' => $request->input('cancellation_reason'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking cancelled.')]);

        return to_route('bookings.show', $booking);
    }

    public function calendar(Request $request): Response
    {
        $this->authorize('viewAny', ResourceBooking::class);

        $start = $request->filled('start') ? Carbon::parse($request->input('start')) : Carbon::now()->startOfMonth();
        $end = $request->filled('end') ? Carbon::parse($request->input('end')) : Carbon::now()->endOfMonth();

        // The calendar grid pads out to full weeks, so it also renders a few
        // days from the adjacent months. Fetch data for that wider range too
        // (matching the frontend's Sunday-start week grid), otherwise those
        // padding days always render as closed/empty regardless of their
        // actual DateOverride/booking state.
        $rangeStart = $start->copy()->startOfWeek(Carbon::SUNDAY);
        $rangeEnd = $end->copy()->endOfWeek(Carbon::SATURDAY);

        $dateOverrides = DateOverride::query()
            ->whereBetween('date', [$rangeStart->toDateString(), $rangeEnd->toDateString()])
            ->get(['id', 'date', 'is_closed', 'open_time', 'close_time', 'reason']);

        return Inertia::render('bookings/calendar', [
            'bookings' => $this->resourceBookingRepository->getForCalendar($rangeStart, $rangeEnd),
            'dateOverrides' => $dateOverrides,
            'filters' => $request->only(['start', 'end']),
        ]);
    }

    public function closeDate(Request $request): RedirectResponse
    {
        $this->authorize('viewAny', ResourceBooking::class);

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
            'redirect_start' => ['nullable', 'date'],
            'redirect_end' => ['nullable', 'date'],
        ]);

        DateOverride::query()->updateOrCreate(
            ['date' => $validated['date']],
            [
                'is_closed' => true,
                'open_time' => null,
                'close_time' => null,
                'reason' => $validated['reason'] ?? null,
                'created_by' => $request->user()->id,
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Date closed. Members cannot book on this date until it is reopened.')]);

        return $this->redirectToCalendar($validated);
    }

    public function reopenDate(Request $request): RedirectResponse
    {
        $this->authorize('viewAny', ResourceBooking::class);

        $validated = $request->validate([
            'date' => ['required', 'date', 'after_or_equal:today'],
            'open_time' => ['required', 'date_format:H:i'],
            'close_time' => ['required', 'date_format:H:i', 'after:open_time'],
            'redirect_start' => ['nullable', 'date'],
            'redirect_end' => ['nullable', 'date'],
        ]);

        DateOverride::query()->updateOrCreate(
            ['date' => $validated['date']],
            [
                'is_closed' => false,
                'open_time' => $validated['open_time'],
                'close_time' => $validated['close_time'],
                'reason' => null,
                'created_by' => $request->user()->id,
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Date opened for bookings.')]);

        return $this->redirectToCalendar($validated);
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

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function attributesForNewBooking(array $data, int $userId): array
    {
        $resource = Resource::query()->findOrFail($data['resource_id']);
        $startsAt = Carbon::parse($data['starts_at']);
        $endsAt = Carbon::parse($data['ends_at']);
        $hours = $startsAt->diffInMinutes($endsAt) / 60;

        return [
            ...$data,
            'user_id' => $userId,
            'status' => BookingStatus::Pending,
            'payment_status' => PaymentStatus::Unpaid,
            'amount' => round((float) $resource->hourly_rate * $hours, 2),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function bookingScheduleData(): array
    {
        $resources = Resource::query()
            ->orderBy('resource_number')
            ->get();

        $bookedSlots = ResourceBooking::query()
            ->where('starts_at', '>=', now()->startOfDay())
            ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
            ->with('resource:id,name')
            ->get(['id', 'resource_id', 'starts_at', 'ends_at']);

        $dateOverrides = DateOverride::query()
            ->where('date', '>=', now()->startOfDay())
            ->get(['id', 'date', 'is_closed', 'open_time', 'close_time', 'reason']);

        return [
            'resources' => $resources,
            'bookedSlots' => $bookedSlots,
            'dateOverrides' => $dateOverrides,
            'canManage' => request()->user()?->isVenueAdmin() ?? false,
        ];
    }
}
