<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Coaches become something the venue lists on its public page. Most coaches
 * never log in, so the linked user account turns optional and the profile
 * (name, photo, rate, contact) lives on the coach row itself.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coaches', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->string('name')->default('')->after('user_id');
            $table->string('photo_path')->nullable()->after('name');
            $table->string('phone', 30)->nullable()->after('photo_path');
            $table->json('specialties')->nullable()->after('bio');
            $table->decimal('rate_per_hour', 10, 2)->nullable()->after('specialties');
            $table->unsignedInteger('sort_order')->default(0)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('coaches', function (Blueprint $table) {
            $table->dropColumn(['name', 'photo_path', 'phone', 'specialties', 'rate_per_hour', 'sort_order']);
        });
    }
};
