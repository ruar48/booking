<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Page views from visitors who haven't allowed analytics are still counted,
 * but anonymously: no visitor hash and no account (see RecordPageView).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('page_views', function (Blueprint $table) {
            $table->char('visitor_hash', 64)->nullable()->change();
        });
    }

    public function down(): void
    {
        // Anonymous rows can't be given a hash after the fact; drop them so the
        // column can be made required again.
        DB::table('page_views')->whereNull('visitor_hash')->delete();

        Schema::table('page_views', function (Blueprint $table) {
            $table->char('visitor_hash', 64)->nullable(false)->change();
        });
    }
};
