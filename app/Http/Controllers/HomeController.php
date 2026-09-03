<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\AnnouncementRepositoryInterface;
use App\Enums\BookingStatus;
use App\Models\DateOverride;
use App\Models\OpenPlaySession;
use App\Models\Player;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Services\ResourceBookingService;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        private readonly AnnouncementRepositoryInterface $announcementRepository,
        private readonly ResourceBookingService $resourceBookingService,
    ) {}

    public function index(): Response
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

        return Inertia::render('welcome', [
            'courts' => $courts,
            'announcements' => $announcements,
            'openPlaySessions' => $openPlaySessions,
            'bookedSlots' => $bookedSlots,
            'dateOverrides' => $dateOverrides,
            'venue' => $this->venueProfile(),
            'stats' => [
                'courts' => $courts->count(),
                'members' => Player::query()->where('is_active', true)->count(),
                'bookings_today' => $bookingsToday,
            ],
        ]);
    }

    private function venueProfile(): array
    {
        $profile = Setting::query()
            ->where('group', 'venue')
            ->where('key', 'profile')
            ->value('value') ?? [];

        return $profile;
    }
}
