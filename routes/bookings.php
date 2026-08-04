<?php

use App\Http\Controllers\ResourceBookingController;
use Illuminate\Support\Facades\Route;

Route::post('bookings/bulk', [ResourceBookingController::class, 'storeBulk'])->name('bookings.store-bulk');

Route::middleware('venue.admin')->group(function () {
    Route::get('bookings/calendar', [ResourceBookingController::class, 'calendar'])->name('bookings.calendar');
    Route::patch('bookings/{booking}/mark-paid', [ResourceBookingController::class, 'markPaid'])->name('bookings.mark-paid');
    Route::get('bookings/customers/search', [ResourceBookingController::class, 'searchCustomers'])->name('bookings.customers.search');
    Route::post('bookings/walk-in', [ResourceBookingController::class, 'storeWalkIn'])->name('bookings.store-walk-in');
});

Route::resource('bookings', ResourceBookingController::class)->only(['index', 'create', 'store', 'show']);
Route::patch('bookings/{booking}/cancel', [ResourceBookingController::class, 'cancel'])->name('bookings.cancel');
