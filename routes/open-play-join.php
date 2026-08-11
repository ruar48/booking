<?php

use App\Http\Controllers\OpenPlayController;
use App\Http\Controllers\OpenPlayJoinController;
use Illuminate\Support\Facades\Route;

Route::get('open-play/browse', [OpenPlayJoinController::class, 'browse'])->name('open-play.browse');
Route::get('open-play/{open_play}/bracket', [OpenPlayJoinController::class, 'show'])->name('open-play.show');
Route::get('open-play/{open_play}/mine', [OpenPlayJoinController::class, 'mine'])->name('open-play.mine');
Route::get('open-play/{open_play}/join', [OpenPlayJoinController::class, 'join'])->name('open-play.join');
Route::post('open-play/{open_play}/join', [OpenPlayJoinController::class, 'store'])->name('open-play.join.store');
Route::get('open-play/{open_play}/checkout', [OpenPlayJoinController::class, 'showCheckout'])->name('open-play.checkout');
Route::post('open-play/{open_play}/checkout', [OpenPlayJoinController::class, 'checkout'])
    ->middleware('throttle:10,1')
    ->name('open-play.checkout.generate');

// Any authenticated member can search players (name only) to pick a doubles
// partner, whether registering themselves via the public join page or an
// admin registering entries from the manage page.
Route::get('open-play/players/search', [OpenPlayController::class, 'search'])->name('open-play.players.search');
