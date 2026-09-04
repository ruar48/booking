<?php

use App\Http\Middleware\EnsureVenueAdmin;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
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

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Inertia cannot render Laravel's plain 403 page: the visitor gets a
        // raw error overlay with no way back. This happens in normal use
        // whenever a page is acted on after the underlying record changed —
        // permission flags are baked into props, so a "Reschedule" button
        // restored from history cache stays clickable after the booking has
        // already been moved. Bounce them to the page they came from with the
        // policy's reason instead. Non-Inertia requests keep the real 403.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
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
