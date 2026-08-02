<?php

use App\Http\Controllers\GameMatchController;
use Illuminate\Support\Facades\Route;

Route::get('matches', [GameMatchController::class, 'index'])->name('matches.index');
Route::get('matches/{match}', [GameMatchController::class, 'show'])->name('matches.show');
Route::patch('matches/{match}/score', [GameMatchController::class, 'updateScore'])->name('matches.update-score');
Route::patch('matches/{match}/complete', [GameMatchController::class, 'complete'])->name('matches.complete');
