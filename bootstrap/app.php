<?php

use App\Http\Middleware\EnsureVenueAdmin;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RecordPageView;
use App\Http\Middleware\RunScheduledTasksOnRequest;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->validateCsrfTokens(except: ['webhooks/paymongo']);

        $middleware->alias([
            'venue.admin' => EnsureVenueAdmin::class,
        ]);

        // Rate limits (defined in AppServiceProvider): "flood" before the
        // session starts, "web" after it once the user is known.
        $middleware->web(prepend: [
            ThrottleRequests::using('flood'),
        ]);

        $middleware->web(append: [
            ThrottleRequests::using('web'),
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            RecordPageView::class,
            RunScheduledTasksOnRequest::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Laravel keeps only one respond() callback — a second call replaces
        // the first — so every status is handled here.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            // Branded 404 instead of Laravel's bare page. JSON callers keep a
            // JSON 404. Unknown URLs reach this through the Route::fallback in
            // web.php, so the session (and with it the signed-in user) is
            // loaded and the page can point each visitor at the right place.
            if ($response->getStatusCode() === 404) {
                if ($request->expectsJson() && ! $request->hasHeader('X-Inertia')) {
                    return $response;
                }

                return Inertia::render('errors/not-found')
                    ->toResponse($request)
                    ->setStatusCode(404);
            }

            // Inertia cannot render Laravel's plain 403 page: the visitor gets
            // a raw error overlay with no way back. This happens in normal use
            // whenever a page is acted on after the underlying record changed
            // — permission flags are baked into props, so a button restored
            // from history cache can stay clickable after the action stopped
            // being allowed. Bounce them to the page they came from with the
            // policy's reason instead. Non-Inertia requests keep the real 403.
            if ($response->getStatusCode() !== 403 || ! $request->hasHeader('X-Inertia')) {
                return $response;
            }

            $previous = url()->previous();

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $e->getMessage() ?: __('This action is unauthorized.'),
            ]);

            // Redirecting back to the URL that was just refused would loop.
            return redirect($previous === $request->fullUrl() ? url('/') : $previous);
        });
    })->create();
