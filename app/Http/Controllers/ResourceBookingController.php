<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Requests\StoreBulkResourceBookingRequest;
use App\Http\Requests\StoreResourceBookingRequest;
use App\Models\Club;
use App\Models\Resource;
use App\Models\ResourceBooking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ResourceBookingController extends Controller
{
    public function __construct(
        private readonly ResourceBookingRepositoryInterface $resourceBookingRepository,
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
        $booking = $this->resourceBookingRepository->create(
            $this->attributesForNewBooking(
                $request->validated(),
                $request->user()->id,
            ),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking confirmed. Complete payment to secure your reservation.')]);

        return to_route('bookings.show', $booking);
    }

    public function storeBulk(StoreBulkResourceBookingRequest $request): RedirectResponse
    {
        foreach ($request->validated('bookings') as $data) {
            $this->resourceBookingRepository->create(
                $this->attributesForNewBooking($data, $request->user()->id),
            );
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':count booking(s) submitted.', ['count' => count($request->validated('bookings'))]),
        ]);

        return to_route('bookings.index');
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

        return Inertia::render('bookings/calendar', [
            'bookings' => $this->resourceBookingRepository->getForCalendar($clubId, $start, $end),
            'filters' => $request->only(['club_id', 'start', 'end']),
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

        return [
            'club' => $club,
            'resources' => $resources,
            'bookedSlots' => $bookedSlots,
        ];
    }
}
