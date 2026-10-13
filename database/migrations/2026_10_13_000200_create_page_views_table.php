<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // sha256(app key + IP + user agent + date): counts unique visitors
            // per day without storing the IP or setting a tracking cookie.
            $table->char('visitor_hash', 64);
            $table->string('path', 255);
            $table->string('route_name', 120)->nullable();
            $table->string('device', 16);
            $table->string('referrer_host', 120)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('created_at');
            $table->index(['route_name', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_views');
    }
};
