<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->json('amenities')->nullable()->after('operating_hours');
            $table->json('gallery')->nullable()->after('amenities');
        });

        Schema::table('club_events', function (Blueprint $table) {
            $table->decimal('price_per_player', 8, 2)->nullable()->after('location');
            $table->unsignedSmallInteger('max_players')->nullable()->after('price_per_player');
            $table->string('skill_level')->default('all_levels')->after('max_players');
        });
    }

    public function down(): void
    {
        Schema::table('club_events', function (Blueprint $table) {
            $table->dropColumn(['price_per_player', 'max_players', 'skill_level']);
        });

        Schema::table('clubs', function (Blueprint $table) {
            $table->dropColumn(['amenities', 'gallery']);
        });
    }
};
