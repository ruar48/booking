<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\AnnouncementRepositoryInterface;
use App\Enums\BookingStatus;
use App\Models\Club;
use App\Models\ClubEvent;
use App\Models\DateOverride;
use App\Models\Player;
use App\Models\Resource;
use App\Models\ResourceBooking;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        private readonly AnnouncementRepositoryInterface $announcementRepository,
    ) {}

    public function index(): Response
    {
        $club = Club::query()
            ->where('is_active', true)
            ->oldest()
            ->first();

        $clubId = $club?->id;

        $courts = $clubId
            ? Resource::query()
                ->where('club_id', $clubId)
                ->orderBy('resource_number')
                ->get()
            : collect();

        $announcements = $this->announcementRepository->getPublished()
            ->when(
                $clubId !== null,
                fn ($collection) => $collection->filter(
                    fn ($announcement) => $announcement->club_id === null || $announcement->club_id === $clubId,
                ),
            )
            ->filter(fn ($announcement) => $announcement->show_on_home)
            ->take(6)
            ->values();

        $openPlayEvents = $clubId
            ? ClubEvent::query()
                ->where('club_id', $clubId)
                ->where('starts_at', '>=', now())
                ->orderBy('starts_at')
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

        $dateOverrides = $clubId
            ? DateOverride::query()
                ->where('club_id', $clubId)
                ->where('date', '>=', now()->startOfDay())
                ->get(['id', 'date', 'is_closed', 'open_time', 'close_time', 'reason'])
            : collect();

        $bookingsToday = $clubId
            ? ResourceBooking::query()
                ->whereHas('resource', fn ($query) => $query->where('club_id', $clubId))
                ->whereDate('starts_at', today())
                ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
                ->count()
            : 0;

        return Inertia::render('welcome', [
            'club' => $club,
            'courts' => $courts,
            'announcements' => $announcements,
            'openPlayEvents' => $openPlayEvents,
            'bookedSlots' => $bookedSlots,
            'dateOverrides' => $dateOverrides,
            'stats' => [
                'courts' => $courts->count(),
                'members' => $clubId
                    ? Player::query()->where('club_id', $clubId)->where('is_active', true)->count()
                    : 0,
                'bookings_today' => $bookingsToday,
            ],
        ]);
    }
}
