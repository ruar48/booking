<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per person who has a Messenger chat with the Page, whether
        // or not they have an account here. A linked conversation (user_id
        // set) is how notifications find someone's Messenger.
        Schema::create('messenger_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('psid')->unique();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->timestamp('linked_at')->nullable();
            $table->string('name')->nullable();
            $table->text('avatar_url')->nullable();
            $table->string('last_message_preview')->nullable();
            $table->timestamp('last_message_at')->nullable()->index();
            // Meta allows ordinary messages for 24 hours after this.
            $table->timestamp('last_inbound_at')->nullable();
            $table->unsignedInteger('unread_count')->default(0);
            $table->timestamps();
        });

        Schema::create('messenger_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('messenger_conversations')->cascadeOnDelete();
            $table->string('direction', 16);
            $table->string('source', 24);
            $table->string('status', 16);
            // Meta's message id. Null until Meta accepts an outgoing message.
            $table->string('mid')->nullable()->unique();
            $table->text('text')->nullable();
            $table->json('attachments')->nullable();
            $table->foreignId('sent_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('error')->nullable();
            // Meta's clock once known (from the echo), ours until then — read
            // receipts are watermarks on Meta's clock.
            $table->timestamp('sent_at');
            $table->timestamps();

            $table->index(['conversation_id', 'sent_at']);
        });

        // The link and the 24-hour window now live on the conversation. Carry
        // over anyone who already linked before dropping the user columns.
        DB::table('users')->whereNotNull('messenger_psid')->orderBy('id')->each(function (object $user) {
            DB::table('messenger_conversations')->insert([
                'psid' => $user->messenger_psid,
                'user_id' => $user->id,
                'linked_at' => $user->messenger_connected_at,
                'name' => $user->name,
                'last_inbound_at' => $user->messenger_last_inbound_at,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['messenger_psid']);
            $table->dropColumn(['messenger_psid', 'messenger_connected_at', 'messenger_last_inbound_at']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('messenger_psid')->nullable()->unique();
            $table->timestamp('messenger_connected_at')->nullable();
            $table->timestamp('messenger_last_inbound_at')->nullable();
        });

        Schema::dropIfExists('messenger_messages');
        Schema::dropIfExists('messenger_conversations');
    }
};
