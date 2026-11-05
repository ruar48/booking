<?php

namespace App\Services;

use App\Enums\PolicyPlacement;
use App\Models\LoginHistory;
use App\Models\PageView;
use App\Models\Policy;
use App\Models\Setting;
use App\Services\Booking\BookingPricer;
use App\Support\BusinessIdentity;
use Illuminate\Support\Carbon;

/**
 * Props for the Terms of Service and Privacy Notice pages. The wording lives
 * in the pages; everything here is a fact the wording has to state correctly
 * — who the business is, the payment hold, the fee, the house rules, how long
 * records are kept — read from the same settings the app itself runs on.
 */
class LegalPagesPresenter
{
    /**
     * @return array<string, mixed>
     */
    public function terms(): array
    {
        return [
            'business' => BusinessIdentity::current()->toArray(),
            'document' => $this->document('terms'),
            'holdMinutes' => $this->holdMinutes(),
            'convenienceFee' => [
                'percent' => (float) config('services.paymongo.fee_percent', 0),
                'fixed' => (float) config('services.paymongo.fee_fixed', 0),
            ],
            'eveningRateFrom' => Carbon::parse(BookingPricer::EVENING_STARTS)->format('g A'),
            // Shown word for word, so the Terms and the checkout agreement
            // can't say different things.
            'bookingPolicy' => Policy::linesAt(PolicyPlacement::Checkout),
            'courtRules' => Policy::linesAt(PolicyPlacement::CourtRules),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function privacy(): array
    {
        return [
            'business' => BusinessIdentity::current()->toArray(),
            'document' => $this->document('privacy'),
            'retention' => [
                'pageViewDays' => PageView::RETENTION_DAYS,
                'loginHistoryDays' => LoginHistory::RETENTION_DAYS,
                'sessionMinutes' => (int) config('session.lifetime'),
            ],
        ];
    }

    /**
     * @return array{version: string, effectiveAt: string}
     */
    private function document(string $name): array
    {
        return [
            'version' => (string) config("legal.{$name}.version"),
            'effectiveAt' => (string) config("legal.{$name}.effective_at"),
        ];
    }

    private function holdMinutes(): ?int
    {
        $minutes = Setting::query()
            ->where('group', 'bookings')
            ->where('key', 'unpaid_cancel_minutes')
            ->value('value');

        return is_numeric($minutes) && (int) $minutes > 0 ? (int) $minutes : null;
    }
}
