<?php

namespace App\Services;

use App\Contracts\Repositories\AnnouncementRepositoryInterface;
use App\Enums\BookingStatus;
use App\Models\DateOverride;
use App\Models\OpenPlaySession;
use App\Models\Player;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Setting;
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
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function props(): array
    {
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

        $bookedSlots = ResourceBooking::query()
            ->where('starts_at', '>=', now()->startOfDay())
            ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
            ->with('resource:id,name')
            ->get(['id', 'resource_id', 'starts_at', 'ends_at'])
            ->concat($this->resourceBookingService->getOpenPlayBookedSlots());

        $dateOverrides = DateOverride::query()
            ->where('date', '>=', now()->toDateString())
            ->get(['id', 'date', 'is_closed', 'open_time', 'close_time', 'reason']);

        $bookingsToday = ResourceBooking::query()
            ->whereDate('starts_at', today())
            ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
            ->count();

        return json_decode(json_encode([
            'courts' => $courts,
            'announcements' => $announcements,
            'openPlaySessions' => $openPlaySessions,
            'bookedSlots' => $bookedSlots,
            'dateOverrides' => $dateOverrides,
            'hourlyWeather' => $this->weatherService->hourlyForecast(),
            'venue' => $this->venueProfile(),
            'gallery' => $this->galleryService->publicSections(),
            'stats' => [
                'courts' => $courts->count(),
                'members' => Player::query()->where('is_active', true)->count(),
                'bookings_today' => $bookingsToday,
            ],
        ]), true);
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
