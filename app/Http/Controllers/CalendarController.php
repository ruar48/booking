<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Models\OpenPlaySession;
use App\Models\Tournament;
use App\Models\TrainingSession;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function __construct(
        private readonly ResourceBookingRepositoryInterface $resourceBookingRepository,
    ) {}

    public function index(Request $request): Response
    {
        $start = $request->filled('start') ? Carbon::parse($request->input('start')) : now()->startOfMonth();
        $end = $request->filled('end') ? Carbon::parse($request->input('end')) : now()->endOfMonth();

        return Inertia::render('calendar/index', [
            'bookings' => $this->resourceBookingRepository->getForCalendar($start, $end),
            'tournaments' => Tournament::query()
                ->where('starts_at', '<', $end)
                ->where(function ($q) use ($start) {
                    $q->whereNull('ends_at')->orWhere('ends_at', '>', $start);
                })
                ->get(),
            'trainingSessions' => TrainingSession::query()
                ->with(['coach.user', 'court'])
                ->whereBetween('scheduled_at', [$start, $end])
                ->get(),
            'events' => OpenPlaySession::query()
                ->where('starts_at', '<', $end)
                ->where(function ($q) use ($start) {
                    $q->whereNull('ends_at')->orWhere('ends_at', '>', $start);
                })
                ->get(),
            'filters' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
            ],
        ]);
    }
}
