<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bulk booking submissions (e.g. selecting several hourly slots on the
        // calendar) create one resource_bookings row per contiguous run, but
        // checkout only ever operated on the single "first" booking returned
        // — silently dropping the rest of the customer's hours from the QR
        // payment amount. booking_group_id ties every row from one submission
        // together so checkout can total and pay them as a single group.
        Schema::table('resource_bookings', function (Blueprint $table) {
            $table->uuid('booking_group_id')->nullable()->after('id');
            $table->index('booking_group_id');
        });
    }

    public function down(): void
    {
        Schema::table('resource_bookings', function (Blueprint $table) {
            $table->dropIndex(['booking_group_id']);
            $table->dropColumn('booking_group_id');
        });
    }
};
