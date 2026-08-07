<?php

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\Role as RoleEnum;
use App\Enums\Sport;
use App\Models\Announcement;
use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Product;
use App\Models\RecurringScheduleLock;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Sale;
use App\Models\ScheduleBlock;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');

        $owner = User::factory()->create([
            'name' => 'Court Owner',
            'email' => 'owner@galaangramos.test',
            'password' => $password,
        ]);
        $owner->assignRole(RoleEnum::SuperAdmin);

        Setting::query()->create([
            'group' => 'schedule',
            'key' => 'operating_hours',
            'value' => [
                'monday' => ['open' => '07:00', 'close' => '23:00'],
                'tuesday' => ['open' => '07:00', 'close' => '23:00'],
                'wednesday' => ['open' => '07:00', 'close' => '23:00'],
                'thursday' => ['open' => '07:00', 'close' => '23:00'],
                'friday' => ['open' => '07:00', 'close' => '23:00'],
                'saturday' => ['open' => '07:00', 'close' => '23:00'],
                'sunday' => ['open' => '07:00', 'close' => '23:00'],
            ],
        ]);

        $courts = Resource::factory()
            ->count(2)
            ->sequence(
                ['name' => 'Court 1', 'resource_number' => '1', 'surface_type' => 'acrylic', 'has_lighting' => true, 'hourly_rate' => 25],
                ['name' => 'Court 2', 'resource_number' => '2', 'surface_type' => 'acrylic', 'has_lighting' => true, 'hourly_rate' => 25],
            )
            ->create(['sport' => Sport::Pickleball]);

        $billiardsTables = Resource::factory()
            ->count(2)
            ->sequence(
                ['name' => 'Table 1', 'resource_number' => '1', 'surface_type' => 'felt', 'has_lighting' => true, 'hourly_rate' => 15],
                ['name' => 'Table 2', 'resource_number' => '2', 'surface_type' => 'felt', 'has_lighting' => true, 'hourly_rate' => 15],
            )
            ->create(['sport' => Sport::Billiards]);

        $members = collect();

        foreach (range(1, 16) as $index) {
            $member = User::factory()->create([
                'name' => fake()->name(),
                'email' => "member{$index}@galaangramos.test",
                'password' => $password,
            ]);
            $member->assignRole(RoleEnum::Player);

            $members->push(Player::factory()->create([
                'user_id' => $member->id,
            ]));
        }

        foreach ($members->take(3) as $index => $player) {
            ResourceBooking::factory()->create([
                'resource_id' => $courts[$index % 2]->id,
                'user_id' => $player->user_id,
                'approved_by' => $owner->id,
                'starts_at' => now()->addDays($index + 1)->setTime(9 + $index, 0),
                'ends_at' => now()->addDays($index + 1)->setTime(10 + $index, 0),
                'status' => BookingStatus::Approved,
                'payment_status' => PaymentStatus::Paid,
                'amount' => 25,
            ]);
        }

        ResourceBooking::factory()->create([
            'resource_id' => $courts->first()->id,
            'user_id' => $members->first()->user_id,
            'starts_at' => now()->addDays(2)->setTime(14, 0),
            'ends_at' => now()->addDays(2)->setTime(15, 0),
            'status' => BookingStatus::Approved,
            'payment_status' => PaymentStatus::Unpaid,
            'amount' => 25,
        ]);

        Announcement::factory()->published()->create([
            'created_by' => $owner->id,
            'title' => 'Welcome to our courts',
            'content' => 'Book Court 1 or Court 2 online anytime. Peak hours are 5–8 PM on weekdays — reserve early!',
            'show_on_dashboard' => true,
            'show_on_home' => true,
            'show_on_player_portal' => true,
        ]);

        // -----------------------------------------------------------------
        // Extra resource bookings for a busier calendar demo, spread across
        // the current month with a realistic mix of statuses.
        // -----------------------------------------------------------------
        $bookableResources = $courts->merge($billiardsTables);
        $bookingStatusCycle = [
            [BookingStatus::Approved, PaymentStatus::Paid],
            [BookingStatus::Approved, PaymentStatus::Paid],
            [BookingStatus::Approved, PaymentStatus::Unpaid],
            [BookingStatus::Pending, PaymentStatus::Unpaid],
            [BookingStatus::Completed, PaymentStatus::Paid],
            [BookingStatus::Cancelled, PaymentStatus::Refunded],
            [BookingStatus::Rejected, PaymentStatus::Unpaid],
        ];
        $bookingHours = [8, 9, 10, 13, 14, 16, 17, 18, 19, 20];

        foreach (range(-10, 18) as $dayOffset) {
            $bookingsToday = fake()->numberBetween(1, 3);

            foreach (range(1, $bookingsToday) as $slot) {
                $resource = $bookableResources->random();
                $member = $members->random();
                [$status, $paymentStatus] = $bookingStatusCycle[array_rand($bookingStatusCycle)];
                $hour = fake()->randomElement($bookingHours);
                $day = now()->addDays($dayOffset);

                // Past days should read as completed/paid rather than pending.
                if ($dayOffset < 0 && in_array($status, [BookingStatus::Pending], true)) {
                    $status = BookingStatus::Completed;
                    $paymentStatus = PaymentStatus::Paid;
                }

                ResourceBooking::factory()->create([
                    'resource_id' => $resource->id,
                    'user_id' => $member->user_id,
                    'approved_by' => $status === BookingStatus::Pending ? null : $owner->id,
                    'starts_at' => (clone $day)->setTime($hour, 0),
                    'ends_at' => (clone $day)->setTime($hour + 1, 0),
                    'status' => $status,
                    'payment_status' => $paymentStatus,
                    'amount' => $resource->hourly_rate,
                ]);
            }
        }

        // -----------------------------------------------------------------
        // Payments tied to court bookings (separate from the booking's own
        // payment_status column — these back the Payments admin page).
        // -----------------------------------------------------------------
        ResourceBooking::query()
            ->where('payment_status', PaymentStatus::Paid)
            ->latest()
            ->take(8)
            ->get()
            ->each(function (ResourceBooking $booking) {
                Payment::query()->create([
                    'user_id' => $booking->user_id,
                    'payable_type' => ResourceBooking::class,
                    'payable_id' => $booking->id,
                    'invoice_number' => 'INV-'.Str::upper(Str::random(10)),
                    'amount' => $booking->amount ?? 25,
                    'currency' => 'PHP',
                    'status' => PaymentStatus::Paid,
                    'payment_method' => fake()->randomElement(PaymentMethod::cases())->value,
                    'paid_at' => $booking->created_at ?? now(),
                ]);
            });

        ResourceBooking::query()
            ->where('payment_status', PaymentStatus::Unpaid)
            ->where('status', '!=', BookingStatus::Cancelled)
            ->take(4)
            ->get()
            ->each(function (ResourceBooking $booking) {
                Payment::query()->create([
                    'user_id' => $booking->user_id,
                    'payable_type' => ResourceBooking::class,
                    'payable_id' => $booking->id,
                    'invoice_number' => 'INV-'.Str::upper(Str::random(10)),
                    'amount' => $booking->amount ?? 25,
                    'currency' => 'PHP',
                    'status' => PaymentStatus::Pending,
                    'payment_method' => null,
                    'paid_at' => null,
                ]);
            });

        // -----------------------------------------------------------------
        // Schedule blocks & recurring locks (Admin > Schedule page).
        // -----------------------------------------------------------------
        ScheduleBlock::query()->create([
            'resource_id' => $courts[1]->id,
            'starts_at' => now()->addDays(6)->setTime(9, 0),
            'ends_at' => now()->addDays(6)->setTime(13, 0),
            'reason' => 'Court resurfacing maintenance',
            'created_by' => $owner->id,
        ]);

        ScheduleBlock::query()->create([
            'resource_id' => null,
            'starts_at' => now()->addDays(20)->setTime(0, 0),
            'ends_at' => now()->addDays(20)->setTime(23, 59),
            'reason' => 'Club closed — public holiday',
            'created_by' => $owner->id,
        ]);

        RecurringScheduleLock::query()->create([
            'resource_id' => $courts[0]->id,
            'day_of_week' => 1,
            'starts_at' => '12:00',
            'ends_at' => '13:00',
            'reason' => 'Weekly court cleaning',
            'created_by' => $owner->id,
        ]);

        RecurringScheduleLock::query()->create([
            'resource_id' => null,
            'day_of_week' => 0,
            'starts_at' => '06:00',
            'ends_at' => '07:00',
            'reason' => 'Facility inspection',
            'created_by' => $owner->id,
        ]);

        // -----------------------------------------------------------------
        // More announcements for the club feed.
        // -----------------------------------------------------------------
        Announcement::factory()->published()->create([
            'created_by' => $owner->id,
            'title' => 'New 1v1 and 2v2 open play formats',
            'content' => 'We just added dedicated singles ladders and doubles knockouts to Open Play — check the schedule and register your slot.',
            'show_on_dashboard' => true,
            'show_on_home' => true,
            'show_on_player_portal' => true,
        ]);

        Announcement::factory()->published()->create([
            'created_by' => $owner->id,
            'title' => 'Pro shop restock: new paddles in',
            'content' => 'Fresh stock of Pro Series paddles, grip tape, and apparel is now available at the front desk.',
            'show_on_dashboard' => true,
            'show_on_home' => false,
            'show_on_player_portal' => true,
        ]);

        // -----------------------------------------------------------------
        // Audit log entries (Admin > Audit logs page).
        // -----------------------------------------------------------------
        $auditSpecs = [
            ['user' => $owner, 'action' => 'booking.approved', 'type' => ResourceBooking::class, 'days' => 6],
            ['user' => $owner, 'action' => 'booking.rejected', 'type' => ResourceBooking::class, 'days' => 5],
            ['user' => $owner, 'action' => 'sale.completed', 'type' => Sale::class, 'days' => 4],
            ['user' => $owner, 'action' => 'sale.voided', 'type' => Sale::class, 'days' => 3],
            ['user' => $owner, 'action' => 'product.restocked', 'type' => Product::class, 'days' => 3],
            ['user' => $owner, 'action' => 'announcement.published', 'type' => Announcement::class, 'days' => 2],
            ['user' => $owner, 'action' => 'schedule.block_created', 'type' => ScheduleBlock::class, 'days' => 2],
            ['user' => $members->first()->user, 'action' => 'auth.login', 'type' => null, 'days' => 1],
            ['user' => $owner, 'action' => 'payment.marked_paid', 'type' => Payment::class, 'days' => 0],
        ];

        foreach ($auditSpecs as $spec) {
            AuditLog::query()->create([
                'user_id' => $spec['user']?->id,
                'action' => $spec['action'],
                'auditable_type' => $spec['type'],
                'auditable_id' => $spec['type'] ? fake()->numberBetween(1, 10) : null,
                'old_values' => null,
                'new_values' => null,
                'ip_address' => fake()->ipv4(),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'created_at' => now()->subDays($spec['days']),
                'updated_at' => now()->subDays($spec['days']),
            ]);
        }
    }
}
