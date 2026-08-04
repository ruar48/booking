<?php

use App\Http\Controllers\PosController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use Illuminate\Support\Facades\Route;

Route::get('pos', [PosController::class, 'checkout'])->name('pos.checkout');
Route::post('pos/sales', [PosController::class, 'store'])->name('pos.sales.store');
Route::patch('pos/sales/{sale}/void', [PosController::class, 'void'])->name('pos.sales.void');
Route::get('pos/sales', [SaleController::class, 'index'])->name('pos.sales.index');
Route::get('pos/sales/{sale}', [SaleController::class, 'show'])->name('pos.sales.show');
Route::get('pos/reports', [ReportController::class, 'sales'])->name('pos.reports');
