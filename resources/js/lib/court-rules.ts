import type { SportValue } from '@/lib/sport';
import type { CourtRuleBook } from '@/types/booking';

export const EMPTY_RULE_BOOK: CourtRuleBook = { general: [], sports: {} };

/**
 * The rules to show for one sport: that sport's own rules first, then the
 * house rules every sport shares.
 */
export function rulesForSport(book: CourtRuleBook, sport: SportValue): string[] {
    return [...(book.sports[sport] ?? []), ...book.general];
}
