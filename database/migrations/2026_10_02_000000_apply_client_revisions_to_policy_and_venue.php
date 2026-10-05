<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Client revisions of October 2026: paid bookings became final (no cancelling,
 * no rescheduling — see ResourceBookingPolicy), unpaid bookings are released
 * after one hour, and the venue moved its listed address and contact details.
 *
 * Venue fields are merged into the existing profile rather than replacing it,
 * so the email and gallery an admin has set are kept; the profile is created
 * when there is none.
 */
return new class extends Migration
{
    private const POLICY_SLUG = 'payment-refund-policy';

    /** @var list<string> */
    private const POLICY_BODY = [
        'A booking shall be considered confirmed only upon receipt of full payment.',
        'Unpaid bookings will be automatically cancelled if payment is not completed within one (1) hour from the time the booking is created.',
        'Once an unpaid booking is cancelled, the reserved time slot will automatically be released and made available to other customers.',
        'All confirmed and fully paid bookings are final.',
        'Cancellation of a confirmed booking is not permitted once payment has been completed.',
        'Rescheduling or modification of the booking date, time, or court is not permitted once payment has been completed.',
        'All payments are non-refundable, except when the booking is cancelled by the venue.',
        'Customers are responsible for reviewing the selected court, date, time, and other booking details before completing payment.',
    ];

    /** @var array<string, mixed> */
    private const VENUE = [
        'address_line_1' => 'Santa Maria Norte',
        'city' => 'Binalonan',
        'state' => 'Pangasinan',
        'postal_code' => '2436',
        'country' => 'PH',
        'latitude' => '16.064892',
        'longitude' => '120.585013',
        'phone' => '+639507370338',
        'website' => 'galaangramospickleball.com',
        'description' => 'A place where you can enjoy playing pickleball with your friends, family, and fellow players. Whether you are a beginner or an experienced player, everyone is welcome to play, have fun, stay active, and enjoy the game together.',
        'amenities' => [
            'Restrooms',
            'Shower rooms',
            'Equipment rental',
            'Parking area',
            'Snack or refreshment area',
        ],
    ];

    public function up(): void
    {
        $policy = DB::table('policies')->where('slug', self::POLICY_SLUG)->first();

        if ($policy !== null) {
            DB::table('policies')
                ->where('slug', self::POLICY_SLUG)
                ->update([
                    'title' => 'Payment and Booking Policy',
                    'body' => implode("\n", self::POLICY_BODY),
                    'version' => $policy->version + 1,
                    'updated_at' => now(),
                ]);
        }

        DB::table('settings')->updateOrInsert(
            ['group' => 'bookings', 'key' => 'unpaid_cancel_minutes'],
            ['value' => json_encode(60), 'updated_at' => now(), 'created_at' => now()],
        );

        $profile = DB::table('settings')
            ->where('group', 'venue')
            ->where('key', 'profile')
            ->value('value');

        if ($profile !== null) {
            DB::table('settings')
                ->where('group', 'venue')
                ->where('key', 'profile')
                ->update([
                    'value' => json_encode([...(json_decode($profile, true) ?? []), ...self::VENUE]),
                    'updated_at' => now(),
                ]);

            return;
        }

        // No profile yet (e.g. an install that never ran the demo seeder):
        // create it, otherwise the public About tab renders empty and Venue
        // Settings has no form to edit.
        DB::table('settings')->insert([
            'group' => 'venue',
            'key' => 'profile',
            'value' => json_encode([...self::VENUE, 'email' => null, 'gallery' => []]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Content-only change: the previous wording and address are not worth
     * restoring automatically, and doing so could clobber later admin edits.
     */
    public function down(): void {}
};
