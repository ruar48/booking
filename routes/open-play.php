<?php

use App\Http\Controllers\OpenPlayBracketController;
use App\Http\Controllers\OpenPlayController;
use App\Http\Controllers\OpenPlayMatchController;
use App\Http\Controllers\OpenPlayRegistrationController;
use App\Http\Controllers\OpenPlayTargetScoreController;
use Illuminate\Support\Facades\Route;

Route::resource('open-play', OpenPlayController::class)->except(['show']);

Route::get('open-play/players/search', [OpenPlayController::class, 'search'])->name('open-play.players.search');

Route::prefix('open-play/{open_play}')->name('open-play.')->group(function () {
    Route::get('manage', [OpenPlayController::class, 'manage'])->name('manage');
    Route::post('registrations', [OpenPlayRegistrationController::class, 'store'])->name('registrations.store');
    Route::post('bracket/generate', [OpenPlayBracketController::class, 'generate'])->name('bracket.generate');
    Route::delete('bracket', [OpenPlayBracketController::class, 'reset'])->name('bracket.reset');
    Route::patch('target-score', [OpenPlayTargetScoreController::class, 'update'])->name('target-score.update');
});

Route::delete('open-play-registrations/{registration}', [OpenPlayRegistrationController::class, 'destroy'])->name('open-play.registrations.destroy');
Route::patch('open-play-matches/{match}/score', [OpenPlayMatchController::class, 'updateScore'])->name('open-play.matches.update-score');
