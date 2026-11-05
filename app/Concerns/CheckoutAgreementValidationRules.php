<?php

namespace App\Concerns;

use App\Enums\PolicyPlacement;
use App\Models\Policy;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Support\Str;

/**
 * The "I agree" box at online checkout, checked on the server so a payment
 * can't start without it, and turned into the record kept with the payment.
 *
 * For checkout form requests: the page sends the box and the version of each
 * policy it showed; a policy edited in the meantime means the customer agreed
 * to wording that is no longer in force, so they are asked to agree again.
 */
trait CheckoutAgreementValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function checkoutAgreementRules(): array
    {
        return [
            'agreed' => ['accepted'],
            'policy_versions' => ['present', 'array'],
            'policy_versions.*' => ['integer'],
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function checkoutAgreementMessages(): array
    {
        return [
            'agreed.accepted' => __('Please agree to the payment policy and the Terms of Service to continue.'),
            'policy_versions.present' => __('Please agree to the payment policy and the Terms of Service to continue.'),
        ];
    }

    protected function ensureAgreedPoliciesAreCurrent(Validator $validator): void
    {
        if ($validator->errors()->isNotEmpty()) {
            return;
        }

        $seen = collect((array) $this->input('policy_versions', []))
            ->map(fn (mixed $version): int => (int) $version)
            ->sortKeys()
            ->all();

        $current = Policy::activeAt(PolicyPlacement::Checkout)
            ->mapWithKeys(fn (Policy $policy): array => [$policy->id => $policy->version])
            ->sortKeys()
            ->all();

        if ($seen !== $current) {
            $validator->errors()->add('agreed', __('Our payment policy was just updated. Please read it and agree again.'));
        }
    }

    /**
     * What the customer agreed to and how, to keep with the payment as proof:
     * the policy and Terms versions in force, and where the agreement came from.
     *
     * @return array{terms_version: string, privacy_version: string, policies: list<array{id: int, title: string, version: int}>, ip: string|null, user_agent: string|null}
     */
    public function checkoutAgreement(): array
    {
        $userAgent = $this->userAgent();

        return [
            'terms_version' => (string) config('legal.terms.version'),
            'privacy_version' => (string) config('legal.privacy.version'),
            'policies' => array_values(Policy::activeAt(PolicyPlacement::Checkout)
                ->map(fn (Policy $policy): array => [
                    'id' => $policy->id,
                    'title' => $policy->title,
                    'version' => $policy->version,
                ])
                ->all()),
            'ip' => $this->ip(),
            'user_agent' => $userAgent !== null ? Str::limit($userAgent, 500, '') : null,
        ];
    }
}
