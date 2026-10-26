<?php

use App\Http\Controllers\CoachController;
use Illuminate\Support\Facades\Route;

Route::resource('coaches', CoachController::class)->only(['index', 'store', 'update', 'destroy']);
