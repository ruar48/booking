<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('sku')->unique();
            $table->string('category')->nullable();
            $table->decimal('rate', 10, 2);
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->decimal('deposit', 10, 2)->nullable();
            $table->integer('total_quantity')->default(0);
            $table->integer('available_quantity')->default(0);
            $table->string('status')->default('active');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('rental_transactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('renter_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('renter_name')->nullable();
            $table->string('reference_number')->unique();
            $table->timestamp('rented_at');
            $table->timestamp('due_at')->nullable();
            $table->string('duration_type')->default('daily');
            $table->unsignedInteger('duration_hours')->nullable();
            $table->date('reserved_for')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->decimal('deposit_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->string('status')->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('rental_transaction_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('rental_transaction_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rental_item_id')->constrained()->restrictOnDelete();
            $table->string('rental_item_name');
            $table->integer('quantity');
            $table->decimal('rate', 10, 2);
            $table->integer('quantity_returned')->default(0);
            $table->timestamps();
        });

        Schema::create('rental_stock_movements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('rental_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type');
            $table->integer('quantity_change');
            $table->integer('quantity_after');
            $table->string('reason')->nullable();
            $table->nullableMorphs('reference');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_stock_movements');
        Schema::dropIfExists('rental_transaction_items');
        Schema::dropIfExists('rental_transactions');
        Schema::dropIfExists('rental_items');
    }
};
