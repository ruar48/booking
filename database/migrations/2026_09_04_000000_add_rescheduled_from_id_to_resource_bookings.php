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
        Schema::table('resource_bookings', function (Blueprint $table) {
            $table->foreignId('rescheduled_from_id')
                ->nullable()
                ->after('booking_group_id')
                ->constrained('resource_bookings')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resource_bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('rescheduled_from_id');
        });
    }
};
