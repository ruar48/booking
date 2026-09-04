<?php

use App\Http\Controllers\Rental\RentalController;
use App\Http\Controllers\Rental\RentalItemController;
use App\Http\Controllers\Rental\RentalTransactionController;
use Illuminate\Support\Facades\Route;

Route::resource('rental-items', RentalItemController::class)->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);
Route::post('rental-items/{rental_item}/adjust-stock', [RentalItemController::class, 'adjustStock'])->name('rental-items.adjust-stock');

Route::get('rentals', [RentalController::class, 'checkout'])->name('rentals.checkout');
Route::post('rentals', [RentalController::class, 'store'])->name('rentals.store');
Route::get('rentals/transactions', [RentalTransactionController::class, 'index'])->name('rentals.transactions.index');
Route::get('rentals/report', [RentalTransactionController::class, 'report'])->name('rentals.report');
Route::get('rentals/report/export', [RentalTransactionController::class, 'exportReport'])->name('rentals.report.export');
Route::get('rentals/transactions/{rental_transaction}', [RentalTransactionController::class, 'show'])->name('rentals.transactions.show');
Route::patch('rentals/transactions/{rental_transaction}/return', [RentalTransactionController::class, 'returnItems'])->name('rentals.transactions.return-items');
Route::post('rentals/transactions/{rental_transaction}/approve', [RentalTransactionController::class, 'approve'])->name('rentals.transactions.approve');
