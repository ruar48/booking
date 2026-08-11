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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('paymongo_checkout_session_id')->nullable()->unique()->after('payment_method');
            $table->text('checkout_url')->nullable()->after('paymongo_checkout_session_id');
            $table->json('raw_response')->nullable()->after('checkout_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['paymongo_checkout_session_id', 'checkout_url', 'raw_response']);
        });
    }
};
