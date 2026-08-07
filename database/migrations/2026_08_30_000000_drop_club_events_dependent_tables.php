<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop child tables first to respect FK order (matches/registrations
        // reference club_events).
        Schema::dropIfExists('club_event_matches');
        Schema::dropIfExists('club_event_registrations');
        Schema::dropIfExists('club_events');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Intentionally left empty: the club feature is being removed and its
        // schema is not meant to be reconstructed.
    }
};
