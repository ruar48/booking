<?php

use App\Http\Controllers\TournamentController;
use Illuminate\Support\Facades\Route;

Route::resource('tournaments', TournamentController::class);
Route::post('tournaments/{tournament}/register', [TournamentController::class, 'register'])->name('tournaments.register');
Route::post('tournaments/{tournament}/generate-bracket', [TournamentController::class, 'generateBracket'])->name('tournaments.generate-bracket');
