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
        Schema::table('club_event_registrations', function (Blueprint $table) {
            $table->string('payment_status')->default('unpaid')->after('partner_player_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('club_event_registrations', function (Blueprint $table) {
            $table->dropColumn('payment_status');
        });
    }
};
