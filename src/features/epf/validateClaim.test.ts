import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/strings';
import { validateClaim } from './validateClaim';

const ELIGIBLE = 171090;

describe('claim validation', () => {
  it('asks for an amount when it is empty', () => {
    expect(validateClaim('', ELIGIBLE, en)).toEqual({ error: 'Enter the amount you want to withdraw.' });
    expect(validateClaim('abc', ELIGIBLE, en)).toEqual({ error: 'Enter the amount you want to withdraw.' });
  });
  it('rejects anything under ₹1,000', () => {
    expect(validateClaim('999', ELIGIBLE, en)).toEqual({ error: 'The minimum withdrawal is ₹1,000.' });
  });
  it('rejects anything over the eligible limit', () => {
    expect(validateClaim('171091', ELIGIBLE, en)).toEqual({ error: 'You can withdraw up to ₹1,71,090. Lower the amount to continue.' });
  });
  it('accepts the limits themselves and ignores formatting', () => {
    expect(validateClaim('1000', ELIGIBLE, en)).toEqual({ amount: 1000 });
    expect(validateClaim('1,71,090', ELIGIBLE, en)).toEqual({ amount: ELIGIBLE });
  });
});
