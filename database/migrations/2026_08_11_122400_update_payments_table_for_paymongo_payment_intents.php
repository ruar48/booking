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
            $table->dropUnique(['paymongo_checkout_session_id']);
            $table->dropColumn(['paymongo_checkout_session_id', 'checkout_url']);

            $table->string('paymongo_payment_intent_id')->nullable()->unique()->after('payment_method');
            $table->string('paymongo_payment_method_id')->nullable()->after('paymongo_payment_intent_id');
            $table->text('qr_code_url')->nullable()->after('paymongo_payment_method_id');
            $table->timestamp('qr_expires_at')->nullable()->after('qr_code_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['paymongo_payment_intent_id']);
            $table->dropColumn(['paymongo_payment_intent_id', 'paymongo_payment_method_id', 'qr_code_url', 'qr_expires_at']);

            $table->string('paymongo_checkout_session_id')->nullable()->unique()->after('payment_method');
            $table->text('checkout_url')->nullable()->after('paymongo_checkout_session_id');
        });
    }
};
