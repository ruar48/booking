<?php

namespace App\Notifications\Messages;

use App\Enums\MessengerTemplate;
use App\Models\ResourceBooking;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Str;

/**
 * What a notification wants said on Messenger: which template, the values for
 * its placeholders, and where its button goes. The channel decides whether it
 * goes out as an ordinary message or as the approved template.
 */
final class MessengerMessage
{
    /** @var array<string, string> */
    public readonly array $parameters;

    /**
     * @param  array<string, string|null>  $parameters
     */
    public function __construct(
        public readonly MessengerTemplate $template,
        array $parameters,
        public readonly string $url,
    ) {
        // Meta rejects template values with newlines, tabs or runs of spaces,
        // and an empty value fails the whole send.
        $this->parameters = collect($parameters)
            ->map(fn (?string $value) => Str::limit(Str::squish((string) $value), 200) ?: '-')
            ->all();
    }

    /**
     * The common case: a message about one booking, worded for whoever
     * receives it — the customer gets "your booking", staff get the
     * customer's name.
     *
     * @param  array<string, string|null>  $extra
     */
    public static function forBooking(
        ResourceBooking $booking,
        User $recipient,
        MessengerTemplate $customerTemplate,
        MessengerTemplate $staffTemplate,
        string $customerUrl,
        array $extra = [],
    ): self {
        $isCustomer = $booking->user_id === $recipient->id;

        return new self(
            $isCustomer ? $customerTemplate : $staffTemplate,
            [
                'name' => self::firstName($recipient),
                'customer' => $booking->user?->name ?? 'a walk-in customer',
                'court' => $booking->resource?->name ?? 'your court',
                'schedule' => self::schedule($booking->starts_at, $booking->ends_at),
                ...$extra,
            ],
            $isCustomer ? $customerUrl : route('bookings.show', $booking),
        );
    }

    public static function firstName(User $user): string
    {
        return Str::before(trim($user->name), ' ') ?: $user->name;
    }

    /**
     * "Sat, Nov 7, 6:00 PM to 8:00 PM", in the venue's timezone.
     */
    public static function schedule(CarbonInterface $startsAt, CarbonInterface $endsAt): string
    {
        $timezone = config('app.timezone');
        $start = $startsAt->copy()->setTimezone($timezone);
        $end = $endsAt->copy()->setTimezone($timezone);

        $endFormat = $start->isSameDay($end) ? 'g:i A' : 'D, M j, g:i A';

        return $start->format('D, M j, g:i A').' to '.$end->format($endFormat);
    }

    public function text(): string
    {
        return $this->template->render($this->parameters);
    }
}
