import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

export type Column = 'main' | 'side';

/**
 * Which of two side-by-side columns a card that fits in either should go
 * in: the shorter one, so it fills the gap instead of leaving white space.
 * Column heights follow the data (how many time slots a day has, which tab
 * is open), so this re-checks whenever either column resizes.
 *
 * `main` and `side` are measured without the card itself, so moving it never
 * changes the answer and it can't flip back and forth. Below `query` the
 * columns stack and the card stays in the side column's place.
 */
export function useShorterColumn(
    main: RefObject<HTMLElement | null>,
    side: RefObject<HTMLElement | null>,
    card: RefObject<HTMLElement | null>,
    query = '(min-width: 1024px)',
): Column {
    const [column, setColumn] = useState<Column>('side');

    useEffect(() => {
        const mainEl = main.current;
        const sideEl = side.current;

        if (!mainEl || !sideEl) {
            return;
        }

        const media = window.matchMedia(query);

        const update = () => {
            if (!media.matches) {
                setColumn('side');

                return;
            }

            const cardEl = card.current;
            const cardInSide = cardEl !== null && sideEl.contains(cardEl);
            const gap = parseFloat(getComputedStyle(sideEl).rowGap) || 0;
            const sideHeight =
                sideEl.offsetHeight -
                (cardInSide ? cardEl.offsetHeight + gap : 0);

            setColumn(mainEl.offsetHeight >= sideHeight ? 'side' : 'main');
        };

        // Observing reports each element's size straight away, so this also
        // makes the first decision once the page has laid out.
        const observer = new ResizeObserver(update);
        observer.observe(mainEl);
        observer.observe(sideEl);
        media.addEventListener('change', update);

        return () => {
            observer.disconnect();
            media.removeEventListener('change', update);
        };
    }, [main, side, card, query]);

    return column;
}
