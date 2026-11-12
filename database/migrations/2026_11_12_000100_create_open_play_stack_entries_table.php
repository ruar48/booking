<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The paddle stack: one row per player who has checked in to a
 * paddle-stacking session, recording whether they are in line, on a court
 * or sitting out.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('open_play_stack_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('open_play_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('waiting');
            // The court the player is on while playing.
            $table->foreignId('resource_id')->nullable()->constrained()->nullOnDelete();
            // Place in line. Only ever grows: re-stacking takes the next number,
            // which is what puts a player at the back.
            $table->unsignedInteger('position')->default(0);
            $table->unsignedSmallInteger('games_played')->default(0);
            $table->timestamps();

            $table->unique(['open_play_session_id', 'player_id'], 'op_stack_session_player_unique');
            $table->index(['open_play_session_id', 'status', 'position'], 'op_stack_line_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('open_play_stack_entries');
    }
};
