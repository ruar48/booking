<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\SettingController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
    Route::put('settings', [SettingController::class, 'update'])->name('settings.update');
    Route::put('settings/payment-window', [SettingController::class, 'updatePaymentWindow'])->name('settings.update-payment-window');
    Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
});
