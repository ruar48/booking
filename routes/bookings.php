<?php

use App\Http\Controllers\CourtBookingController;
use Illuminate\Support\Facades\Route;

Route::post('bookings/bulk', [CourtBookingController::class, 'storeBulk'])->name('bookings.store-bulk');
Route::resource('bookings', CourtBookingController::class)->only(['index', 'create', 'store', 'show']);
Route::patch('bookings/{booking}/cancel', [CourtBookingController::class, 'cancel'])->name('bookings.cancel');

Route::middleware('venue.admin')->group(function () {
    Route::get('bookings/calendar', [CourtBookingController::class, 'calendar'])->name('bookings.calendar');
    Route::patch('bookings/{booking}/mark-paid', [CourtBookingController::class, 'markPaid'])->name('bookings.mark-paid');
});
