<?php

namespace App\Repositories;

use App\Contracts\Repositories\RentalItemRepositoryInterface;
use App\Contracts\Repositories\RentalRepositoryInterface;
use App\Enums\RentalMovementType;
use App\Enums\RentalStatus;
use App\Exceptions\InsufficientRentalStockException;
use App\Exceptions\InvalidRentalStateException;
use App\Models\RentalItem;
use App\Models\RentalTransaction;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class RentalRepository implements RentalRepositoryInterface
{
    public function __construct(
        private readonly RentalItemRepositoryInterface $rentalItemRepository,
    ) {}

    public function paginate(
        ?string $status = null,
        ?string $search = null,
        ?int $staffId = null,
        int $perPage = 15,
    ): LengthAwarePaginator {
        return RentalTransaction::query()
            ->with(['staff', 'renter', 'items'])
            ->when(
                filled($status),
                fn ($query) => $query->where('status', $status),
            )
            ->when(
                $staffId !== null,
                fn ($query) => $query->where('staff_id', $staffId),
            )
            ->when(
                filled($search),
                fn ($query) => $query->where(function ($query) use ($search): void {
                    $query->where('reference_number', 'like', "%{$search}%")
                        ->orWhere('renter_name', 'like', "%{$search}%")
                        ->orWhereHas('renter', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                }),
            )
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function stats(): array
    {
        $base = RentalTransaction::query();

        return [
            'active' => (clone $base)->where('status', RentalStatus::Active)->count(),
            'overdue' => (clone $base)
                ->whereIn('status', [RentalStatus::Active, RentalStatus::Overdue])
                ->whereNotNull('due_at')
                ->where('due_at', '<', now())
                ->count(),
            'returned' => (clone $base)->where('status', RentalStatus::Returned)->count(),
            'lost' => (clone $base)->where('status', RentalStatus::Lost)->count(),
            'reserved' => (clone $base)->where('status', RentalStatus::Reserved)->count(),
            'revenue' => (float) (clone $base)->sum('total_amount'),
        ];
    }

    public function find(int $id): RentalTransaction
    {
        return RentalTransaction::query()->findOrFail($id);
    }

    /**
     * @param  array<int, array{rental_item_id: int, quantity: int}>  $items
     * @param  array<string, mixed>  $meta
     */
    public function checkout(array $items, array $meta): RentalTransaction
    {
        return DB::transaction(function () use ($items, $meta): RentalTransaction {
            /** @var User $staff */
            $staff = $meta['staff'];
            $durationType = $meta['duration_type'] ?? 'daily';
            $durationHours = $meta['duration_hours'] ?? null;

            $rentalItemIds = array_column($items, 'rental_item_id');

            $rentalItems = RentalItem::query()
                ->whereIn('id', $rentalItemIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $lines = $this->buildLines($items, $rentalItems, $durationType, $durationHours, checkAvailability: true);
            $totalAmount = array_sum(array_map(fn ($line) => round($line['rate'] * $line['quantity'], 2), $lines));

            $transaction = RentalTransaction::query()->create([
                'staff_id' => $staff->id,
                'renter_id' => $meta['renter_id'] ?? null,
                'renter_name' => $meta['renter_name'] ?? null,
                'reference_number' => $this->generateReferenceNumber(),
                'rented_at' => now(),
                'due_at' => $meta['due_at'] ?? null,
                'duration_type' => $durationType,
                'duration_hours' => $durationHours,
                'deposit_amount' => $meta['deposit_amount'] ?? 0,
                'total_amount' => round($totalAmount, 2),
                'status' => RentalStatus::Active,
                'notes' => $meta['notes'] ?? null,
            ]);

            foreach ($lines as $line) {
                $transaction->items()->create([
                    'rental_item_id' => $line['rental_item']->id,
                    'rental_item_name' => $line['rental_item']->name,
                    'quantity' => $line['quantity'],
                    'rate' => $line['rate'],
                ]);

                $this->rentalItemRepository->adjustAvailability(
                    $line['rental_item'],
                    -$line['quantity'],
                    RentalMovementType::CheckOut,
                    $staff,
                    null,
                    $transaction,
                );
            }

            return $transaction->fresh(['items', 'staff', 'renter']);
        });
    }

    /**
     * Reserve equipment for a future date without touching current stock.
     * Availability is only checked/committed when the reservation is approved.
     *
     * @param  array<int, array{rental_item_id: int, quantity: int}>  $items
     * @param  array<string, mixed>  $meta
     */
    public function reserve(array $items, array $meta): RentalTransaction
    {
        return DB::transaction(function () use ($items, $meta): RentalTransaction {
            /** @var User $staff */
            $staff = $meta['staff'];
            $durationType = $meta['duration_type'] ?? 'daily';
            $durationHours = $meta['duration_hours'] ?? null;

            $rentalItems = RentalItem::query()
                ->whereIn('id', array_column($items, 'rental_item_id'))
                ->get()
                ->keyBy('id');

            $lines = $this->buildLines($items, $rentalItems, $durationType, $durationHours, checkAvailability: false);
            $totalAmount = array_sum(array_map(fn ($line) => round($line['rate'] * $line['quantity'], 2), $lines));

            $transaction = RentalTransaction::query()->create([
                'staff_id' => $staff->id,
                'renter_id' => $meta['renter_id'] ?? null,
                'renter_name' => $meta['renter_name'] ?? null,
                'reference_number' => $this->generateReferenceNumber(),
                'rented_at' => now(),
                'due_at' => null,
                'duration_type' => $durationType,
                'duration_hours' => $durationHours,
                'reserved_for' => $meta['reserved_for'],
                'deposit_amount' => $meta['deposit_amount'] ?? 0,
                'total_amount' => round($totalAmount, 2),
                'status' => RentalStatus::Reserved,
                'notes' => $meta['notes'] ?? null,
            ]);

            foreach ($lines as $line) {
                $transaction->items()->create([
                    'rental_item_id' => $line['rental_item']->id,
                    'rental_item_name' => $line['rental_item']->name,
                    'quantity' => $line['quantity'],
                    'rate' => $line['rate'],
                ]);
            }

            return $transaction->fresh(['items', 'staff', 'renter']);
        });
    }

    public function approveReservation(RentalTransaction $transaction, User $actor, ?CarbonInterface $dueAt = null): RentalTransaction
    {
        return DB::transaction(function () use ($transaction, $actor, $dueAt): RentalTransaction {
            /** @var RentalTransaction $locked */
            $locked = RentalTransaction::query()->whereKey($transaction->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== RentalStatus::Reserved) {
                throw new InvalidRentalStateException('Only reserved rentals can be approved.');
            }

            $locked->load('items');

            $rentalItems = RentalItem::query()
                ->whereIn('id', $locked->items->pluck('rental_item_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($locked->items as $item) {
                $rentalItem = $rentalItems->get($item->rental_item_id);

                if ($rentalItem === null || $rentalItem->available_quantity < $item->quantity) {
                    throw new InsufficientRentalStockException(
                        "Insufficient availability for \"{$item->rental_item_name}\" to approve this reservation."
                    );
                }
            }

            foreach ($locked->items as $item) {
                $this->rentalItemRepository->adjustAvailability(
                    $rentalItems->get($item->rental_item_id),
                    -$item->quantity,
                    RentalMovementType::CheckOut,
                    $actor,
                    "Reservation approved {$locked->reference_number}",
                    $locked,
                );
            }

            $locked->status = RentalStatus::Active;
            $locked->rented_at = now();
            $locked->due_at = $dueAt;
            $locked->save();

            return $locked->fresh(['items', 'staff', 'renter']);
        });
    }

    /**
     * @param  array<int, array{rental_item_id: int, quantity: int}>  $items
     * @param  \Illuminate\Support\Collection<int, RentalItem>  $rentalItems
     * @return array<int, array{rental_item: RentalItem, quantity: int, rate: float}>
     */
    private function buildLines(array $items, $rentalItems, string $durationType, ?int $durationHours, bool $checkAvailability): array
    {
        $lines = [];

        foreach ($items as $item) {
            $rentalItem = $rentalItems->get($item['rental_item_id']);

            if ($rentalItem === null) {
                throw new InsufficientRentalStockException("Rental item #{$item['rental_item_id']} could not be found.");
            }

            $quantity = (int) $item['quantity'];

            if ($checkAvailability && $rentalItem->available_quantity < $quantity) {
                throw new InsufficientRentalStockException("Insufficient availability for \"{$rentalItem->name}\" (available: {$rentalItem->available_quantity}, requested: {$quantity}).");
            }

            $lines[] = [
                'rental_item' => $rentalItem,
                'quantity' => $quantity,
                'rate' => $this->resolveRate($rentalItem, $durationType, $durationHours),
            ];
        }

        return $lines;
    }

    private function resolveRate(RentalItem $rentalItem, string $durationType, ?int $durationHours): float
    {
        if ($durationType === 'hourly') {
            $hourlyRate = (float) ($rentalItem->hourly_rate ?? $rentalItem->rate);

            return round($hourlyRate * max(1, $durationHours ?? 1), 2);
        }

        return (float) $rentalItem->rate;
    }

    /**
     * @param  array<int, array{rental_transaction_item_id: int, quantity_returned: int}>  $returnLines
     */
    public function returnItems(RentalTransaction $transaction, array $returnLines, User $actor): RentalTransaction
    {
        return DB::transaction(function () use ($transaction, $returnLines, $actor): RentalTransaction {
            /** @var RentalTransaction $locked */
            $locked = RentalTransaction::query()->whereKey($transaction->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== RentalStatus::Active && $locked->status !== RentalStatus::Overdue) {
                throw new InvalidRentalStateException('Only active or overdue rentals can be returned.');
            }

            $locked->load('items.rentalItem');

            foreach ($returnLines as $returnLine) {
                $item = $locked->items->firstWhere('id', $returnLine['rental_transaction_item_id']);

                if ($item === null) {
                    continue;
                }

                $quantity = min(
                    (int) $returnLine['quantity_returned'],
                    $item->quantity - $item->quantity_returned,
                );

                if ($quantity <= 0) {
                    continue;
                }

                $item->quantity_returned += $quantity;
                $item->save();

                $this->rentalItemRepository->adjustAvailability(
                    $item->rentalItem,
                    $quantity,
                    RentalMovementType::Return,
                    $actor,
                    "Return {$locked->reference_number}",
                    $locked,
                );
            }

            $locked->refresh();
            $locked->load('items');

            $fullyReturned = $locked->items->every(
                fn ($item) => $item->quantity_returned >= $item->quantity,
            );

            if ($fullyReturned) {
                $locked->status = RentalStatus::Returned;
                $locked->returned_at = now();
                $locked->save();
            }

            return $locked->fresh(['items', 'staff', 'renter']);
        });
    }

    public function revenueReport(CarbonInterface $start, CarbonInterface $end): array
    {
        $baseQuery = RentalTransaction::query()->whereBetween('rented_at', [$start, $end]);

        $totalRevenue = (float) (clone $baseQuery)->sum('total_amount');
        $totalRentalsCount = (clone $baseQuery)->count();
        $avgRental = $totalRentalsCount > 0 ? round($totalRevenue / $totalRentalsCount, 2) : 0.0;
        $activeRentals = RentalTransaction::query()->where('status', RentalStatus::Active)->count();

        $periodLengthInSeconds = $end->diffInSeconds($start);
        $previousEnd = (clone $start)->subSecond();
        $previousStart = (clone $previousEnd)->subSeconds($periodLengthInSeconds);
        $previousQuery = RentalTransaction::query()->whereBetween('rented_at', [$previousStart, $previousEnd]);
        $previousRevenue = (float) (clone $previousQuery)->sum('total_amount');
        $previousRentalsCount = (clone $previousQuery)->count();
        $previousAvgRental = $previousRentalsCount > 0 ? round($previousRevenue / $previousRentalsCount, 2) : 0.0;

        $revenueByDayRows = DB::table('rental_transactions')
            ->whereBetween('rented_at', [$start, $end])
            ->groupBy(DB::raw('DATE(rented_at)'))
            ->orderBy(DB::raw('DATE(rented_at)'))
            ->get([
                DB::raw('DATE(rented_at) as date'),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('COUNT(*) as rentals_count'),
            ]);

        $revenueByDay = $revenueByDayRows->map(fn ($row) => [
            'date' => (string) $row->date,
            'revenue' => (float) $row->revenue,
        ])->all();

        $rentalsByDay = $revenueByDayRows->map(fn ($row) => [
            'date' => (string) $row->date,
            'count' => (int) $row->rentals_count,
        ])->all();

        $equipmentRevenue = DB::table('rental_transaction_items')
            ->join('rental_transactions', 'rental_transactions.id', '=', 'rental_transaction_items.rental_transaction_id')
            ->whereBetween('rental_transactions.rented_at', [$start, $end])
            ->groupBy('rental_transaction_items.rental_item_id', 'rental_transaction_items.rental_item_name')
            ->orderByDesc(DB::raw('SUM(rental_transaction_items.quantity * rental_transaction_items.rate)'))
            ->limit(10)
            ->get([
                'rental_transaction_items.rental_item_id',
                'rental_transaction_items.rental_item_name',
                DB::raw('SUM(rental_transaction_items.quantity) as quantity_rented'),
                DB::raw('SUM(rental_transaction_items.quantity * rental_transaction_items.rate) as revenue'),
            ])
            ->map(fn ($row) => [
                'rental_item_id' => (int) $row->rental_item_id,
                'rental_item_name' => $row->rental_item_name,
                'quantity_rented' => (int) $row->quantity_rented,
                'revenue' => (float) $row->revenue,
            ])
            ->all();

        $heatmap = $this->rentalHeatmap($start, $end);

        $inventoryAlerts = RentalItem::query()
            ->whereColumn('available_quantity', '<=', DB::raw('total_quantity * 0.2'))
            ->orderBy('available_quantity')
            ->limit(10)
            ->get(['id', 'name', 'available_quantity', 'total_quantity'])
            ->map(fn (RentalItem $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'available_quantity' => $item->available_quantity,
                'total_quantity' => $item->total_quantity,
                'status' => $item->available_quantity <= 0 ? 'out' : 'low',
            ])
            ->all();

        $recentRentals = RentalTransaction::query()
            ->with('items')
            ->latest('rented_at')
            ->limit(8)
            ->get()
            ->map(fn (RentalTransaction $transaction) => [
                'id' => $transaction->id,
                'reference_number' => $transaction->reference_number,
                'renter_name' => $transaction->renter_name ?? $transaction->renter?->name ?? 'Walk-in',
                'item_summary' => $transaction->items->pluck('rental_item_name')->implode(', '),
                'total_amount' => (float) $transaction->total_amount,
                'rented_at' => $transaction->rented_at?->toIso8601String(),
                'status' => $transaction->status->value,
            ])
            ->all();

        return [
            'kpis' => [
                'revenue' => [
                    'value' => $totalRevenue,
                    'trend_pct' => $this->trendPercent($totalRevenue, $previousRevenue),
                ],
                'rentals_count' => [
                    'value' => $totalRentalsCount,
                    'trend_pct' => $this->trendPercent($totalRentalsCount, $previousRentalsCount),
                ],
                'avg_rental' => [
                    'value' => $avgRental,
                    'trend_pct' => $this->trendPercent($avgRental, $previousAvgRental),
                ],
                'active_rentals' => [
                    'value' => $activeRentals,
                ],
            ],
            'revenue_by_day' => $revenueByDay,
            'rentals_by_day' => $rentalsByDay,
            'equipment_revenue' => $equipmentRevenue,
            'heatmap' => $heatmap,
            'inventory_alerts' => $inventoryAlerts,
            'recent_rentals' => $recentRentals,
        ];
    }

    private function trendPercent(float|int $current, float|int $previous): ?float
    {
        if ($previous == 0) {
            return $current > 0 ? 100.0 : null;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    /**
     * @return array<int, array{day_of_week: int, hour: int, count: int}>
     */
    private function rentalHeatmap(CarbonInterface $start, CarbonInterface $end): array
    {
        $counts = [];

        RentalTransaction::query()
            ->whereBetween('rented_at', [$start, $end])
            ->get(['rented_at'])
            ->each(function (RentalTransaction $transaction) use (&$counts): void {
                if ($transaction->rented_at === null) {
                    return;
                }

                $key = $transaction->rented_at->dayOfWeek.'-'.$transaction->rented_at->hour;
                $counts[$key] = ($counts[$key] ?? 0) + 1;
            });

        $result = [];

        foreach ($counts as $key => $count) {
            [$dayOfWeek, $hour] = array_map('intval', explode('-', $key));
            $result[] = [
                'day_of_week' => $dayOfWeek,
                'hour' => $hour,
                'count' => $count,
            ];
        }

        return $result;
    }

    private function generateReferenceNumber(): string
    {
        $prefix = 'RENT-'.now()->format('Ymd');

        $sequence = RentalTransaction::query()
            ->where('reference_number', 'like', $prefix.'%')
            ->count() + 1;

        do {
            $candidate = sprintf('%s-%04d', $prefix, $sequence);
            $sequence++;
        } while (RentalTransaction::query()->where('reference_number', $candidate)->exists());

        return $candidate;
    }
}
