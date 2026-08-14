<?php

namespace App\Providers;

use App\Enums\Role;
use App\Events\AnnouncementPublished;
use App\Events\BookingApproved;
use App\Events\BookingCancelled;
use App\Events\BookingCreated;
use App\Events\BookingFailed;
use App\Events\MatchReminder;
use App\Events\PaymentSuccessful;
use App\Events\TournamentReminder;
use App\Models\User;
use App\Notifications\AnnouncementPublishedNotification;
use App\Notifications\BookingApprovedNotification;
use App\Notifications\BookingCancelledNotification;
use App\Notifications\BookingCreatedNotification;
use App\Notifications\BookingFailedNotification;
use App\Notifications\MatchReminderNotification;
use App\Notifications\PaymentSuccessfulNotification;
use App\Notifications\TournamentReminderNotification;
use App\Support\BookingNotificationSettings;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Event::listen(BookingCreated::class, function (BookingCreated $event): void {
            $config = BookingNotificationSettings::config('booking_created');

            if (! $config['enabled']) {
                return;
            }

            if ($config['notifyCustomer']) {
                $event->booking->user->notify(new BookingCreatedNotification($event->booking));
            }

            if ($config['notifyOwners']) {
                self::ownerUsers()->each(
                    fn ($owner) => $owner->notify(new BookingCreatedNotification($event->booking)),
                );
            }
        });

        Event::listen(BookingFailed::class, function (BookingFailed $event): void {
            $config = BookingNotificationSettings::config('booking_failed');

            if (! $config['enabled']) {
                return;
            }

            if ($config['notifyCustomer']) {
                $event->user->notify(new BookingFailedNotification(
                    $event->resourceId,
                    $event->startsAt,
                    $event->endsAt,
                    $event->reason,
                ));
            }

            if ($config['notifyOwners']) {
                self::ownerUsers()->each(
                    fn ($owner) => $owner->notify(new BookingFailedNotification(
                        $event->resourceId,
                        $event->startsAt,
                        $event->endsAt,
                        $event->reason,
                    )),
                );
            }
        });

        Event::listen(BookingApproved::class, function (BookingApproved $event): void {
            $config = BookingNotificationSettings::config('booking_approved');

            if (! $config['enabled']) {
                return;
            }

            if ($config['notifyCustomer']) {
                $event->booking->user->notify(new BookingApprovedNotification($event->booking));
            }

            if ($config['notifyOwners']) {
                self::ownerUsers()->each(
                    fn ($owner) => $owner->notify(new BookingApprovedNotification($event->booking)),
                );
            }
        });

        Event::listen(BookingCancelled::class, function (BookingCancelled $event): void {
            $config = BookingNotificationSettings::config('booking_cancelled');

            if (! $config['enabled']) {
                return;
            }

            if ($config['notifyCustomer']) {
                $event->booking->user->notify(new BookingCancelledNotification($event->booking));
            }

            if ($config['notifyOwners']) {
                self::ownerUsers()->each(
                    fn ($owner) => $owner->notify(new BookingCancelledNotification($event->booking)),
                );
            }
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
            User::role('player')->each(
                fn ($user) => $user->notify(new AnnouncementPublishedNotification($event->announcement)),
            );
        });
    }

    private static function ownerUsers(): Collection
    {
        return User::role([Role::SuperAdmin->value, Role::ClubAdmin->value])->get();
    }
}
