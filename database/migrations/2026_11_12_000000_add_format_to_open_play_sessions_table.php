<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Open play can now run as paddle stacking (a queue for the next free court)
 * instead of a bracket. Existing sessions were all set up as brackets, so
 * they keep that format; the create form defaults new ones to paddle stacking.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->string('format')->default('bracket')->after('target_score');
        });
    }

    public function down(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->dropColumn('format');
        });
    }
};
