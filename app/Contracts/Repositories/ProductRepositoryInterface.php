<?php

namespace App\Contracts\Repositories;

use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

interface ProductRepositoryInterface
{
    public function paginate(?string $search = null, bool $lowStockOnly = false, int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): Product;

    public function create(array $data): Product;

    public function update(Product $product, array $data): Product;

    public function delete(Product $product): void;

    public function adjustStock(
        Product $product,
        int $delta,
        StockMovementType $type,
        ?User $user = null,
        ?string $reason = null,
        ?Model $reference = null,
    ): Product;
}
