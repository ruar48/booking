<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\PolicyController;
use App\Http\Controllers\Admin\SettingController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
    Route::put('settings', [SettingController::class, 'update'])->name('settings.update');
    Route::put('settings/payment-window', [SettingController::class, 'updatePaymentWindow'])->name('settings.update-payment-window');
    Route::put('settings/notifications', [SettingController::class, 'updateNotifications'])->name('settings.update-notifications');
    Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');

    Route::get('policies', [PolicyController::class, 'index'])->name('policies.index');
    Route::get('policies/create', [PolicyController::class, 'create'])->name('policies.create');
    Route::post('policies', [PolicyController::class, 'store'])->name('policies.store');
    Route::get('policies/{policy}/edit', [PolicyController::class, 'edit'])->name('policies.edit');
    Route::put('policies/{policy}', [PolicyController::class, 'update'])->name('policies.update');
    Route::delete('policies/{policy}', [PolicyController::class, 'destroy'])->name('policies.destroy');
});
