<?php

namespace App\Enums;

/**
 * Every Messenger notification the venue sends, and the one copy of its
 * wording.
 *
 * Meta only lets a Page message someone more than 24 hours after they last
 * wrote to it through a pre-approved Utility Template, so each case is
 * registered with Meta as a template (`php artisan messenger:setup`). Inside
 * the 24-hour window the same body is sent as an ordinary message instead,
 * rendered from these same placeholders, so the two can never drift apart.
 *
 * Template rules Meta enforces on the body: placeholders are `{{snake_case}}`,
 * the text may not start or end with one, and there may not be too many of
 * them for the length of the message. Changing a body means bumping the
 * template name (the `_v1` suffix) and re-running setup, because an approved
 * template's text cannot be edited in place.
 */
enum MessengerTemplate: string
{
    case BookingCreated = 'booking_created';
    case BookingCreatedStaff = 'booking_created_staff';
    case BookingApproved = 'booking_approved';
    case BookingApprovedStaff = 'booking_approved_staff';
    case BookingCancelled = 'booking_cancelled';
    case BookingCancelledStaff = 'booking_cancelled_staff';
    case BookingFailed = 'booking_failed';
    case BookingFailedStaff = 'booking_failed_staff';
    case BookingReminder = 'booking_reminder';
    case PaymentReceived = 'payment_received';
    case PaymentReceivedStaff = 'payment_received_staff';

    /**
     * The name the template is registered under with Meta.
     */
    public function templateName(): string
    {
        return $this->value.'_v1';
    }

    public function body(): string
    {
        return match ($this) {
            self::BookingCreated => 'Hi {{name}}, we received your booking for {{court}} on {{schedule}}. Please complete payment to secure your slot.',
            self::BookingCreatedStaff => 'New booking from {{customer}} for {{court}} on {{schedule}}. It is waiting for payment.',
            self::BookingApproved => 'Good news, {{name}}! Your booking for {{court}} on {{schedule}} is confirmed. See you on the court.',
            self::BookingApprovedStaff => 'Booking confirmed for {{customer}}: {{court}} on {{schedule}}. No action needed.',
            self::BookingCancelled => 'Hi {{name}}, your booking for {{court}} on {{schedule}} was cancelled. Reason: {{reason}}. Message us here if you have any questions.',
            self::BookingCancelledStaff => 'Booking cancelled for {{customer}}: {{court}} on {{schedule}}. Reason: {{reason}}. The slot is open again.',
            self::BookingFailed => 'Hi {{name}}, your booking for {{schedule}} could not be completed: {{reason}}. Please try another time slot.',
            self::BookingFailedStaff => 'A booking attempt by {{customer}} for {{schedule}} failed: {{reason}}. No booking was created.',
            self::BookingReminder => 'Reminder, {{name}}: your booking for {{court}} is on {{schedule}}. See you there!',
            self::PaymentReceived => 'Thank you, {{name}}! We received your payment of {{amount}}. Receipt {{reference}} is ready to view.',
            self::PaymentReceivedStaff => 'Payment received from {{customer}}: {{amount}}, receipt {{reference}}. It has been recorded.',
        };
    }

    /**
     * Sample values Meta reviews the template against. Every placeholder in
     * the body must have one.
     *
     * @return array<string, string>
     */
    public function examples(): array
    {
        $all = [
            'name' => 'Juan',
            'customer' => 'Juan Dela Cruz',
            'court' => 'Court 2',
            'schedule' => 'Sat, Nov 7, 6:00 PM to 8:00 PM',
            'reason' => 'Payment was not completed in time',
            'amount' => 'PHP 800.00',
            'reference' => 'INV-20261107-0001',
        ];

        return array_intersect_key($all, array_flip($this->placeholders()));
    }

    /**
     * @return list<string>
     */
    public function placeholders(): array
    {
        preg_match_all('/\{\{(\w+)\}\}/', $this->body(), $matches);

        return array_values(array_unique($matches[1]));
    }

    public function buttonLabel(): string
    {
        return match ($this) {
            self::PaymentReceived, self::PaymentReceivedStaff => 'View receipt',
            self::BookingFailed => 'Book again',
            self::BookingFailedStaff => 'Open calendar',
            default => 'View booking',
        };
    }

    /**
     * Fills the body's placeholders, for sending as a plain message inside
     * the 24-hour window.
     *
     * @param  array<string, string>  $parameters
     */
    public function render(array $parameters): string
    {
        return preg_replace_callback(
            '/\{\{(\w+)\}\}/',
            fn (array $match) => $parameters[$match[1]] ?? '',
            $this->body(),
        );
    }
}
