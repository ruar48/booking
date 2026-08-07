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
        Schema::table('open_play_matches', function (Blueprint $table) {
            $table->dropForeign(['entry1_id']);
            $table->dropForeign(['entry2_id']);
            $table->dropColumn(['entry1_id', 'entry2_id']);
        });

        Schema::table('open_play_matches', function (Blueprint $table) {
            $table->foreignId('entry1_id')->nullable()->after('open_play_session_id')
                ->constrained('open_play_registrations')->nullOnDelete();
            $table->foreignId('entry2_id')->nullable()->after('entry1_id')
                ->constrained('open_play_registrations')->nullOnDelete();
            $table->unsignedSmallInteger('round')->default(1)->after('winner_registration_id');
            $table->unsignedSmallInteger('bracket_position')->nullable()->after('round');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('open_play_matches', function (Blueprint $table) {
            $table->dropColumn(['round', 'bracket_position']);
            $table->dropForeign(['entry1_id']);
            $table->dropForeign(['entry2_id']);
            $table->dropColumn(['entry1_id', 'entry2_id']);
        });

        Schema::table('open_play_matches', function (Blueprint $table) {
            $table->foreignId('entry1_id')->after('open_play_session_id')
                ->constrained('open_play_registrations')->cascadeOnDelete();
            $table->foreignId('entry2_id')->after('entry1_id')
                ->constrained('open_play_registrations')->cascadeOnDelete();
        });
    }
};
