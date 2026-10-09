<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Sections of the public Photos tab ("Our courts", …). A photo without a
 * category still shows, in a catch-all section at the end.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gallery_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('gallery_photos', function (Blueprint $table) {
            $table->foreignId('gallery_category_id')
                ->nullable()
                ->after('id')
                ->constrained('gallery_categories')
                ->nullOnDelete();
        });

        // The Photos tab has always had an "Our courts" section; start with it
        // so the admin has somewhere to put court photos straight away.
        DB::table('gallery_categories')->insert([
            'name' => 'Our courts',
            'sort_order' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::table('gallery_photos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('gallery_category_id');
        });

        Schema::dropIfExists('gallery_categories');
    }
};
