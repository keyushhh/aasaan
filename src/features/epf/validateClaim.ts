import type { Strings } from '../../i18n/strings';
import { inr } from '../../lib/format';

/** Returns the amount in rupees, or the error to show. */
export function validateClaim(raw: string, eligible: number, t: Strings): { amount: number } | { error: string } {
  const amount = parseInt(raw.replace(/\D/g, ''), 10);
  if (!amount) return { error: t.errEmpty };
  if (amount < 1000) return { error: t.errMin };
  if (amount > eligible) return { error: t.errMax(inr(eligible)) };
  return { amount };
}
