<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Page-scoped ID: who this user is to the venue's Facebook Page.
            // Only Meta hands it out, through the webhook, after the user
            // opens the Page's Messenger link themselves.
            $table->string('messenger_psid')->nullable()->unique();
            $table->timestamp('messenger_connected_at')->nullable();
            // Last time they wrote to the Page. Meta allows ordinary messages
            // for 24 hours after this; past it, only approved templates.
            $table->timestamp('messenger_last_inbound_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['messenger_psid']);
            $table->dropColumn(['messenger_psid', 'messenger_connected_at', 'messenger_last_inbound_at']);
        });
    }
};
