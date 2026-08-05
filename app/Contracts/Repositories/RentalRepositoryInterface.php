<?php

namespace App\Contracts\Repositories;

use App\Models\RentalTransaction;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface RentalRepositoryInterface
{
    public function paginate(
        ?int $clubId = null,
        ?string $status = null,
        ?string $search = null,
        ?int $staffId = null,
        int $perPage = 15,
    ): LengthAwarePaginator;

    /**
     * @return array{active: int, overdue: int, returned: int, lost: int, reserved: int, revenue: float}
     */
    public function stats(?int $clubId = null): array;

    public function find(int $id): RentalTransaction;

    /**
     * @param  array<int, array{rental_item_id: int, quantity: int}>  $items
     * @param  array<string, mixed>  $meta
     */
    public function checkout(array $items, array $meta): RentalTransaction;

    /**
     * Reserve equipment for a future date without touching current stock.
     *
     * @param  array<int, array{rental_item_id: int, quantity: int}>  $items
     * @param  array<string, mixed>  $meta
     */
    public function reserve(array $items, array $meta): RentalTransaction;

    public function approveReservation(RentalTransaction $transaction, User $actor, ?CarbonInterface $dueAt = null): RentalTransaction;

    /**
     * @param  array<int, array{rental_transaction_item_id: int, quantity_returned: int}>  $returnLines
     */
    public function returnItems(RentalTransaction $transaction, array $returnLines, User $actor): RentalTransaction;
}
