<?php

use App\Http\Controllers\CourtController;
use Illuminate\Support\Facades\Route;

Route::resource('courts', CourtController::class)->only(['index', 'edit', 'update']);
