<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('policies', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('placement')->default('checkout');
            $table->text('body');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('version')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        DB::table('policies')->insert([
            'title' => 'Payment & Refund Policy',
            'slug' => 'payment-refund-policy',
            'placement' => 'checkout',
            'body' => implode("\n", [
                'Confirmed only once payment is received in full.',
                'Non-refundable once confirmed, except if the venue cancels or reschedules.',
                'Unpaid bookings are auto-cancelled after the time shown.',
            ]),
            'is_active' => true,
            'version' => 1,
            'sort_order' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('policies');
    }
};
