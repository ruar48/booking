<?php

namespace Database\Seeders;

use App\Enums\ProductStatus;
use App\Models\Club;
use App\Models\Product;
use Illuminate\Database\Seeder;

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
            ['name' => 'Pickleball Paddle - Standard', 'sku' => 'EQP-PADL-STD', 'category' => 'equipment', 'price' => 1500, 'cost' => 950, 'stock_quantity' => 15],
            ['name' => 'Pickleball Paddle - Pro', 'sku' => 'EQP-PADL-PRO', 'category' => 'equipment', 'price' => 3200, 'cost' => 2100, 'stock_quantity' => 8],
            ['name' => 'Pickleball Balls (Pack of 3)', 'sku' => 'EQP-BALL-3PK', 'category' => 'equipment', 'price' => 350, 'cost' => 200, 'stock_quantity' => 40],
            ['name' => 'Grip Tape', 'sku' => 'EQP-GRIP-01', 'category' => 'accessories', 'price' => 150, 'cost' => 80, 'stock_quantity' => 30],
            ['name' => 'Sports Towel', 'sku' => 'ACC-TOWEL-01', 'category' => 'accessories', 'price' => 180, 'cost' => 100, 'stock_quantity' => 25],
            ['name' => 'Club T-Shirt', 'sku' => 'APR-TSHIRT-01', 'category' => 'apparel', 'price' => 450, 'cost' => 250, 'stock_quantity' => 20],
            ['name' => 'Club Cap', 'sku' => 'APR-CAP-01', 'category' => 'apparel', 'price' => 350, 'cost' => 200, 'stock_quantity' => 20],
        ];

        foreach ($products as $product) {
            Product::query()->updateOrCreate(
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
        }
    }
}
