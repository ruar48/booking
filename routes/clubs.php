<?php

use App\Http\Controllers\ClubController;
use Illuminate\Support\Facades\Route;

Route::resource('clubs', ClubController::class);
