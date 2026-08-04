<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\CourtBookingRepositoryInterface;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Requests\StoreBulkCourtBookingRequest;
use App\Http\Requests\StoreCourtBookingRequest;
use App\Models\Club;
use App\Models\Court;
use App\Models\CourtBooking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CourtBookingController extends Controller
{
    public function __construct(
        private readonly CourtBookingRepositoryInterface $courtBookingRepository,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', CourtBooking::class);

        $user = request()->user();

        return Inertia::render('bookings/index', [
            'bookings' => $this->courtBookingRepository->paginateForUser($user),
            'canManage' => $user->isVenueAdmin(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', CourtBooking::class);

        return Inertia::render('bookings/create', $this->bookingScheduleData());
    }

    public function store(StoreCourtBookingRequest $request): RedirectResponse
    {
        $booking = $this->courtBookingRepository->create(
            $this->attributesForNewBooking(
                $request->validated(),
                $request->user()->id,
            ),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking confirmed. Complete payment to secure your reservation.')]);

        return to_route('bookings.show', $booking);
    }

    public function storeBulk(StoreBulkCourtBookingRequest $request): RedirectResponse
    {
        foreach ($request->validated('bookings') as $data) {
            $this->courtBookingRepository->create(
                $this->attributesForNewBooking($data, $request->user()->id),
            );
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':count booking(s) submitted.', ['count' => count($request->validated('bookings'))]),
        ]);

        return to_route('bookings.index');
    }

    public function show(CourtBooking $booking): Response
    {
        $this->authorize('view', $booking);

        $booking->load(['court.club', 'user', 'approver']);

        return Inertia::render('bookings/show', [
            'booking' => $booking,
            'canManage' => request()->user()->isVenueAdmin(),
        ]);
    }

    public function markPaid(CourtBooking $booking): RedirectResponse
    {
        $this->authorize('markPaid', $booking);

        $this->courtBookingRepository->update($booking, [
            'payment_status' => PaymentStatus::Paid,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment marked as paid.')]);

        return to_route('bookings.show', $booking);
    }

    public function cancel(Request $request, CourtBooking $booking): RedirectResponse
    {
        $this->authorize('cancel', $booking);

        $this->courtBookingRepository->update($booking, [
            'status' => BookingStatus::Cancelled,
            'cancellation_reason' => $request->input('cancellation_reason'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking cancelled.')]);

        return to_route('bookings.show', $booking);
    }

    public function calendar(Request $request): Response
    {
        $this->authorize('viewAny', CourtBooking::class);

        $clubId = $request->integer('club_id') ?: null;
        $start = $request->filled('start') ? Carbon::parse($request->input('start')) : null;
        $end = $request->filled('end') ? Carbon::parse($request->input('end')) : null;

        return Inertia::render('bookings/calendar', [
            'bookings' => $this->courtBookingRepository->getForCalendar($clubId, $start, $end),
            'filters' => $request->only(['club_id', 'start', 'end']),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function attributesForNewBooking(array $data, int $userId): array
    {
        $court = Court::query()->findOrFail($data['court_id']);
        $startsAt = Carbon::parse($data['starts_at']);
        $endsAt = Carbon::parse($data['ends_at']);
        $hours = $startsAt->diffInMinutes($endsAt) / 60;

        return [
            ...$data,
            'user_id' => $userId,
            'status' => BookingStatus::Approved,
            'payment_status' => PaymentStatus::Unpaid,
            'amount' => round((float) $court->hourly_rate * $hours, 2),
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

        $courts = $clubId
            ? Court::query()
                ->where('club_id', $clubId)
                ->orderBy('court_number')
                ->get()
            : collect();

        $bookedSlots = $clubId
            ? CourtBooking::query()
                ->whereHas('court', fn ($query) => $query->where('club_id', $clubId))
                ->where('starts_at', '>=', now()->startOfDay())
                ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
                ->with('court:id,name')
                ->get(['id', 'court_id', 'starts_at', 'ends_at'])
            : collect();

        return [
            'club' => $club,
            'courts' => $courts,
            'bookedSlots' => $bookedSlots,
        ];
    }
}
