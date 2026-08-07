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
        Schema::create('open_play_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('open_play_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('entry1_id')->constrained('open_play_registrations')->cascadeOnDelete();
            $table->foreignId('entry2_id')->constrained('open_play_registrations')->cascadeOnDelete();
            $table->unsignedSmallInteger('entry1_score')->nullable();
            $table->unsignedSmallInteger('entry2_score')->nullable();
            $table->foreignId('winner_registration_id')->nullable()->constrained('open_play_registrations')->nullOnDelete();
            $table->string('status')->default('scheduled');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('open_play_matches');
    }
};
