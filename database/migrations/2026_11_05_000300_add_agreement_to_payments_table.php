<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Proof of what a customer agreed to before paying online: which versions of
 * the checkout policy and Terms were in force, when they ticked the box, and
 * from which IP address and browser. Kept with the payment it covers.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->timestamp('agreed_at')->nullable()->after('flagged_at');
            $table->json('agreement')->nullable()->after('agreed_at');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->dropColumn(['agreed_at', 'agreement']);
        });
    }
};
