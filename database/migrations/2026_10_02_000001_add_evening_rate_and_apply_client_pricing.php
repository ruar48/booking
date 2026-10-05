<?php

use App\Enums\Sport;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Client pricing, October 2026: court reservations are ₱200/hr until 6pm and
 * ₱250/hr from 6pm (see BookingPricer), and open play is ₱100 per player.
 *
 * Existing bookings keep the amount they were priced at. Open play
 * registrations store their own amount too, so repricing upcoming sessions
 * only affects people who sign up from now on.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->decimal('evening_rate', 10, 2)->nullable()->after('hourly_rate');
        });

        DB::table('resources')
            ->where('sport', Sport::Pickleball->value)
            ->update(['hourly_rate' => 200, 'evening_rate' => 250]);

        DB::table('open_play_sessions')
            ->where('starts_at', '>=', now())
            ->update(['price_per_player' => 100]);
    }

    public function down(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->dropColumn('evening_rate');
        });
    }
};
