<?php

namespace App\Http\Middleware;

use App\Models\PageView;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Stand-in for cron on hosting that has none: after a response has been sent
 * to the visitor, run whichever scheduled tasks are due. Each task is
 * throttled by a cache key, so at most one request per interval does the work
 * no matter how busy the site is.
 *
 * Tasks run in-process via Artisan::call rather than `schedule:run`, because
 * the scheduler shells out to a separate `php artisan` process — which shared
 * hosting often blocks, and which the web server's PHP binary may not run.
 *
 * Mirrors routes/console.php. With a real cron in place this is harmless
 * (every task is idempotent) and can be switched off with
 * SCHEDULE_ON_REQUEST=false.
 */
class RunScheduledTasksOnRequest
{
    /**
     * @var array<string, array{seconds: int, command: string, parameters: array<string, mixed>}>
     */
    private const TASKS = [
        'cancel-unpaid' => ['seconds' => 60, 'command' => 'bookings:cancel-unpaid', 'parameters' => []],
        'mark-completed' => ['seconds' => 300, 'command' => 'bookings:mark-completed', 'parameters' => []],
        // Bounded so a web worker is never tied up for long; whatever is left
        // is picked up by the next run.
        'queue' => ['seconds' => 60, 'command' => 'queue:work', 'parameters' => [
            '--stop-when-empty' => true,
            '--tries' => 3,
            '--max-time' => 40,
        ]],
        'prune-page-views' => ['seconds' => 86400, 'command' => 'model:prune', 'parameters' => [
            '--model' => [PageView::class],
        ]],
    ];

    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if (! config('app.schedule_on_request')) {
            return;
        }

        foreach (self::TASKS as $name => $task) {
            if (! Cache::add("scheduled-task:{$name}", true, $task['seconds'])) {
                continue;
            }

            try {
                Artisan::call($task['command'], $task['parameters']);
            } catch (Throwable $e) {
                Log::error('scheduled_task_on_request.failed', [
                    'task' => $name,
                    'exception' => $e::class,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
