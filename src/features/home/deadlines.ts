import type { Dept, Licence, Registration } from '../../data/types';
import type { Strings } from '../../i18n/strings';
import { daysTo, todayISO } from '../../lib/format';

export interface Deadline { key: string; svc: Dept; title: string; date: string; days: number }

/** Advance tax instalments fall due on these days every year, and returns on 31 July. Public dates, not department data. */
const ADVANCE_TAX = ['03-15', '06-15', '09-15', '12-15'];
const ITR = '07-31';

/** The next time a month-day comes round, today included. */
const next = (md: string) => {
  const y = Number(todayISO().slice(0, 4));
  return daysTo(`${y}-${md}`) >= 0 ? `${y}-${md}` : `${y + 1}-${md}`;
};

/** Dates that fall within the next year, soonest first. Expired documents are the attention queue's job, not this list's. */
export function deadlines({ registration, licence, tax }: { registration?: Registration; licence?: Licence; tax: boolean }, t: Strings): Deadline[] {
  const out: Deadline[] = [];
  const add = (key: string, svc: Dept, title: string, date: string) => {
    const days = daysTo(date);
    if (days >= 0 && days <= 365) out.push({ key: `${key}:${date}`, svc, title, date, days });
  };
  if (registration) {
    add('puc', 'vehicle', t.deadline.puc, registration.pucTill);
    add('insurance', 'vehicle', t.deadline.insurance, registration.insuranceTill);
    add('fitness', 'vehicle', t.deadline.fitness, registration.fitnessTill);
  }
  if (licence) add('licence', 'vehicle', t.deadline.licence, licence.validTill);
  if (tax) {
    add('advanceTax', 'tax', t.deadline.advanceTax, ADVANCE_TAX.map(next).sort()[0]);
    add('itr', 'tax', t.deadline.itr, next(ITR));
  }
  return out.sort((a, b) => a.days - b.days);
}
