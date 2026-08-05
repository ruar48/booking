<?php

namespace App\Repositories;

use App\Contracts\Repositories\RentalItemRepositoryInterface;
use App\Enums\RentalMovementType;
use App\Exceptions\InsufficientRentalStockException;
use App\Models\RentalItem;
use App\Models\RentalStockMovement;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class RentalItemRepository implements RentalItemRepositoryInterface
{
    public function paginate(?int $clubId = null, ?string $search = null, bool $lowStockOnly = false, int $perPage = 15): LengthAwarePaginator
    {
        return RentalItem::query()
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
                fn ($query) => $query->where('available_quantity', '<=', 0),
            )
            ->latest()
            ->paginate($perPage);
    }

    public function find(int $id): RentalItem
    {
        return RentalItem::query()->findOrFail($id);
    }

    public function create(array $data): RentalItem
    {
        $data['available_quantity'] = $data['total_quantity'] ?? 0;

        return RentalItem::query()->create($data);
    }

    public function update(RentalItem $rentalItem, array $data): RentalItem
    {
        if (array_key_exists('total_quantity', $data)) {
            $delta = (int) $data['total_quantity'] - $rentalItem->total_quantity;
            $data['available_quantity'] = max(0, $rentalItem->available_quantity + $delta);
        }

        $rentalItem->update($data);

        return $rentalItem->fresh();
    }

    public function delete(RentalItem $rentalItem): void
    {
        $rentalItem->delete();
    }

    public function adjustAvailability(
        RentalItem $rentalItem,
        int $delta,
        RentalMovementType $type,
        ?User $user = null,
        ?string $reason = null,
        ?Model $reference = null,
    ): RentalItem {
        return DB::transaction(function () use ($rentalItem, $delta, $type, $user, $reason, $reference): RentalItem {
            /** @var RentalItem $locked */
            $locked = RentalItem::query()->whereKey($rentalItem->id)->lockForUpdate()->firstOrFail();

            $newQuantity = $locked->available_quantity + $delta;

            if ($newQuantity < 0) {
                throw new InsufficientRentalStockException;
            }

            $locked->available_quantity = $newQuantity;
            $locked->save();

            $movement = new RentalStockMovement([
                'rental_item_id' => $locked->id,
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
