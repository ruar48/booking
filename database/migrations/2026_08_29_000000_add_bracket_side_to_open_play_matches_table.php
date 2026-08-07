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
            $table->string('bracket_side')->nullable()->after('bracket_position');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('open_play_matches', function (Blueprint $table) {
            $table->dropColumn('bracket_side');
        });
    }
};
