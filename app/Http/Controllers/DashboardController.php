<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {}

    public function index(Request $request): Response
    {
        if (! $request->user()?->isVenueAdmin()) {
            abort(403);
        }

        $clubId = $request->integer('club_id') ?: null;

        return Inertia::render('dashboard', [
            'clubId' => $clubId,
            'data' => $this->dashboardService->getData($clubId),
        ]);
    }
}
