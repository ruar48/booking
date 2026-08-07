<?php

namespace App\Contracts\Repositories;

use App\Models\RentalTransaction;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface RentalRepositoryInterface
{
    public function paginate(
        ?string $status = null,
        ?string $search = null,
        ?int $staffId = null,
        int $perPage = 15,
    ): LengthAwarePaginator;

    /**
     * @return array{active: int, overdue: int, returned: int, lost: int, reserved: int, revenue: float}
     */
    public function stats(): array;

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

    /**
     * @return array{total_revenue: float, total_rentals_count: int, revenue_by_day: array<int, array{date: string, revenue: float}>, top_items: array<int, array{rental_item_id: int, rental_item_name: string, quantity_rented: int, revenue: float}>}
     */
    public function revenueReport(CarbonInterface $start, CarbonInterface $end): array;
}
