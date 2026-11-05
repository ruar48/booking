<?php

namespace App\Services;

use App\Actions\Booking\ReleaseUnpaidBookings;
use App\Contracts\Repositories\AnnouncementRepositoryInterface;
use App\Enums\BookingStatus;
use App\Enums\PolicyPlacement;
use App\Enums\RentalItemStatus;
use App\Enums\ResourceStatus;
use App\Enums\Sport;
use App\Models\DateOverride;
use App\Models\OpenPlaySession;
use App\Models\Player;
use App\Models\Policy;
use App\Models\RentalItem;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Services\Booking\BookingPricer;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Builds the public landing page's props.
 *
 * The page is identical for every guest and is the main target of traffic
 * floods, so the whole payload is cached briefly: a burst of visitors costs
 * one set of queries per CACHE_SECONDS instead of one per visit. Availability
 * shown here can lag by that much — booking itself always re-checks live.
 */
class HomePageService
{
    public const CACHE_KEY = 'home:payload';

    public const CACHE_SECONDS = 45;

    public function __construct(
        private readonly AnnouncementRepositoryInterface $announcementRepository,
        private readonly ResourceBookingService $resourceBookingService,
        private readonly WeatherService $weatherService,
        private readonly GalleryService $galleryService,
        private readonly CoachService $coachService,
        private readonly ReleaseUnpaidBookings $releaseUnpaid,
        private readonly HomeSeoService $seo,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function props(): array
    {
        // Released holds must stop showing as taken even if the scheduler isn't
        // running; a release also clears this page's cache.
        $this->releaseUnpaid->executeThrottled();

        return Cache::remember(self::CACHE_KEY, self::CACHE_SECONDS, fn (): array => $this->build());
    }

    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Plain arrays only, so the cached value never holds live models.
     *
     * @return array<string, mixed>
     */
    private function build(): array
    {
        $courts = Resource::query()
            ->orderBy('resource_number')
            ->get();

        $announcements = $this->announcementRepository->getPublished()
            ->filter(fn ($announcement) => $announcement->show_on_home)
            ->take(6)
            ->values();

        $openPlaySessions = OpenPlaySession::query()
            ->where('starts_at', '>=', now())
            ->withSum('registrations as registrations_count', DB::raw('CASE WHEN partner_player_id IS NULL THEN 1 ELSE 2 END'))
            ->orderBy('starts_at')
            ->get();

        $bookedSlots = $this->releaseUnpaid->asBookedSlots(
            ResourceBooking::query()
                ->where('starts_at', '>=', now()->startOfDay())
                ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
                ->with('resource:id,name')
                ->get(['id', 'resource_id', 'starts_at', 'ends_at', 'status', 'payment_status', 'created_at', 'booking_group_id']),
        )->concat($this->resourceBookingService->getOpenPlayBookedSlots());

        $dateOverrides = DateOverride::query()
            ->where('date', '>=', now()->toDateString())
            ->get(['id', 'date', 'is_closed', 'open_time', 'close_time', 'reason']);

        $bookingsToday = ResourceBooking::query()
            ->whereDate('starts_at', today())
            ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
            ->count();

        $venue = $this->venueProfile();

        return json_decode(json_encode([
            'courts' => $courts,
            'announcements' => $announcements,
            'openPlaySessions' => $openPlaySessions,
            'bookedSlots' => $bookedSlots,
            'dateOverrides' => $dateOverrides,
            'hourlyWeather' => $this->weatherService->hourlyForecast(),
            'venue' => $venue,
            'seo' => $this->seo->forVenue($venue),
            'gallery' => $this->galleryService->publicSections(),
            'coaches' => $this->coachService->publicProfiles(),
            'courtRules' => Policy::linesAt(PolicyPlacement::CourtRules),
            'rates' => $this->rates($courts),
            'stats' => [
                'courts' => $courts->count(),
                'members' => Player::query()->where('is_active', true)->count(),
                'bookings_today' => $bookingsToday,
                'available_slots_today' => $this->availableSlotsToday(
                    $courts,
                    $bookedSlots,
                    $dateOverrides->first(fn (DateOverride $override) => $override->date->isToday()),
                ),
                'open_play_this_week' => OpenPlaySession::query()
                    ->whereBetween('starts_at', [now()->startOfWeek(), now()->endOfWeek()])
                    ->count(),
            ],
        ]), true);
    }

    /**
     * The rates card: each sport's hourly rate before and after the evening
     * rate starts, and the cheapest paddle rental. When a sport's courts don't
     * all charge the same, the lowest rate is shown as a "from" price.
     *
     * @param  Collection<int, \App\Models\Resource>  $courts
     * @return array{
     *     eveningFrom: string,
     *     sports: list<array{sport: string, label: string, unit: string, day: float, evening: float|null, varies: bool}>,
     *     paddleRental: array{amount: float, per: string, from: bool}|null,
     * }
     */
    private function rates(Collection $courts): array
    {
        $sports = [];

        foreach (Sport::cases() as $sport) {
            $bookable = $courts->filter(
                fn (Resource $court): bool => $court->sport === $sport && $court->status === ResourceStatus::Available,
            );

            if ($bookable->isEmpty()) {
                continue;
            }

            $day = $bookable->map(fn (Resource $court): float => (float) $court->hourly_rate);
            // No evening rate means the day rate applies all day.
            $evening = $bookable->map(fn (Resource $court): float => (float) ($court->evening_rate ?? $court->hourly_rate));

            $sports[] = [
                'sport' => $sport->value,
                'label' => $sport->label(),
                'unit' => $sport->unitNoun(),
                'day' => $day->min(),
                'evening' => $evening->all() === $day->all() ? null : $evening->min(),
                'varies' => $day->unique()->count() > 1 || $evening->unique()->count() > 1,
            ];
        }

        // Priced per hour when the item has an hourly option, otherwise per day.
        $paddles = RentalItem::query()
            ->where('status', RentalItemStatus::Active)
            ->where('name', 'like', '%paddle%')
            ->get(['rate', 'hourly_rate'])
            ->map(fn (RentalItem $item): array => (float) $item->hourly_rate > 0
                ? ['amount' => (float) $item->hourly_rate, 'per' => 'hour']
                : ['amount' => (float) $item->rate, 'per' => 'day'])
            ->sortBy('amount')
            ->values();
        $cheapest = $paddles->first();

        return [
            'eveningFrom' => Carbon::parse(BookingPricer::EVENING_STARTS)->format('g A'),
            'sports' => $sports,
            'paddleRental' => $cheapest === null ? null : [
                ...$cheapest,
                'from' => $paddles->unique()->count() > 1,
            ],
        ];
    }

    /**
     * Hourly slots still bookable today: not started, on an available court,
     * and not overlapping a booking or Open Play session. Mirrors the grid's
     * slot stepping (hourly from the day's opening time).
     *
     * @param  Collection<int, \App\Models\Resource>  $courts
     * @param  Collection<int, mixed>  $bookedSlots  ResourceBooking models and Open Play arrays
     */
    private function availableSlotsToday(Collection $courts, Collection $bookedSlots, ?DateOverride $today): int
    {
        // Dates are closed unless an admin has explicitly opened them with hours.
        if ($today === null || $today->is_closed || ! $today->open_time || ! $today->close_time) {
            return 0;
        }

        $open = today()->setTimeFromTimeString($today->open_time);
        $close = today()->setTimeFromTimeString($today->close_time);

        $blocked = $bookedSlots->map(fn ($slot): array => [
            'resource_id' => (int) data_get($slot, 'resource_id'),
            'starts_at' => Carbon::parse(data_get($slot, 'starts_at')),
            'ends_at' => Carbon::parse(data_get($slot, 'ends_at')),
        ]);

        $count = 0;

        foreach ($courts->where('status', ResourceStatus::Available) as $court) {
            // Dates are immutable here (AppServiceProvider), so each step reassigns.
            for ($slot = $open; $slot->addHour()->lte($close); $slot = $slot->addHour()) {
                $slotEnd = $slot->addHour();

                $taken = $blocked->contains(
                    fn (array $b): bool => $b['resource_id'] === $court->id
                        && $b['starts_at']->lt($slotEnd)
                        && $b['ends_at']->gt($slot),
                );

                if (! $taken && $slot->isFuture()) {
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * @return array<string, mixed>
     */
    private function venueProfile(): array
    {
        return Setting::query()
            ->where('group', 'venue')
            ->where('key', 'profile')
            ->value('value') ?? [];
    }
}
