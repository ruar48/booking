<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\RentalStatus;
use App\Enums\SaleStatus;
use App\Models\OpenPlayRegistration;
use App\Models\RentalTransaction;
use App\Models\ResourceBooking;
use App\Models\Sale;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Sales across every income source, bucketed per day, week and month for the
 * dashboard.
 *
 * What counts, matching the per-module reports:
 *  - bookings:  paid,                  dated by when the court is played
 *  - pos:       completed sales,       dated by when sold
 *  - rentals:   rented out (not a pending reservation), dated by rented_at
 *  - open_play: paid registration fees, dated by sign-up
 *
 * Bucketing happens in PHP rather than SQL so it behaves the same on SQLite
 * (tests, local) and MySQL (production); the windows are small.
 */
class RevenueReportService
{
    public const SOURCES = ['bookings', 'pos', 'rentals', 'open_play'];

    /** How many buckets each view shows, ending with the current one. */
    private const WINDOWS = ['day' => 14, 'week' => 12, 'month' => 12];

    /**
     * @return array<string, array{
     *     buckets: list<array<string, mixed>>,
     *     current: array<string, float>,
     *     previous_total: float,
     * }>
     */
    public function summary(?CarbonInterface $now = null): array
    {
        $now = CarbonImmutable::instance($now ?? now());

        return collect(self::WINDOWS)
            ->map(fn (int $count, string $granularity) => $this->series($granularity, $count, $now))
            ->all();
    }

    /**
     * @return array{buckets: list<array<string, mixed>>, current: array<string, float>, previous_total: float}
     */
    private function series(string $granularity, int $count, CarbonImmutable $now): array
    {
        $currentStart = $this->bucketStart($granularity, $now);
        $from = $this->shift($granularity, $currentStart, -($count - 1));
        $to = $this->shift($granularity, $currentStart, 1)->subSecond();

        $buckets = [];

        for ($i = 0; $i < $count; $i++) {
            $start = $this->shift($granularity, $from, $i);
            $buckets[$start->toDateString()] = [
                'key' => $start->toDateString(),
                'label' => $this->label($granularity, $start),
                ...array_fill_keys(self::SOURCES, 0.0),
                'total' => 0.0,
            ];
        }

        foreach ($this->entries($from, $to) as [$source, $date, $amount]) {
            $key = $this->bucketStart($granularity, $date)->toDateString();

            if (! isset($buckets[$key])) {
                continue;
            }

            $buckets[$key][$source] += $amount;
            $buckets[$key]['total'] += $amount;
        }

        $buckets = array_values(array_map(fn (array $bucket) => array_map(
            fn ($value) => is_float($value) ? round($value, 2) : $value,
            $bucket,
        ), $buckets));

        $current = $buckets[count($buckets) - 1];

        return [
            'buckets' => $buckets,
            'current' => [
                ...array_intersect_key($current, array_flip([...self::SOURCES, 'total'])),
            ],
            'previous_total' => $buckets[count($buckets) - 2]['total'] ?? 0.0,
        ];
    }

    /**
     * Every paid amount in the window, as [source, date, amount].
     *
     * @return Collection<int, array{0: string, 1: CarbonImmutable, 2: float}>
     */
    private function entries(CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        $rows = fn ($query, string $dateColumn, string $amountColumn, string $source) => $query
            ->whereBetween($dateColumn, [$from, $to])
            ->get([$dateColumn, $amountColumn])
            ->map(fn ($row) => [
                $source,
                CarbonImmutable::parse($row->getRawOriginal($dateColumn)),
                (float) $row->getRawOriginal($amountColumn),
            ]);

        return collect()
            ->concat($rows(ResourceBooking::query()->where('payment_status', PaymentStatus::Paid), 'starts_at', 'amount', 'bookings'))
            ->concat($rows(Sale::query()->where('status', SaleStatus::Completed), 'created_at', 'total', 'pos'))
            ->concat($rows(RentalTransaction::query()->where('status', '!=', RentalStatus::Reserved), 'rented_at', 'total_amount', 'rentals'))
            ->concat($rows(OpenPlayRegistration::query()->where('payment_status', PaymentStatus::Paid), 'created_at', 'amount', 'open_play'));
    }

    private function bucketStart(string $granularity, CarbonInterface $date): CarbonImmutable
    {
        $date = CarbonImmutable::instance($date);

        return match ($granularity) {
            'day' => $date->startOfDay(),
            'week' => $date->startOfWeek(CarbonInterface::MONDAY),
            'month' => $date->startOfMonth(),
        };
    }

    private function shift(string $granularity, CarbonImmutable $date, int $by): CarbonImmutable
    {
        return match ($granularity) {
            'day' => $date->addDays($by),
            'week' => $date->addWeeks($by),
            'month' => $date->addMonthsNoOverflow($by),
        };
    }

    private function label(string $granularity, CarbonImmutable $start): string
    {
        return match ($granularity) {
            'day' => $start->format('M j'),
            'week' => $start->format('M j'),
            'month' => $start->format('M Y'),
        };
    }
}
