<?php

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymongoWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::post('webhooks/paymongo', [PaymongoWebhookController::class, 'handle'])->name('webhooks.paymongo');

// Channel-auth endpoint for the Pusher connection, with logging on top of the
// default Broadcast::auth() behaviour to make denied subscriptions debuggable.
Route::middleware(['auth'])->post('broadcasting/pusher/auth', function (Request $request) {
    try {
        $response = Broadcast::auth($request);

        Log::info('broadcasting.pusher.auth.success', [
            'user_id' => $request->user()?->id,
            'channel_name' => $request->input('channel_name'),
        ]);

        return $response;
    } catch (\Throwable $e) {
        Log::warning('broadcasting.pusher.auth.denied', [
            'user_id' => $request->user()?->id,
            'channel_name' => $request->input('channel_name'),
            'exception' => $e::class,
            'status' => $e instanceof HttpExceptionInterface ? $e->getStatusCode() : null,
            'message' => $e->getMessage(),
        ]);

        throw $e;
    }
})->name('broadcasting.pusher.auth');

Route::get('/sitemap.xml', function () {
    return response()
        ->view('sitemap', ['url' => url('/')])
        ->header('Content-Type', 'text/xml');
})->name('sitemap');

Route::middleware(['auth', 'verified'])->group(function () {
    require __DIR__.'/bookings.php';
    require __DIR__.'/open-play-join.php';
    require __DIR__.'/rental-rent.php';

    Route::middleware('venue.admin')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::get('payments', [PaymentController::class, 'index'])->name('payments.index');
        Route::get('payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');
        Route::patch('payments/{payment}/mark-paid', [PaymentController::class, 'markPaid'])->name('payments.mark-paid');

        require __DIR__.'/players.php';
        require __DIR__.'/resources.php';
        require __DIR__.'/inventory.php';
        require __DIR__.'/pos.php';
        require __DIR__.'/rentals.php';
        require __DIR__.'/announcements.php';
        require __DIR__.'/open-play.php';
        require __DIR__.'/admin.php';
    });
});

require __DIR__.'/settings.php';
