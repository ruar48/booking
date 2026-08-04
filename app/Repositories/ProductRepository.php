<?php

namespace App\Repositories;

use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Enums\StockMovementType;
use App\Exceptions\InsufficientStockException;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ProductRepository implements ProductRepositoryInterface
{
    public function paginate(?int $clubId = null, ?string $search = null, bool $lowStockOnly = false, int $perPage = 15): LengthAwarePaginator
    {
        return Product::query()
            ->with('club')
            ->when(
                $clubId !== null,
                fn ($query) => $query->where('club_id', $clubId),
            )
            ->when(
                filled($search),
                fn ($query) => $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                }),
            )
            ->when(
                $lowStockOnly,
                fn ($query) => $query->whereColumn('stock_quantity', '<=', 'low_stock_threshold'),
            )
            ->latest()
            ->paginate($perPage);
    }

    public function find(int $id): Product
    {
        return Product::query()->findOrFail($id);
    }

    public function create(array $data): Product
    {
        return Product::query()->create($data);
    }

    public function update(Product $product, array $data): Product
    {
        $product->update($data);

        return $product->fresh();
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }

    public function adjustStock(
        Product $product,
        int $delta,
        StockMovementType $type,
        ?User $user = null,
        ?string $reason = null,
        ?Model $reference = null,
    ): Product {
        return DB::transaction(function () use ($product, $delta, $type, $user, $reason, $reference): Product {
            /** @var Product $locked */
            $locked = Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();

            $newQuantity = $locked->stock_quantity + $delta;

            if ($newQuantity < 0) {
                throw new InsufficientStockException;
            }

            $locked->stock_quantity = $newQuantity;
            $locked->save();

            $movement = new StockMovement([
                'product_id' => $locked->id,
                'user_id' => $user?->id,
                'type' => $type,
                'quantity_change' => $delta,
                'quantity_after' => $newQuantity,
                'reason' => $reason,
            ]);

            if ($reference !== null) {
                $movement->reference()->associate($reference);
            }

            $movement->save();

            return $locked->fresh();
        });
    }
}
