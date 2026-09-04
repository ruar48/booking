<?php

use App\Http\Controllers\OpenPlay\OpenPlayBracketController;
use App\Http\Controllers\OpenPlay\OpenPlayBracketMatchController;
use App\Http\Controllers\OpenPlay\OpenPlayController;
use App\Http\Controllers\OpenPlay\OpenPlayMatchController;
use App\Http\Controllers\OpenPlay\OpenPlayRegistrationController;
use App\Http\Controllers\OpenPlay\OpenPlayTargetScoreController;
use Illuminate\Support\Facades\Route;

Route::resource('open-play', OpenPlayController::class)->except(['show']);

Route::prefix('open-play/{open_play}')->name('open-play.')->group(function () {
    Route::get('manage', [OpenPlayController::class, 'manage'])->name('manage');
    Route::get('bracket-full', [OpenPlayController::class, 'bracketFull'])->name('bracket-full');
    Route::post('registrations', [OpenPlayRegistrationController::class, 'store'])->name('registrations.store');
    Route::post('registrations/add-all', [OpenPlayRegistrationController::class, 'addAll'])->name('registrations.add-all');
    Route::post('registrations/pair-random', [OpenPlayRegistrationController::class, 'pairRandom'])->name('registrations.pair-random');
    Route::post('bracket/generate', [OpenPlayBracketController::class, 'generate'])->name('bracket.generate');
    Route::delete('bracket', [OpenPlayBracketController::class, 'reset'])->name('bracket.reset');
    Route::patch('bracket/visibility', [OpenPlayBracketController::class, 'updateVisibility'])->name('bracket.visibility.update');
    Route::post('bracket/matches', [OpenPlayBracketMatchController::class, 'store'])->name('bracket.matches.store');
    Route::patch('target-score', [OpenPlayTargetScoreController::class, 'update'])->name('target-score.update');
});

Route::delete('open-play-registrations/{registration}', [OpenPlayRegistrationController::class, 'destroy'])->name('open-play.registrations.destroy');
Route::patch('open-play-registrations/{registration}/payment', [OpenPlayRegistrationController::class, 'updatePayment'])->name('open-play.registrations.update-payment');
Route::patch('open-play-matches/{match}/score', [OpenPlayMatchController::class, 'updateScore'])->name('open-play.matches.update-score');
Route::patch('open-play-bracket-matches/{match}', [OpenPlayBracketMatchController::class, 'update'])->name('open-play.bracket-matches.update');
Route::delete('open-play-bracket-matches/{match}', [OpenPlayBracketMatchController::class, 'destroy'])->name('open-play.bracket-matches.destroy');
