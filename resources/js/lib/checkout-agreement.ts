import { router } from '@inertiajs/react';
import { toast } from 'sonner';

import type { CheckoutPolicy } from '@/types/booking';

/**
 * What online checkout sends with "I agree": the box itself, and the version
 * of each policy the customer was shown. The server keeps both with the
 * payment as proof of what was agreed to.
 */
export function agreementPayload(agreed: boolean, policies: CheckoutPolicy[]) {
    return {
        agreed,
        policy_versions: Object.fromEntries(policies.map((policy) => [policy.id, policy.version])),
    };
}

/**
 * A refused checkout says why. When it's about the agreement (the box wasn't
 * ticked, or a policy was edited while the page was open), the box is
 * unticked and the current wording fetched, so the customer agrees to what is
 * actually in force.
 */
export function showCheckoutErrors(errors: Record<string, string>, onAgreementRefused: () => void): void {
    const message = Object.values(errors)[0];

    if (message) {
        toast.error(message);
    }

    if (errors.agreed || errors.policy_versions) {
        onAgreementRefused();
        router.reload({ only: ['policies'] });
    }
}
