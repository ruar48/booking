<?php

namespace Database\Seeders;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Enums\SaleStatus;
use App\Enums\StockMovementType;
use App\Models\Club;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $club = Club::where('slug', 'galaang-ramos-pickleball')->first() ?? Club::first();

        if (! $club) {
            return;
        }

        $products = [
            ['name' => 'Bottled Water 500ml', 'sku' => 'DRK-WATER-500', 'category' => 'drinks', 'price' => 20, 'cost' => 10, 'stock_quantity' => 100],
            ['name' => 'Gatorade 500ml', 'sku' => 'DRK-GATOR-500', 'category' => 'drinks', 'price' => 45, 'cost' => 30, 'stock_quantity' => 60],
            ['name' => 'Coke 330ml', 'sku' => 'DRK-COKE-330', 'category' => 'drinks', 'price' => 35, 'cost' => 20, 'stock_quantity' => 80],
            ['name' => 'Energy Bar', 'sku' => 'SNK-ENBAR-01', 'category' => 'snacks', 'price' => 55, 'cost' => 35, 'stock_quantity' => 50],
            ['name' => 'Potato Chips', 'sku' => 'SNK-CHIPS-01', 'category' => 'snacks', 'price' => 40, 'cost' => 25, 'stock_quantity' => 70],
            ['name' => 'Trail Mix Pack', 'sku' => 'SNK-TRAIL-01', 'category' => 'snacks', 'price' => 45, 'cost' => 28, 'stock_quantity' => 55],
            ['name' => 'Pickleball Paddle - Standard', 'sku' => 'EQP-PADL-STD', 'category' => 'equipment', 'price' => 1500, 'cost' => 950, 'stock_quantity' => 15],
            ['name' => 'Pickleball Paddle - Pro', 'sku' => 'EQP-PADL-PRO', 'category' => 'equipment', 'price' => 3200, 'cost' => 2100, 'stock_quantity' => 8],
            ['name' => 'Pickleball Balls (Pack of 3)', 'sku' => 'EQP-BALL-3PK', 'category' => 'equipment', 'price' => 350, 'cost' => 200, 'stock_quantity' => 40],
            ['name' => 'Billiard Chalk (Pack of 2)', 'sku' => 'EQP-CHALK-2PK', 'category' => 'equipment', 'price' => 120, 'cost' => 60, 'stock_quantity' => 35],
            ['name' => 'Grip Tape', 'sku' => 'EQP-GRIP-01', 'category' => 'accessories', 'price' => 150, 'cost' => 80, 'stock_quantity' => 30],
            ['name' => 'Sports Towel', 'sku' => 'ACC-TOWEL-01', 'category' => 'accessories', 'price' => 180, 'cost' => 100, 'stock_quantity' => 25],
            ['name' => 'Paddle Cover', 'sku' => 'ACC-COVER-01', 'category' => 'accessories', 'price' => 220, 'cost' => 120, 'stock_quantity' => 18],
            ['name' => 'Club T-Shirt', 'sku' => 'APR-TSHIRT-01', 'category' => 'apparel', 'price' => 450, 'cost' => 250, 'stock_quantity' => 20],
            ['name' => 'Club Cap', 'sku' => 'APR-CAP-01', 'category' => 'apparel', 'price' => 350, 'cost' => 200, 'stock_quantity' => 20],
        ];

        $isFreshSeed = ! Product::where('club_id', $club->id)->exists();
        $seededProducts = collect();

        foreach ($products as $product) {
            $model = Product::query()->updateOrCreate(
                ['club_id' => $club->id, 'sku' => $product['sku']],
                [
                    'name' => $product['name'],
                    'category' => $product['category'],
                    'price' => $product['price'],
                    'cost' => $product['cost'],
                    'stock_quantity' => $product['stock_quantity'],
                    'low_stock_threshold' => 5,
                    'status' => ProductStatus::Active,
                ]
            );

            $seededProducts->push($model);

            if ($isFreshSeed) {
                StockMovement::query()->create([
                    'product_id' => $model->id,
                    'user_id' => null,
                    'type' => StockMovementType::Restock,
                    'quantity_change' => $product['stock_quantity'],
                    'quantity_after' => $product['stock_quantity'],
                    'reason' => 'Initial stock intake',
                ]);
            }
        }

        if (! $isFreshSeed || Sale::where('club_id', $club->id)->exists()) {
            return;
        }

        $cashier = User::where('email', 'owner@galaangramos.test')->first() ?? User::first();
        $members = Player::where('club_id', $club->id)->get();

        if (! $cashier || $members->isEmpty()) {
            return;
        }

        foreach (range(1, 10) as $index) {
            $daysAgo = 10 - $index;
            $isVoided = $index === 10;
            $lineItems = $seededProducts->random(min(3, fake()->numberBetween(1, 3)));
            $subtotal = 0;
            $cart = [];

            foreach ($lineItems as $product) {
                $quantity = fake()->numberBetween(1, 3);
                $lineTotal = round($product->price * $quantity, 2);
                $subtotal += $lineTotal;
                $cart[] = ['product' => $product, 'quantity' => $quantity, 'lineTotal' => $lineTotal];
            }

            $customer = fake()->boolean(60) ? $members->random() : null;
            $tax = round($subtotal * 0.12, 2);

            $sale = Sale::query()->create([
                'club_id' => $club->id,
                'cashier_id' => $cashier->id,
                'customer_id' => $customer?->user_id,
                'invoice_number' => 'SALE-'.now()->subDays($daysAgo)->format('Ymd').'-'.Str::upper(Str::random(4)),
                'subtotal' => $subtotal,
                'discount' => 0,
                'tax' => $tax,
                'total' => round($subtotal + $tax, 2),
                'status' => $isVoided ? SaleStatus::Voided : SaleStatus::Completed,
                'notes' => null,
                'created_at' => now()->subDays($daysAgo),
                'updated_at' => now()->subDays($daysAgo),
            ]);

            foreach ($cart as $item) {
                SaleItem::query()->create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product']->id,
                    'product_name' => $item['product']->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['product']->price,
                    'line_total' => $item['lineTotal'],
                ]);

                if (! $isVoided) {
                    StockMovement::query()->create([
                        'product_id' => $item['product']->id,
                        'user_id' => $cashier->id,
                        'type' => StockMovementType::Sale,
                        'quantity_change' => -$item['quantity'],
                        'quantity_after' => max(0, $item['product']->stock_quantity - $item['quantity']),
                        'reason' => "Sale {$sale->invoice_number}",
                    ]);
                }
            }

            Payment::query()->create([
                'user_id' => $customer?->user_id ?? $cashier->id,
                'payable_type' => Sale::class,
                'payable_id' => $sale->id,
                'invoice_number' => 'INV-'.Str::upper(Str::random(10)),
                'amount' => $sale->total,
                'currency' => 'PHP',
                'status' => $isVoided ? PaymentStatus::Refunded : PaymentStatus::Paid,
                'payment_method' => fake()->randomElement(PaymentMethod::cases())->value,
                'paid_at' => $isVoided ? null : now()->subDays($daysAgo),
                'created_at' => now()->subDays($daysAgo),
                'updated_at' => now()->subDays($daysAgo),
            ]);
        }
    }
}
