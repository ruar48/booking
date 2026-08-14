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
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('type')->default('general')->after('content');
            $table->foreignId('open_play_session_id')->nullable()->after('type')->constrained()->nullOnDelete();
            $table->string('image_path')->nullable()->after('open_play_session_id');
            $table->string('image_source')->nullable()->after('image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('open_play_session_id');
            $table->dropColumn(['type', 'image_path', 'image_source']);
        });
    }
};
