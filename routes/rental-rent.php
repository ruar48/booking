<?php

use App\Http\Controllers\RentalMemberController;
use Illuminate\Support\Facades\Route;

Route::get('rentals/browse', [RentalMemberController::class, 'browse'])->name('rentals.browse');
Route::get('rentals/mine', [RentalMemberController::class, 'mine'])->name('rentals.mine');
Route::post('rentals/rent', [RentalMemberController::class, 'store'])->name('rentals.rent');
