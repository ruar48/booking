<?php

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

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
