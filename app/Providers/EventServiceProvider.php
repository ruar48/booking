<?php

namespace App\Providers;

use App\Events\AnnouncementPublished;
use App\Events\BookingApproved;
use App\Events\BookingCancelled;
use App\Events\MatchReminder;
use App\Events\PaymentSuccessful;
use App\Events\TournamentReminder;
use App\Models\User;
use App\Notifications\AnnouncementPublishedNotification;
use App\Notifications\BookingApprovedNotification;
use App\Notifications\BookingCancelledNotification;
use App\Notifications\MatchReminderNotification;
use App\Notifications\PaymentSuccessfulNotification;
use App\Notifications\TournamentReminderNotification;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Event::listen(BookingApproved::class, function (BookingApproved $event): void {
            $event->booking->user->notify(new BookingApprovedNotification($event->booking));
        });

        Event::listen(BookingCancelled::class, function (BookingCancelled $event): void {
            $event->booking->user->notify(new BookingCancelledNotification($event->booking));
        });

        Event::listen(MatchReminder::class, function (MatchReminder $event): void {
            $event->match->player1?->user?->notify(new MatchReminderNotification($event->match));
            $event->match->player2?->user?->notify(new MatchReminderNotification($event->match));
        });

        Event::listen(TournamentReminder::class, function (TournamentReminder $event): void {
            $event->tournament->registrations->each(
                fn ($registration) => $registration->player?->user?->notify(
                    new TournamentReminderNotification($event->tournament),
                ),
            );
        });

        Event::listen(PaymentSuccessful::class, function (PaymentSuccessful $event): void {
            $event->payment->user->notify(new PaymentSuccessfulNotification($event->payment));
        });

        Event::listen(AnnouncementPublished::class, function (AnnouncementPublished $event): void {
            $announcement = $event->announcement->loadMissing('club.users');

            if ($announcement->club !== null) {
                $announcement->club->users->each(
                    fn ($user) => $user->notify(new AnnouncementPublishedNotification($announcement)),
                );

                return;
            }

            User::role('player')->each(
                fn ($user) => $user->notify(new AnnouncementPublishedNotification($announcement)),
            );
        });
    }
}
