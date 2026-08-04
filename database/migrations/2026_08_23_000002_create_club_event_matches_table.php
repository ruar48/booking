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
        Schema::create('club_event_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('entry1_id')->constrained('club_event_registrations')->cascadeOnDelete();
            $table->foreignId('entry2_id')->constrained('club_event_registrations')->cascadeOnDelete();
            $table->unsignedSmallInteger('entry1_score')->nullable();
            $table->unsignedSmallInteger('entry2_score')->nullable();
            $table->foreignId('winner_registration_id')->nullable()->constrained('club_event_registrations')->nullOnDelete();
            $table->string('status')->default('scheduled');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('club_event_matches');
    }
};
