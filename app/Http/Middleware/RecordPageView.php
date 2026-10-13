<?php

namespace App\Http\Middleware;

use App\Models\PageView;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Records full page loads for the admin Analytics page.
 *
 * Runs after the response is sent (terminate) so visitors never wait on it,
 * and swallows its own failures — analytics must never break a page.
 */
class RecordPageView
{
    private const MAX_RECORDED_PER_MINUTE = 30;

    private const BOT_PATTERN = '/bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|curl|wget|python|monitor/i';

    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if (! $this->shouldRecord($request, $response)) {
            return;
        }

        // Tighter budget than the request limit: past it the page still
        // loads, it just isn't recorded — a flood can't fill page_views.
        if (! RateLimiter::attempt('page-views|'.$request->ip(), self::MAX_RECORDED_PER_MINUTE, fn () => true)) {
            return;
        }

        try {
            $userAgent = (string) $request->userAgent();

            PageView::query()->create([
                'user_id' => $request->user()?->id,
                'visitor_hash' => hash('sha256', implode('|', [
                    config('app.key'),
                    $request->ip(),
                    $userAgent,
                    now()->toDateString(),
                ])),
                'path' => mb_substr('/'.ltrim($request->path(), '/'), 0, 255),
                'route_name' => $request->route()?->getName(),
                'device' => preg_match('/Mobi|Android|iPhone|iPad/i', $userAgent) ? 'mobile' : 'desktop',
                'referrer_host' => $this->externalReferrerHost($request),
            ]);
        } catch (Throwable $exception) {
            Log::warning('analytics.page_view.failed', ['message' => $exception->getMessage()]);
        }
    }

    private function shouldRecord(Request $request, Response $response): bool
    {
        if (! $request->isMethod('GET') || $response->getStatusCode() !== 200) {
            return false;
        }

        // Partial reloads (polling, realtime refreshes) and link prefetches
        // aren't new page views.
        if ($request->hasHeader('X-Inertia-Partial-Data')
            || $request->hasHeader('X-Inertia-Partial-Component')
            || $request->header('Purpose') === 'prefetch'
            || $request->header('Sec-Purpose') === 'prefetch') {
            return false;
        }

        // Only pages: an Inertia visit or an HTML document. Skips JSON
        // endpoints, sitemap, assets.
        $isPage = $response->headers->has('X-Inertia')
            || str_contains((string) $response->headers->get('Content-Type'), 'text/html');

        if (! $isPage) {
            return false;
        }

        if (preg_match(self::BOT_PATTERN, (string) $request->userAgent())) {
            return false;
        }

        // Staff moving around the back office would drown out real visitors.
        return ! ($request->user()?->isVenueAdmin() ?? false);
    }

    private function externalReferrerHost(Request $request): ?string
    {
        $host = parse_url((string) $request->headers->get('referer'), PHP_URL_HOST);

        if (! is_string($host) || $host === '' || $host === $request->getHost()) {
            return null;
        }

        return mb_substr(preg_replace('/^www\./', '', $host), 0, 120);
    }
}
