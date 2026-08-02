<?php

use App\Http\Controllers\OpenPlayController;
use Illuminate\Support\Facades\Route;

Route::resource('open-play', OpenPlayController::class)->except(['show']);
