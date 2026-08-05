<?php

namespace App\Contracts\Repositories;

use App\Enums\RentalMovementType;
use App\Models\RentalItem;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

interface RentalItemRepositoryInterface
{
    public function paginate(?int $clubId = null, ?string $search = null, bool $lowStockOnly = false, int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): RentalItem;

    public function create(array $data): RentalItem;

    public function update(RentalItem $rentalItem, array $data): RentalItem;

    public function delete(RentalItem $rentalItem): void;

    public function adjustAvailability(
        RentalItem $rentalItem,
        int $delta,
        RentalMovementType $type,
        ?User $user = null,
        ?string $reason = null,
        ?Model $reference = null,
    ): RentalItem;
}
