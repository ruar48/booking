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
        Schema::rename('courts', 'resources');

        Schema::table('resources', function (Blueprint $table) {
            $table->string('sport')->default('pickleball')->after('club_id');
            $table->json('metadata')->nullable()->after('description');
        });

        Schema::table('resources', function (Blueprint $table) {
            $table->renameColumn('court_number', 'resource_number');
        });

        Schema::rename('court_bookings', 'resource_bookings');

        Schema::table('resource_bookings', function (Blueprint $table) {
            $table->renameColumn('court_id', 'resource_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resource_bookings', function (Blueprint $table) {
            $table->renameColumn('resource_id', 'court_id');
        });

        Schema::rename('resource_bookings', 'court_bookings');

        Schema::table('resources', function (Blueprint $table) {
            $table->renameColumn('resource_number', 'court_number');
        });

        Schema::table('resources', function (Blueprint $table) {
            $table->dropColumn(['sport', 'metadata']);
        });

        Schema::rename('resources', 'courts');
    }
};
