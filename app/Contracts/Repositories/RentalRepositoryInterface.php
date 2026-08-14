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
<<<<<<< HEAD
=======
<<<<<<< Updated upstream
     * @return array{total_revenue: float, total_rentals_count: int, revenue_by_day: array<int, array{date: string, revenue: float}>, top_items: array<int, array{rental_item_id: int, rental_item_name: string, quantity_rented: int, revenue: float}>}
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
     * @return array{
     *     kpis: array{
     *         revenue: array{value: float, trend_pct: float|null},
     *         rentals_count: array{value: int, trend_pct: float|null},
     *         avg_rental: array{value: float, trend_pct: float|null},
     *         active_rentals: array{value: int},
     *     },
     *     revenue_by_day: array<int, array{date: string, revenue: float}>,
     *     rentals_by_day: array<int, array{date: string, count: int}>,
     *     equipment_revenue: array<int, array{rental_item_id: int, rental_item_name: string, quantity_rented: int, revenue: float}>,
     *     heatmap: array<int, array{day_of_week: int, hour: int, count: int}>,
     *     inventory_alerts: array<int, array{id: int, name: string, available_quantity: int, total_quantity: int, status: string}>,
     *     recent_rentals: array<int, array{id: int, reference_number: string, renter_name: string, item_summary: string, total_amount: float, rented_at: string|null, status: string}>,
     * }
<<<<<<< HEAD
=======
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
     */
    public function revenueReport(CarbonInterface $start, CarbonInterface $end): array;
}
