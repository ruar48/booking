<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('rental_items') && ! Schema::hasColumn('rental_items', 'hourly_rate')) {
            Schema::table('rental_items', function (Blueprint $table): void {
                $table->decimal('hourly_rate', 10, 2)->nullable()->after('rate');
            });
        }

        if (Schema::hasTable('rental_transactions') && ! Schema::hasColumn('rental_transactions', 'duration_type')) {
            Schema::table('rental_transactions', function (Blueprint $table): void {
                $table->string('duration_type')->default('daily')->after('due_at');
                $table->unsignedInteger('duration_hours')->nullable()->after('duration_type');
                $table->date('reserved_for')->nullable()->after('duration_hours');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('rental_transactions') && Schema::hasColumn('rental_transactions', 'duration_type')) {
            Schema::table('rental_transactions', function (Blueprint $table): void {
                $table->dropColumn(['duration_type', 'duration_hours', 'reserved_for']);
            });
        }

        if (Schema::hasTable('rental_items') && Schema::hasColumn('rental_items', 'hourly_rate')) {
            Schema::table('rental_items', function (Blueprint $table): void {
                $table->dropColumn('hourly_rate');
            });
        }
    }
};
