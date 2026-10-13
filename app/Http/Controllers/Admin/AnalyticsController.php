<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalyticsIndexRequest;
use App\Models\PageView;
use App\Services\SiteAnalyticsService;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function __construct(
        private readonly SiteAnalyticsService $analytics,
    ) {}

    public function index(AnalyticsIndexRequest $request): Response
    {
        $this->authorize('viewAny', PageView::class);

        return Inertia::render('admin/analytics/index', [
            'analytics' => $this->analytics->summary($request->range()),
            'ranges' => SiteAnalyticsService::RANGES,
        ]);
    }
}
