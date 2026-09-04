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

            dispatch(function () use ($event, $config): void {
                self::recipients($event->booking->user, $config)->each(
                    fn (User $user) => $user->notify(new BookingCreatedNotification($event->booking)),
                );
            })->afterResponse();
        });

        Event::listen(BookingFailed::class, function (BookingFailed $event): void {
            $config = BookingNotificationSettings::config('booking_failed');

            if (! $config['enabled']) {
                return;
            }

            dispatch(function () use ($event, $config): void {
                self::recipients($event->user, $config)->each(
                    fn (User $user) => $user->notify(new BookingFailedNotification(
                        $event->user,
                        $event->resourceId,
                        $event->startsAt,
                        $event->endsAt,
                        $event->reason,
                    )),
                );
            })->afterResponse();
        });

        Event::listen(BookingApproved::class, function (BookingApproved $event): void {
            $config = BookingNotificationSettings::config('booking_approved');

            if (! $config['enabled']) {
                return;
            }

            dispatch(function () use ($event, $config): void {
                self::recipients($event->booking->user, $config)->each(
                    fn (User $user) => $user->notify(new BookingApprovedNotification($event->booking)),
                );
            })->afterResponse();
        });

        Event::listen(BookingCancelled::class, function (BookingCancelled $event): void {
            $config = BookingNotificationSettings::config('booking_cancelled');

            if (! $config['enabled']) {
                return;
            }

            dispatch(function () use ($event, $config): void {
                self::recipients($event->booking->user, $config)->each(
                    fn (User $user) => $user->notify(new BookingCancelledNotification($event->booking)),
                );
            })->afterResponse();
        });

        Event::listen(MatchReminder::class, function (MatchReminder $event): void {
            dispatch(function () use ($event): void {
                $event->match->player1?->user?->notify(new MatchReminderNotification($event->match));
                $event->match->player2?->user?->notify(new MatchReminderNotification($event->match));
            })->afterResponse();
        });

        Event::listen(TournamentReminder::class, function (TournamentReminder $event): void {
            dispatch(function () use ($event): void {
                $event->tournament->registrations->each(
                    fn ($registration) => $registration->player?->user?->notify(
                        new TournamentReminderNotification($event->tournament),
                    ),
                );
            })->afterResponse();
        });

        Event::listen(PaymentSuccessful::class, function (PaymentSuccessful $event): void {
            $config = BookingNotificationSettings::config('payment_successful');

            if (! $config['enabled']) {
                return;
            }

            dispatch(function () use ($event, $config): void {
                self::recipients($event->payment->user, $config)->each(
                    fn (User $user) => $user->notify(new PaymentSuccessfulNotification($event->payment)),
                );
            })->afterResponse();
        });

        Event::listen(AnnouncementPublished::class, function (AnnouncementPublished $event): void {
            dispatch(function () use ($event): void {
                User::role('player')->each(
                    fn ($user) => $user->notify(new AnnouncementPublishedNotification($event->announcement)),
                );
            })->afterResponse();
        });
    }

    /**
     * Everyone who should receive a customer+owners notification, deduplicated.
     *
     * Staff booking or paying for themselves are both the customer and an
     * owner, so notifying the two groups independently sent them the same
     * notification and the same email twice.
     *
     * @param  array{notifyCustomer: bool, notifyOwners: bool}  $config
     * @return Collection<int, User>
     */
    private static function recipients(?User $customer, array $config): Collection
    {
        $recipients = new Collection;

        if ($config['notifyCustomer'] && $customer !== null) {
            $recipients->push($customer);
        }

        if ($config['notifyOwners']) {
            $recipients = $recipients->concat(self::ownerUsers());
        }

        return $recipients->unique('id')->values();
    }

    /**
     * @return Collection<int, User>
     */
    private static function ownerUsers(): Collection
    {
        return User::role([Role::SuperAdmin->value, Role::ClubAdmin->value])->get();
    }
}
