<?php

use App\Models\PageView;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('bookings:cancel-unpaid')->everyMinute();
Schedule::command('bookings:mark-completed')->everyFiveMinutes();

// Drop analytics page views older than PageView::RETENTION_DAYS.
Schedule::command('model:prune', ['--model' => [PageView::class]])->daily();

// Shared hosting (cPanel) can't run a persistent `queue:work` daemon — the
// process just gets killed. Draining the queue once a minute via the
// scheduler instead means only one cron entry (`schedule:run`) is needed
// on the server for queued mail/notifications to actually go out.
Schedule::command('queue:work --stop-when-empty --tries=3')
    ->everyMinute()
    ->withoutOverlapping();
