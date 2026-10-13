<?php

namespace App\Support;

/**
 * The online-payment (PayMongo) fee, passed on to the customer so the venue
 * receives the full price.
 *
 * PayMongo takes its percentage from the *gross* charge, so adding
 * `price × percent` would still leave the venue short. The charge is grossed
 * up instead: total = (price + fixed) / (1 − percent), rounded up to the cent.
 */
class ConvenienceFee
{
    /**
     * @return array{base: float, fee: float, total: float}
     */
    public static function for(float|string $base): array
    {
        $base = round((float) $base, 2);
        $percent = (float) config('services.paymongo.fee_percent', 0);
        $fixed = (float) config('services.paymongo.fee_fixed', 0);

        if ($base <= 0 || ($percent <= 0 && $fixed <= 0)) {
            return ['base' => $base, 'fee' => 0.0, 'total' => $base];
        }

        $total = ceil((($base + $fixed) / (1 - $percent / 100)) * 100 - 1e-9) / 100;

        return [
            'base' => $base,
            'fee' => round($total - $base, 2),
            'total' => round($total, 2),
        ];
    }
}
