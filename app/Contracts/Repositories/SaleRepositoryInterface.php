<?php

namespace App\Contracts\Repositories;

use App\Models\Sale;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

interface SaleRepositoryInterface
{
    public function paginate(?string $status = null, int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): Sale;

    /**
     * @param  array<int, array{product_id: int, quantity: int}>  $cartItems
     * @param  array<string, mixed>  $meta
     */
    public function checkout(array $cartItems, array $meta): Sale;

    public function void(Sale $sale, User $actor): Sale;

    /**
     * @return array<string, mixed>
     */
    public function salesReport(Carbon $start, Carbon $end): array;
}
