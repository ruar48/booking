<?php

namespace App\Services\Booking;

use App\Models\DateOverride;
use App\Models\OpenPlaySession;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\User;
use App\Repositories\ResourceBookingRepository;
use App\Services\ResourceBookingService;
use App\Services\WeatherService;
use Illuminate\Support\Carbon;

/**
 * Assembles the payloads the scheduling screens render from — the slot picker
 * and the admin calendar.
 *
 * This is view-payload assembly, not HTTP: it reaches across resources, date
 * overrides, open play and weather, which is exactly the multi-source gathering
 * a controller must not do inline.
 */
class BookingScheduleService
{
    public function __construct(
        private readonly ResourceBookingService $bookingService,
        private readonly WeatherService $weatherService,
    ) {}

    /**
     * Data behind the hourly slot picker used by "Book a court", the walk-in
     * form and rescheduling.
     *
     * @param  int|null  $excludeBookingId  Booking being rescheduled — its own
     *                                      slot must not appear as taken.
     * @return array<string, mixed>
     */
    public function pickerData(?User $user, ?int $excludeBookingId = null): array
    {
        $bookedSlots = ResourceBooking::query()
            ->where('starts_at', '>=', now()->startOfDay())
            ->whereIn('status', ResourceBookingRepository::BLOCKING_STATUSES)
            ->when($excludeBookingId, fn ($query) => $query->where('id', '!=', $excludeBookingId))
            ->with('resource:id,name')
            ->get(['id', 'resource_id', 'starts_at', 'ends_at'])
            ->concat($this->bookingService->getOpenPlayBookedSlots());

        return [
            'resources' => Resource::query()->orderBy('resource_number')->get(),
            'bookedSlots' => $bookedSlots,
            'dateOverrides' => DateOverride::query()
                ->where('date', '>=', now()->toDateString())
                ->get(['id', 'date', 'is_closed', 'open_time', 'close_time', 'reason']),
            'canManage' => $user?->isVenueAdmin() ?? false,
            'hourlyWeather' => $this->weatherService->hourlyForecast(),
        ];
    }

    /**
     * Data behind the month calendar.
     *
     * @return array<string, mixed>
     */
    public function calendarData(?string $start, ?string $end): array
    {
        $from = $start !== null ? Carbon::parse($start) : Carbon::now()->startOfMonth();
        $to = $end !== null ? Carbon::parse($end) : Carbon::now()->endOfMonth();

        // The grid pads out to whole weeks, so it also renders a few days from
        // the adjacent months. Widen the query to match (Sunday-start, like the
        // frontend), or those padding days always render closed/empty
        // regardless of their real state.
        $rangeStart = $from->copy()->startOfWeek(Carbon::SUNDAY);
        $rangeEnd = $to->copy()->endOfWeek(Carbon::SATURDAY);

        return [
            'bookings' => $this->bookingService->getForCalendar($rangeStart, $rangeEnd),
            'dateOverrides' => DateOverride::query()
                ->whereBetween('date', [$rangeStart->toDateString(), $rangeEnd->toDateString()])
                ->get(['id', 'date', 'is_closed', 'open_time', 'close_time', 'reason']),
            'openPlaySessions' => OpenPlaySession::query()
                ->where('starts_at', '<', $rangeEnd)
                ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>', $rangeStart))
                ->with('resources:id,name')
                ->get(['id', 'title', 'starts_at', 'ends_at', 'location']),
            // Covers the next 16 days only; days outside that window render
            // without weather rather than with a placeholder.
            'weather' => $this->weatherService->dailyForecast(),
        ];
    }
}
