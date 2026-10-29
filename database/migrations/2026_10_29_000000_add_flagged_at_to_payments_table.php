<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Set when a payment needs a person: a duplicate or late payment that must
     * be refunded, or an amount PayMongo reported that doesn't match. The
     * reason is written to notes.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->timestamp('flagged_at')->nullable()->index()->after('paid_at');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['flagged_at']);
            $table->dropColumn('flagged_at');
        });
    }
};
