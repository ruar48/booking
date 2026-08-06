<?php

namespace App\Http\Controllers;

use App\Actions\CreateWalkInCustomer;
use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Exceptions\BookingConflictException;
use App\Http\Requests\StoreBulkResourceBookingRequest;
use App\Http\Requests\StoreResourceBookingRequest;
use App\Http\Requests\StoreWalkInBookingRequest;
use App\Models\Club;
use App\Models\DateOverride;
use App\Models\RecurringScheduleLock;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\ScheduleBlock;
use App\Models\User;
use App\Services\ResourceBookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ResourceBookingController extends Controller
{
    public function __construct(
        private readonly ResourceBookingRepositoryInterface $resourceBookingRepository,
        private readonly ResourceBookingService $resourceBookingService,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', ResourceBooking::class);

        $user = request()->user();

        return Inertia::render('bookings/index', [
            'bookings' => $this->resourceBookingRepository->paginateForUser($user),
            'canManage' => $user->isVenueAdmin(),
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

        return to_route('bookings.show', $booking);
    }

    public function storeBulk(StoreBulkResourceBookingRequest $request): RedirectResponse
    {
        try {
            foreach ($request->validated('bookings') as $data) {
                $this->resourceBookingService->create(
                    $this->attributesForNewBooking($data, $request->user()->id),
                );
            }
        } catch (BookingConflictException $e) {
            throw ValidationException::withMessages(['starts_at' => $e->getMessage()]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':count booking(s) submitted.', ['count' => count($request->validated('bookings'))]),
        ]);

        return to_route('bookings.index');
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

        $booking->load(['resource.club', 'user', 'approver']);

        return Inertia::render('bookings/show', [
            'booking' => $booking,
            'canManage' => request()->user()->isVenueAdmin(),
        ]);
    }

    public function markPaid(ResourceBooking $booking): RedirectResponse
    {
        $this->authorize('markPaid', $booking);

        $this->resourceBookingRepository->update($booking, [
            'payment_status' => PaymentStatus::Paid,
        ]);

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

        $clubId = $request->integer('club_id') ?: null;
        $start = $request->filled('start') ? Carbon::parse($request->input('start')) : null;
        $end = $request->filled('end') ? Carbon::parse($request->input('end')) : null;

        $club = $this->activeClub();

        $dateOverrides = $club
            ? DateOverride::query()
                ->where('club_id', $club->id)
                ->whereBetween('date', [
                    ($start ?? now()->startOfMonth())->toDateString(),
                    ($end ?? now()->endOfMonth())->toDateString(),
                ])
                ->get(['id', 'date', 'is_closed', 'open_time', 'close_time', 'reason'])
            : collect();

        return Inertia::render('bookings/calendar', [
            'bookings' => $this->resourceBookingRepository->getForCalendar($clubId, $start, $end),
            'dateOverrides' => $dateOverrides,
            'operatingHours' => $club?->operating_hours,
            'filters' => $request->only(['club_id', 'start', 'end']),
        ]);
    }

    public function closeDate(Request $request): RedirectResponse
    {
        $this->authorize('viewAny', ResourceBooking::class);

        $club = $this->activeClub();

        abort_if($club === null, 404);

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        DateOverride::query()->updateOrCreate(
            ['club_id' => $club->id, 'date' => $validated['date']],
            [
                'is_closed' => true,
                'open_time' => null,
                'close_time' => null,
                'reason' => $validated['reason'] ?? null,
                'created_by' => $request->user()->id,
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Date closed. Members cannot book on this date until it is reopened.')]);

        return back();
    }

    public function reopenDate(Request $request): RedirectResponse
    {
        $this->authorize('viewAny', ResourceBooking::class);

        $club = $this->activeClub();

        abort_if($club === null, 404);

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'open_time' => ['required', 'date_format:H:i'],
            'close_time' => ['required', 'date_format:H:i', 'after:open_time'],
        ]);

        DateOverride::query()->updateOrCreate(
            ['club_id' => $club->id, 'date' => $validated['date']],
            [
                'is_closed' => false,
                'open_time' => $validated['open_time'],
                'close_time' => $validated['close_time'],
                'reason' => null,
                'created_by' => $request->user()->id,
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Date opened for bookings.')]);

        return back();
    }

    private function activeClub(): ?Club
    {
        return Club::query()
            ->where('is_active', true)
            ->oldest()
            ->first();
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
            'status' => BookingStatus::Approved,
            'payment_status' => PaymentStatus::Unpaid,
            'amount' => round((float) $resource->hourly_rate * $hours, 2),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function bookingScheduleData(): array
    {
        $club = Club::query()
            ->where('is_active', true)
            ->oldest()
            ->first();

        $clubId = $club?->id;

        $resources = $clubId
            ? Resource::query()
                ->where('club_id', $clubId)
                ->orderBy('resource_number')
                ->get()
            : collect();

        $bookedSlots = $clubId
            ? ResourceBooking::query()
                ->whereHas('resource', fn ($query) => $query->where('club_id', $clubId))
                ->where('starts_at', '>=', now()->startOfDay())
                ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
                ->with('resource:id,name')
                ->get(['id', 'resource_id', 'starts_at', 'ends_at'])
            : collect();

        $scheduleBlocks = $clubId
            ? ScheduleBlock::query()
                ->where('club_id', $clubId)
                ->where('ends_at', '>=', now()->startOfDay())
                ->get(['id', 'resource_id', 'starts_at', 'ends_at', 'reason'])
            : collect();

        $recurringLocks = $clubId
            ? RecurringScheduleLock::query()
                ->where('club_id', $clubId)
                ->get(['id', 'resource_id', 'day_of_week', 'starts_at', 'ends_at', 'reason'])
            : collect();

        $dateOverrides = $clubId
            ? DateOverride::query()
                ->where('club_id', $clubId)
                ->where('date', '>=', now()->startOfDay())
                ->get(['id', 'date', 'is_closed', 'open_time', 'close_time', 'reason'])
            : collect();

        return [
            'club' => $club,
            'resources' => $resources,
            'bookedSlots' => $bookedSlots,
            'scheduleBlocks' => $scheduleBlocks,
            'recurringLocks' => $recurringLocks,
            'dateOverrides' => $dateOverrides,
            'canManage' => request()->user()?->isVenueAdmin() ?? false,
        ];
    }
}
