<?php

namespace App\Repositories;

use App\Contracts\Repositories\CourtBookingRepositoryInterface;
use App\Contracts\Repositories\CourtRepositoryInterface;
use App\Enums\CourtStatus;
use App\Models\Court;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class CourtRepository implements CourtRepositoryInterface
{
    public function __construct(
        private readonly CourtBookingRepositoryInterface $courtBookingRepository,
    ) {}

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Court::query()
            ->with('club')
            ->latest()
            ->paginate($perPage);
    }

    public function find(int $id): ?Court
    {
        return Court::query()->find($id);
    }

    public function create(array $data): Court
    {
        return Court::query()->create($data);
    }

    public function update(Court $court, array $data): Court
    {
        $court->update($data);

        return $court->fresh();
    }

    public function delete(Court $court): bool
    {
        return (bool) $court->delete();
    }

    public function getAvailableForSlot(
        int $courtId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeBookingId = null,
    ): bool {
        $court = $this->find($courtId);

        if ($court === null || $court->status !== CourtStatus::Available) {
            return false;
        }

        return $this->courtBookingRepository
            ->getConflicts($courtId, $startsAt, $endsAt, $excludeBookingId)
            ->isEmpty();
    }
}
