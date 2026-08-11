<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PaymongoService
{
    private const BASE_URL = 'https://api.paymongo.com/v1';

    /**
     * @return array<string, mixed>
     */
    public function createPaymentIntent(int $amountCentavos, string $description): array
    {
        $response = $this->client()
            ->post(self::BASE_URL.'/payment_intents', [
                'data' => [
                    'attributes' => [
                        'amount' => $amountCentavos,
                        'currency' => 'PHP',
                        'description' => $description,
                        'capture_type' => 'automatic',
                        'payment_method_allowed' => ['qrph'],
                    ],
                ],
            ])
            ->throw();

        return $response->json('data');
    }

    /**
     * @param  array<string, mixed>  $billing
     * @return array<string, mixed>
     */
    public function createPaymentMethod(array $billing = []): array
    {
        $response = $this->client()
            ->post(self::BASE_URL.'/payment_methods', [
                'data' => [
                    'attributes' => [
                        'type' => 'qrph',
                        'billing' => $billing,
                    ],
                ],
            ])
            ->throw();

        return $response->json('data');
    }

    /**
     * @return array<string, mixed>
     */
    public function attachPaymentMethod(string $paymentIntentId, string $clientKey, string $paymentMethodId): array
    {
        $response = $this->client()
            ->post(self::BASE_URL."/payment_intents/{$paymentIntentId}/attach", [
                'data' => [
                    'attributes' => [
                        'payment_method' => $paymentMethodId,
                        'client_key' => $clientKey,
                    ],
                ],
            ])
            ->throw();

        return $response->json('data');
    }

    private function client(): PendingRequest
    {
        $secretKey = config('services.paymongo.secret_key');

        if (! $secretKey) {
            throw new RuntimeException('PayMongo secret key is not configured.');
        }

        return Http::withBasicAuth($secretKey, '')->acceptJson();
    }
}
