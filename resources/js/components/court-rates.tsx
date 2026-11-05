import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { VenueRates } from '@/types/booking';

/**
 * What playing costs, for the public home page beside the court rules: the
 * main sport's day and evening rates up front, then the other sports and the
 * paddle rental. Rates come from the courts themselves, so the card never
 * disagrees with checkout.
 */
export function CourtRates({
    rates,
    className,
}: {
    rates: VenueRates;
    className?: string;
}) {
    const [main, ...others] = rates.sports;

    if (!main) {
        return null;
    }

    const from = main.varies ? 'from ' : '';

    return (
        <section
            aria-labelledby="court-rates-heading"
            // A container: alone on a wide row (no court rules yet), the main
            // rates and the extras sit side by side instead of stretching.
            className={cn(
                '@container flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-brand-navy',
                className,
            )}
        >
            <h2
                id="court-rates-heading"
                className="text-xs font-bold tracking-widest text-slate-500 uppercase"
            >
                Rates per {singular(main.unit)}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{main.label}</p>

            <div className="mt-auto grid gap-4 pt-4 @2xl:grid-cols-2 @2xl:gap-10">
                <dl className="space-y-4">
                    <MainRate
                        label={main.evening === null ? 'All day' : 'Daytime'}
                        detail={
                            main.evening === null
                                ? null
                                : `Until ${rates.eveningFrom}`
                        }
                        amount={`${from}${formatPrice(main.day)}`}
                    />
                    {main.evening !== null ? (
                        <MainRate
                            label="Evening"
                            detail={`From ${rates.eveningFrom}`}
                            amount={`${from}${formatPrice(main.evening)}`}
                            accent
                        />
                    ) : null}
                </dl>

                {others.length > 0 || rates.paddleRental ? (
                    <dl className="space-y-2 border-t border-slate-100 pt-4 text-sm @2xl:self-end @2xl:border-t-0 @2xl:border-l @2xl:pt-0 @2xl:pl-10">
                        {others.map((sport) => (
                            <div
                                key={sport.sport}
                                className="flex items-baseline justify-between gap-3"
                            >
                                <dt className="text-slate-600">
                                    {sport.label}
                                </dt>
                                <dd className="text-right">
                                    <span className="font-semibold">
                                        {sport.varies ? 'from ' : ''}
                                        {formatPrice(sport.day)}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        /hr
                                    </span>
                                    {sport.evening !== null ? (
                                        <span className="block text-xs text-slate-500">
                                            {formatPrice(sport.evening)}/hr from{' '}
                                            {rates.eveningFrom}
                                        </span>
                                    ) : null}
                                </dd>
                            </div>
                        ))}
                        {rates.paddleRental ? (
                            <div className="flex items-baseline justify-between gap-3">
                                <dt className="text-slate-600">
                                    Paddle rental
                                </dt>
                                <dd className="text-right">
                                    <span className="font-semibold">
                                        {rates.paddleRental.from ? 'from ' : ''}
                                        {formatPrice(rates.paddleRental.amount)}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {rates.paddleRental.per === 'hour'
                                            ? '/hr'
                                            : ' / day'}
                                    </span>
                                </dd>
                            </div>
                        ) : null}
                    </dl>
                ) : null}
            </div>
        </section>
    );
}

function MainRate({
    label,
    detail,
    amount,
    accent = false,
}: {
    label: string;
    detail: string | null;
    amount: string;
    accent?: boolean;
}) {
    return (
        <div className="flex items-end justify-between gap-3">
            <dt>
                <span className="block text-sm font-medium">{label}</span>
                {detail ? (
                    <span className="block text-xs text-slate-500">
                        {detail}
                    </span>
                ) : null}
            </dt>
            <dd
                className={cn(
                    'text-right text-2xl font-extrabold tracking-tight',
                    accent && 'text-brand-court',
                )}
            >
                {amount}
                <span className="text-xs font-medium text-slate-500">/hr</span>
            </dd>
        </div>
    );
}

/** "courts" → "court", "tables" → "table", "stations" → "station". */
function singular(unit: string): string {
    return unit.replace(/s$/, '');
}
