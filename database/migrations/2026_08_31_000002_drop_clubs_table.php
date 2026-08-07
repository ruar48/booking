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
        // Must run after club_user and every table with a club_id foreign
        // key has been dropped.
        Schema::dropIfExists('clubs');
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
