<?php

namespace Database\Seeders;

use App\Enums\RentalItemStatus;
use App\Enums\RentalMovementType;
use App\Enums\RentalStatus;
use App\Models\Club;
use App\Models\Player;
use App\Models\RentalItem;
use App\Models\RentalStockMovement;
use App\Models\RentalTransaction;
use App\Models\RentalTransactionItem;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RentalItemSeeder extends Seeder
{
    public function run(): void
    {
        $club = Club::where('slug', 'galaang-ramos-pickleball')->first() ?? Club::first();

        if (! $club) {
            return;
        }

        $rentalItems = [
            ['name' => 'Pickleball Paddle - Rental', 'sku' => 'RNT-PADL-STD', 'category' => 'equipment', 'rate' => 100, 'deposit' => 500, 'total_quantity' => 12],
            ['name' => 'Pickleball Paddle - Pro Rental', 'sku' => 'RNT-PADL-PRO', 'category' => 'equipment', 'rate' => 180, 'deposit' => 1000, 'total_quantity' => 6],
            ['name' => 'Pickleball Balls (Set of 3)', 'sku' => 'RNT-BALL-3PK', 'category' => 'equipment', 'rate' => 50, 'deposit' => 100, 'total_quantity' => 20],
            ['name' => 'Court Shoes', 'sku' => 'RNT-SHOE-01', 'category' => 'apparel', 'rate' => 120, 'deposit' => 300, 'total_quantity' => 10],
        ];

        $isFreshSeed = ! RentalItem::where('club_id', $club->id)->exists();
        $seededRentalItems = collect();

        foreach ($rentalItems as $item) {
            $model = RentalItem::query()->updateOrCreate(
                ['club_id' => $club->id, 'sku' => $item['sku']],
                [
                    'name' => $item['name'],
                    'category' => $item['category'],
                    'rate' => $item['rate'],
                    'deposit' => $item['deposit'],
                    'total_quantity' => $item['total_quantity'],
                    'available_quantity' => $item['total_quantity'],
                    'status' => RentalItemStatus::Active,
                ]
            );

            $seededRentalItems->push($model);

            if ($isFreshSeed) {
                RentalStockMovement::query()->create([
                    'rental_item_id' => $model->id,
                    'user_id' => null,
                    'type' => RentalMovementType::Restock,
                    'quantity_change' => $item['total_quantity'],
                    'quantity_after' => $item['total_quantity'],
                    'reason' => 'Initial stock intake',
                ]);
            }
        }

        if (! $isFreshSeed || RentalTransaction::where('club_id', $club->id)->exists()) {
            return;
        }

        $staff = User::where('email', 'owner@galaangramos.test')->first() ?? User::first();
        $members = Player::where('club_id', $club->id)->get();

        if (! $staff || $members->isEmpty()) {
            return;
        }

        foreach (range(1, 3) as $index) {
            $daysAgo = 3 - $index;
            $isReturned = $index === 1;
            $lineItems = $seededRentalItems->random(min(2, fake()->numberBetween(1, 2)));
            $totalAmount = 0;
            $cart = [];

            foreach ($lineItems as $item) {
                $quantity = fake()->numberBetween(1, 2);
                $totalAmount += round($item->rate * $quantity, 2);
                $cart[] = ['item' => $item, 'quantity' => $quantity];
            }

            $renter = $members->random();

            $transaction = RentalTransaction::query()->create([
                'club_id' => $club->id,
                'staff_id' => $staff->id,
                'renter_id' => $renter->user_id,
                'reference_number' => 'RENT-'.now()->subDays($daysAgo)->format('Ymd').'-'.Str::upper(Str::random(4)),
                'rented_at' => now()->subDays($daysAgo),
                'due_at' => now()->subDays($daysAgo)->addDay(),
                'returned_at' => $isReturned ? now()->subDays($daysAgo)->addHours(6) : null,
                'deposit_amount' => 200,
                'total_amount' => $totalAmount,
                'status' => $isReturned ? RentalStatus::Returned : RentalStatus::Active,
                'notes' => null,
                'created_at' => now()->subDays($daysAgo),
                'updated_at' => now()->subDays($daysAgo),
            ]);

            foreach ($cart as $line) {
                RentalTransactionItem::query()->create([
                    'rental_transaction_id' => $transaction->id,
                    'rental_item_id' => $line['item']->id,
                    'rental_item_name' => $line['item']->name,
                    'quantity' => $line['quantity'],
                    'rate' => $line['item']->rate,
                    'quantity_returned' => $isReturned ? $line['quantity'] : 0,
                ]);

                RentalStockMovement::query()->create([
                    'rental_item_id' => $line['item']->id,
                    'user_id' => $staff->id,
                    'type' => RentalMovementType::CheckOut,
                    'quantity_change' => -$line['quantity'],
                    'quantity_after' => max(0, $line['item']->available_quantity - $line['quantity']),
                    'reason' => "Rental {$transaction->reference_number}",
                ]);

                if ($isReturned) {
                    RentalStockMovement::query()->create([
                        'rental_item_id' => $line['item']->id,
                        'user_id' => $staff->id,
                        'type' => RentalMovementType::Return,
                        'quantity_change' => $line['quantity'],
                        'quantity_after' => $line['item']->available_quantity,
                        'reason' => "Return {$transaction->reference_number}",
                    ]);
                } else {
                    $line['item']->decrement('available_quantity', $line['quantity']);
                }
            }
        }
    }
}
