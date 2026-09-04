<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The checkout policy predates the reschedule rules, so it still told customers
 * only that bookings are non-refundable — with nothing about the 2-day
 * self-service reschedule window or the fact that members cannot cancel.
 */
return new class extends Migration
{
    private const SLUG = 'payment-refund-policy';

    /** @var list<string> */
    private const NEW_BODY = [
        'Confirmed only once payment is received in full.',
        'Unpaid bookings are auto-cancelled after the time shown and the slot is released.',
        'Non-refundable once confirmed, except if the venue cancels or reschedules.',
        'You can reschedule a booking yourself up to 2 days before its start time, once per booking.',
        'Within 2 days of the start time the slot is locked — contact the venue if you need a change.',
        'Only venue staff can cancel a confirmed booking.',
    ];

    /** @var list<string> */
    private const OLD_BODY = [
        'Confirmed only once payment is received in full.',
        'Non-refundable once confirmed, except if the venue cancels or reschedules.',
        'Unpaid bookings are auto-cancelled after the time shown.',
    ];

    public function up(): void
    {
        $this->write(self::NEW_BODY, increment: true);
    }

    public function down(): void
    {
        $this->write(self::OLD_BODY, increment: false);
    }

    /**
     * @param  list<string>  $lines
     */
    private function write(array $lines, bool $increment): void
    {
        $policy = DB::table('policies')->where('slug', self::SLUG)->first();

        // The row is seeded by the create-table migration, but an admin may
        // have deleted it — there is nothing to rewrite if so.
        if ($policy === null) {
            return;
        }

        DB::table('policies')
            ->where('slug', self::SLUG)
            ->update([
                'body' => implode("\n", $lines),
                'version' => $increment ? $policy->version + 1 : max(1, $policy->version - 1),
                'updated_at' => now(),
            ]);
    }
};
