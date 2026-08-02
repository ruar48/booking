<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\CourtBookingRepositoryInterface;
use App\Models\ClubEvent;
use App\Models\Tournament;
use App\Models\TrainingSession;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function __construct(
        private readonly CourtBookingRepositoryInterface $courtBookingRepository,
    ) {}

    public function index(Request $request): Response
    {
        $clubId = $request->integer('club_id') ?: null;
        $start = $request->filled('start') ? Carbon::parse($request->input('start')) : now()->startOfMonth();
        $end = $request->filled('end') ? Carbon::parse($request->input('end')) : now()->endOfMonth();

        return Inertia::render('calendar/index', [
            'bookings' => $this->courtBookingRepository->getForCalendar($clubId, $start, $end),
            'tournaments' => Tournament::query()
                ->when($clubId, fn ($q) => $q->where('club_id', $clubId))
                ->where('starts_at', '<', $end)
                ->where(function ($q) use ($start) {
                    $q->whereNull('ends_at')->orWhere('ends_at', '>', $start);
                })
                ->get(),
            'trainingSessions' => TrainingSession::query()
                ->with(['coach.user', 'court'])
                ->when($clubId, fn ($q) => $q->where('club_id', $clubId))
                ->whereBetween('scheduled_at', [$start, $end])
                ->get(),
            'events' => ClubEvent::query()
                ->when($clubId, fn ($q) => $q->where('club_id', $clubId))
                ->where('starts_at', '<', $end)
                ->where(function ($q) use ($start) {
                    $q->whereNull('ends_at')->orWhere('ends_at', '>', $start);
                })
                ->get(),
            'filters' => [
                'club_id' => $clubId,
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
            ],
        ]);
    }
}
