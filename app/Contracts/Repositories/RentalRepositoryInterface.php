<?php

namespace App\Contracts\Repositories;

use App\Models\RentalTransaction;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface RentalRepositoryInterface
{
    public function paginate(?int $clubId = null, ?string $status = null, int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): RentalTransaction;

    /**
     * @param  array<int, array{rental_item_id: int, quantity: int}>  $items
     * @param  array<string, mixed>  $meta
     */
    public function checkout(array $items, array $meta): RentalTransaction;

    /**
     * @param  array<int, array{rental_transaction_item_id: int, quantity_returned: int}>  $returnLines
     */
    public function returnItems(RentalTransaction $transaction, array $returnLines, User $actor): RentalTransaction;
}
