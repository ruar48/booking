<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $payable_type
 * @property int $payable_id
 * @property string $invoice_number
 * @property string $amount
 * @property string $currency
 * @property PaymentStatus $status
 * @property string|null $payment_method
 * @property string|null $paymongo_payment_intent_id
 * @property string|null $paymongo_payment_method_id
 * @property string|null $qr_code_url
 * @property Carbon|null $qr_expires_at
 * @property array<string, mixed>|null $raw_response
 * @property Carbon|null $paid_at
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'payable_type',
    'payable_id',
    'invoice_number',
    'amount',
    'currency',
    'status',
    'payment_method',
    'paymongo_payment_intent_id',
    'paymongo_payment_method_id',
    'qr_code_url',
    'qr_expires_at',
    'raw_response',
    'paid_at',
    'notes',
])]
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'status' => PaymentStatus::class,
            'raw_response' => 'array',
            'qr_expires_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payable(): MorphTo
    {
        return $this->morphTo();
    }
}
