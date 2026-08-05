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
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class RentalRepository implements RentalRepositoryInterface
{
    public function __construct(
        private readonly RentalItemRepositoryInterface $rentalItemRepository,
    ) {}

    public function paginate(?int $clubId = null, ?string $status = null, int $perPage = 15): LengthAwarePaginator
    {
        return RentalTransaction::query()
            ->with(['staff', 'renter', 'items'])
            ->when(
                $clubId !== null,
                fn ($query) => $query->where('club_id', $clubId),
            )
            ->when(
                filled($status),
                fn ($query) => $query->where('status', $status),
            )
            ->latest()
            ->paginate($perPage);
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

            $rentalItemIds = array_column($items, 'rental_item_id');

            $rentalItems = RentalItem::query()
                ->whereIn('id', $rentalItemIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $totalAmount = 0;
            $lines = [];

            foreach ($items as $item) {
                $rentalItem = $rentalItems->get($item['rental_item_id']);

                if ($rentalItem === null) {
                    throw new InsufficientRentalStockException("Rental item #{$item['rental_item_id']} could not be found.");
                }

                $quantity = (int) $item['quantity'];

                if ($rentalItem->available_quantity < $quantity) {
                    throw new InsufficientRentalStockException("Insufficient availability for \"{$rentalItem->name}\" (available: {$rentalItem->available_quantity}, requested: {$quantity}).");
                }

                $rate = (float) $rentalItem->rate;
                $totalAmount += round($rate * $quantity, 2);

                $lines[] = [
                    'rental_item' => $rentalItem,
                    'quantity' => $quantity,
                    'rate' => $rate,
                ];
            }

            $transaction = RentalTransaction::query()->create([
                'club_id' => $meta['club_id'],
                'staff_id' => $staff->id,
                'renter_id' => $meta['renter_id'] ?? null,
                'renter_name' => $meta['renter_name'] ?? null,
                'reference_number' => $this->generateReferenceNumber(),
                'rented_at' => now(),
                'due_at' => $meta['due_at'] ?? null,
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
