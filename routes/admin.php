<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\ScheduleSettingController;
use App\Http\Controllers\Admin\SettingController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
    Route::put('settings', [SettingController::class, 'update'])->name('settings.update');
    Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
    Route::get('schedule', [ScheduleSettingController::class, 'index'])->name('schedule.index');
    Route::put('schedule/hours', [ScheduleSettingController::class, 'updateHours'])->name('schedule.update-hours');
    Route::post('schedule/blocks', [ScheduleSettingController::class, 'storeBlock'])->name('schedule.blocks.store');
    Route::delete('schedule/blocks/{block}', [ScheduleSettingController::class, 'destroyBlock'])->name('schedule.blocks.destroy');
    Route::post('schedule/recurring-locks/toggle', [ScheduleSettingController::class, 'toggle'])->name('schedule.recurring-locks.toggle');
});
