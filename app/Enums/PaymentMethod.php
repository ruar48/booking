<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case Card = 'card';
    case BankTransfer = 'bank_transfer';
    case Qrph = 'qrph';
    case Gcash = 'gcash';
    case Maya = 'maya';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::Card => 'Card',
            self::BankTransfer => 'Bank Transfer',
            self::Qrph => 'QR Ph',
            self::Gcash => 'GCash',
            self::Maya => 'Maya',
        };
    }
}
