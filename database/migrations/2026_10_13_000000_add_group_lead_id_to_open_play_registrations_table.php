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
        Schema::table('open_play_registrations', function (Blueprint $table) {
            // A registration paid for by someone else points at the payer's
            // ("lead") registration. The lead row carries the whole group's
            // amount; member rows carry 0 so revenue sums stay accurate.
            $table->foreignId('group_lead_id')
                ->nullable()
                ->after('partner_player_id')
                ->constrained('open_play_registrations')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('open_play_registrations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('group_lead_id');
        });
    }
};
