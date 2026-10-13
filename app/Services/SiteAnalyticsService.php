<?php

namespace App\Services;

use App\Models\PageView;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Builds the admin Analytics page from recorded page views.
 *
 * "Visitors" are unique per day (the visitor hash rotates daily, so the same
 * person on two days counts twice) — the same definition privacy-friendly
 * tools like Plausible use, and it needs no tracking cookie.
 */
class SiteAnalyticsService
{
    public const RANGES = [7, 30, 90];

    /** Friendlier names for pages whose route name reads poorly. */
    private const PAGE_LABELS = [
        'home' => 'Home',
        'login' => 'Log in',
        'register' => 'Sign up',
        'bookings.index' => 'My bookings',
        'bookings.create' => 'Book a court',
        'bookings.show' => 'Booking details',
        'bookings.checkout' => 'Booking checkout',
        'open-play.browse' => 'Open play — browse',
        'open-play.join' => 'Open play — session',
        'open-play.checkout' => 'Open play — checkout',
        'open-play.mine' => 'Open play — my session',
        'open-play.show' => 'Open play — bracket',
        'rentals.browse' => 'Rentals',
        'profile.edit' => 'Profile',
    ];

    /**
     * @return array<string, mixed>
     */
    public function summary(int $days): array
    {
        $from = now()->subDays($days - 1)->startOfDay();
        $previousFrom = $from->copy()->subDays($days);

        $current = $this->between($from);
        $previous = $this->between($previousFrom, $from);

        $views = (clone $current)->count();
        $visitors = (clone $current)->distinct()->count('visitor_hash');

        return [
            'range' => $days,
            'totals' => [
                'views' => $views,
                'visitors' => $visitors,
                'signed_in_users' => (clone $current)->whereNotNull('user_id')->distinct()->count('user_id'),
                'guest_views' => (clone $current)->whereNull('user_id')->count(),
                'previous_views' => (clone $previous)->count(),
                'previous_visitors' => (clone $previous)->distinct()->count('visitor_hash'),
            ],
            'daily' => $this->daily($current, $from, $days),
            'pages' => $this->topPages($current),
            'members' => $this->members($current),
            'devices' => (clone $current)
                ->selectRaw('device, COUNT(*) as views')
                ->groupBy('device')
                ->orderByDesc('views')
                ->get()
                ->map(fn ($row) => ['device' => $row->device, 'views' => (int) $row->views])
                ->all(),
            'referrers' => (clone $current)
                ->whereNotNull('referrer_host')
                ->selectRaw('referrer_host, COUNT(*) as views')
                ->groupBy('referrer_host')
                ->orderByDesc('views')
                ->limit(5)
                ->get()
                ->map(fn ($row) => ['host' => $row->referrer_host, 'views' => (int) $row->views])
                ->all(),
        ];
    }

    /**
     * @return Builder<PageView>
     */
    private function between(CarbonInterface $from, ?CarbonInterface $to = null): Builder
    {
        // No upper bound for the current period: a view stamped this very
        // second must still count.
        return PageView::query()
            ->where('created_at', '>=', $from)
            ->when($to, fn (Builder $query) => $query->where('created_at', '<', $to));
    }

    /**
     * One row per day in the range, zero-filled so the chart has no gaps.
     *
     * @param  Builder<PageView>  $query
     * @return list<array{date: string, views: int, visitors: int}>
     */
    private function daily(Builder $query, CarbonInterface $from, int $days): array
    {
        $rows = (clone $query)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors')
            ->groupByRaw('DATE(created_at)')
            ->get()
            ->keyBy('day');

        $series = [];

        for ($i = 0; $i < $days; $i++) {
            $date = $from->copy()->addDays($i)->toDateString();
            $row = $rows->get($date);

            $series[] = [
                'date' => $date,
                'views' => (int) ($row->views ?? 0),
                'visitors' => (int) ($row->visitors ?? 0),
            ];
        }

        return $series;
    }

    /**
     * @param  Builder<PageView>  $query
     * @return list<array{page: string, label: string, views: int, visitors: int}>
     */
    private function topPages(Builder $query): array
    {
        return (clone $query)
            ->selectRaw('COALESCE(route_name, path) as page, COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors')
            ->groupByRaw('COALESCE(route_name, path)')
            ->orderByDesc('views')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'page' => $row->page,
                'label' => $this->label($row->page),
                'views' => (int) $row->views,
                'visitors' => (int) $row->visitors,
            ])
            ->all();
    }

    /**
     * Signed-in visitors by name, most recently active first, each with the
     * last few pages they opened. Guests can't be named — they only appear
     * in the totals.
     *
     * @param  Builder<PageView>  $query
     * @return list<array<string, mixed>>
     */
    private function members(Builder $query, int $limit = 25): array
    {
        $rows = (clone $query)
            ->whereNotNull('user_id')
            ->selectRaw('user_id, COUNT(*) as views, MAX(created_at) as last_seen')
            ->groupBy('user_id')
            ->orderByDesc('last_seen')
            ->limit($limit)
            ->get();

        if ($rows->isEmpty()) {
            return [];
        }

        $userIds = $rows->pluck('user_id');

        $users = User::query()->whereIn('id', $userIds)->get(['id', 'name', 'email'])->keyBy('id');

        $recentPages = (clone $query)
            ->whereIn('user_id', $userIds)
            ->latest('created_at')
            ->limit($limit * 20)
            ->get(['user_id', 'route_name', 'path', 'created_at'])
            ->groupBy('user_id');

        return $rows->map(function ($row) use ($users, $recentPages): array {
            $user = $users->get($row->user_id);

            return [
                'id' => (int) $row->user_id,
                'name' => $user?->name ?? 'Deleted user',
                'email' => $user?->email,
                'views' => (int) $row->views,
                'last_seen' => Carbon::parse($row->last_seen)->toIso8601String(),
                'recent_pages' => $recentPages->get($row->user_id, collect())
                    ->take(5)
                    ->map(fn (PageView $view) => [
                        'label' => $this->label($view->route_name ?? $view->path),
                        'viewed_at' => $view->created_at->toIso8601String(),
                    ])
                    ->values()
                    ->all(),
            ];
        })->values()->all();
    }

    private function label(string $page): string
    {
        if (isset(self::PAGE_LABELS[$page])) {
            return self::PAGE_LABELS[$page];
        }

        if (str_starts_with($page, '/')) {
            return $page;
        }

        return Str::of($page)->replace(['.', '-', '_'], ' ')->ucfirst()->toString();
    }
}
