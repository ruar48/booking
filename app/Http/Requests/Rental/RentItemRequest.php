<?php

namespace App\Http\Requests\Rental;

use App\Enums\RentalStatus;
use App\Models\RentalItem;
use App\Models\RentalTransactionItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * A member renting gear for themselves. Self-service rentals take stock
 * immediately with no staff in the loop, so each member is capped — without
 * it one account could rent out (or reserve) everything and leave nothing for
 * walk-ins.
 */
class RentItemRequest extends FormRequest
{
    public const MAX_OUTSTANDING_UNITS = 10;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'rental_item_id' => ['required', 'integer', Rule::exists(RentalItem::class, 'id')],
            'quantity' => ['required', 'integer', 'min:1', 'max:'.self::MAX_OUTSTANDING_UNITS],
            'duration_type' => ['required', Rule::in(['daily', 'hourly'])],
            'duration_hours' => ['required_if:duration_type,hourly', 'nullable', 'integer', 'min:1', 'max:12'],
            'reserved_for' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            // Partly-returned rentals only count what is still out.
            $outstanding = (int) RentalTransactionItem::query()
                ->whereHas('rentalTransaction', fn ($query) => $query
                    ->where('renter_id', $this->user()->id)
                    ->whereIn('status', [RentalStatus::Active, RentalStatus::Overdue, RentalStatus::Reserved]))
                ->sum(DB::raw('quantity - quantity_returned'));

            if ($outstanding + (int) $this->input('quantity') > self::MAX_OUTSTANDING_UNITS) {
                $validator->errors()->add('quantity', __('You can have up to :max items rented or reserved at once. Return some first, or ask the front desk.', [
                    'max' => self::MAX_OUTSTANDING_UNITS,
                ]));
            }
        });
    }
}
