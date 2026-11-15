import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deadlines } from './deadlines';
import { en } from '../../i18n/strings';
import type { Licence, Registration } from '../../data/types';

const reg = (r: Partial<Registration>): Registration =>
  ({ number: 'KA01', model: 'Car', fuel: 'Petrol', registered: '2020-01-01', insuranceTill: '2000-01-01', pucTill: '2000-01-01', fitnessTill: '2000-01-01', ...r });
const lic = (validTill: string): Licence => ({ number: 'DL1', classes: 'LMV', rto: 'KA01', status: 'Active', validTill });
const today = (y: number, m: number, d: number) => vi.setSystemTime(new Date(y, m - 1, d, 12));

describe('deadlines', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('lists dates within a year, soonest first, skipping past and far-off ones', () => {
    today(2026, 1, 10);
    const out = deadlines({ registration: reg({ pucTill: '2026-02-01', insuranceTill: '2025-12-01', fitnessTill: '2027-06-01' }), licence: lic('2026-01-10'), tax: true }, en);
    expect(out.map((d) => [d.key, d.svc, d.title, d.days])).toEqual([
      ['licence:2026-01-10', 'vehicle', en.deadline.licence, 0],
      ['puc:2026-02-01', 'vehicle', en.deadline.puc, 22],
      ['advanceTax:2026-03-15', 'tax', en.deadline.advanceTax, 64],
      ['itr:2026-07-31', 'tax', en.deadline.itr, 202],
    ]);
  });

  it('keeps a date exactly 365 days out and drops one 366 days out', () => {
    today(2026, 1, 10);
    expect(deadlines({ licence: lic('2027-01-10'), tax: false }, en).map((d) => d.days)).toEqual([365]);
    expect(deadlines({ licence: lic('2027-01-11'), tax: false }, en)).toEqual([]);
  });

  it('returns nothing without documents or tax', () => {
    today(2026, 1, 10);
    expect(deadlines({ tax: false }, en)).toEqual([]);
  });

  it('counts an instalment due today, then rolls to next year once passed', () => {
    today(2026, 12, 15);
    expect(deadlines({ tax: true }, en).find((d) => d.svc === 'tax' && d.title === en.deadline.advanceTax)).toMatchObject({ date: '2026-12-15', days: 0 });
    today(2026, 12, 16);
    expect(deadlines({ tax: true }, en)[0]).toMatchObject({ title: en.deadline.advanceTax, date: '2027-03-15' });
  });

  it('moves the return to next July after 31 July', () => {
    today(2026, 8, 1);
    expect(deadlines({ tax: true }, en).map((d) => d.date)).toEqual(['2026-09-15', '2027-07-31']);
  });
});
