<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Simple club_id FK columns (no other constraints touching club_id).
        $simpleTables = [
            'resources',
            'products',
            'sales',
            'players',
            'tournaments',
            'coaches',
            'announcements',
            'training_sessions',
            'rental_items',
            'rental_transactions',
            'schedule_blocks',
        ];

        foreach ($simpleTables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropForeign(['club_id']);
                $table->dropColumn('club_id');
            });
        }

        // settings: composite unique index included club_id.
        // Since there is now only a single "club", group+key alone is the
        // meaningful uniqueness constraint going forward.
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique(['club_id', 'group', 'key']);
            $table->dropForeign(['club_id']);
            $table->dropColumn('club_id');
            $table->unique(['group', 'key']);
        });

        // rankings: composite unique index included club_id.
        // With a single club, a player now has one ranking record, so
        // player_id alone becomes unique.
        Schema::table('rankings', function (Blueprint $table) {
            $table->dropUnique(['player_id', 'club_id']);
            $table->dropForeign(['club_id']);
            $table->dropColumn('club_id');
            $table->unique('player_id');
        });

        // recurring_schedule_locks: named composite unique index included club_id.
        Schema::table('recurring_schedule_locks', function (Blueprint $table) {
            $table->dropUnique('recurring_lock_unique');
            $table->dropForeign(['club_id']);
            $table->dropColumn('club_id');
            $table->unique(['resource_id', 'day_of_week', 'starts_at', 'ends_at'], 'recurring_lock_unique');
        });

        // date_overrides: composite unique index included club_id.
        // With a single club, a date can only have one override.
        Schema::table('date_overrides', function (Blueprint $table) {
            $table->dropUnique(['club_id', 'date']);
            $table->dropForeign(['club_id']);
            $table->dropColumn('club_id');
            $table->unique('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Intentionally left empty: the club feature is being removed and its
        // schema is not meant to be reconstructed.
    }
};
