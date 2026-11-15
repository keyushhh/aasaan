import type { Dept, Document, EpfSummary, PanAadhaarLink, Passbook, Scheme, TaxReturn } from '../types';
import * as Demo from './seed';

/**
 * A first-time user: any number other than the demo one. A young salaried person in their first job, with
 * records in three departments (EPFO, DigiLocker, Income Tax) and none yet with Parivahan or ABDM.
 * No history: no requests, challans, consent requests, family or other devices.
 */
const EMPLOYEE = 48200;
export const EPF: EpfSummary = { uan: '1019 4471 3342', org: 'Northwind Logistics Pvt Ltd', employee: EMPLOYEE, employer: 41300, eps: 12600, eligible: Math.round(EMPLOYEE * 0.5) };
export const PASSBOOK: Passbook = {
  months: ['Oct 2026', 'Sep 2026', 'Aug 2026', 'Jul 2026'].map((month) => ({ month, employee: 3600, employer: 2350, pension: 1250 })),
  interest: { fy: '2025-26', credited: '2026-08-12', amount: 2140 },
};
export const DOCS: Document[] = [
  { id: 'aadhaar', name: 'Aadhaar', issuer: 'UIDAI', no: 'XXXX XXXX 5530', issued: '2016-09-02', fields: [['Name', 'Rohan Mehta'], ['Year of birth', '1999'], ['Address', 'Koramangala, Bengaluru']] },
  { id: 'pan', name: 'PAN card', issuer: 'Income Tax Department', no: 'BRMPM••••L', issued: '2021-07-19', fields: [['Name', 'Rohan Mehta'], ['Father’s name', 'Vikram Mehta'], ['Date of birth', '03 Feb 1999']] },
];
export const PAN_LINK: PanAadhaarLink = { linked: true, pan: 'BRMPM••••L', linkedOn: '2021-07-19' };
export const TAX_RETURN: TaxReturn = {
  ay: '2026-27', form: 'ITR-1', filedOn: '2026-07-30', status: 'Processed', refund: 0,
  steps: [{ label: 'Return filed', date: '2026-07-30', state: 'done' }, { label: 'Verified with Aadhaar OTP', date: '2026-07-30', state: 'done' }, { label: 'Processed, no refund due', date: '2026-09-04', state: 'done' }],
};
export const IDENTITY = { name: 'Rohan Mehta', born: 1999 };
export const FOUND: Partial<Record<Dept, string>> = { epf: 'UAN 1019 •••• 3342', docs: 'Aadhaar •••• •••• 5530', tax: 'PAN BRMPM••••L' };
export const SCHEMES: Scheme[] = Demo.SCHEMES.map((x) => ({ ...x, why: x.why.replace('HDFC Bank ••4417', 'ICICI Bank ••7781') }));

/** Departments with no records for this person keep the demo values only so types line up; onboarding never links them. */
export const { REGISTRATION, LICENCE, ABHA, RECORDS } = Demo;

export const seedState = (): Demo.MockState => ({ challans: [], requests: [], consents: [], shares: [], family: [], devices: [] });
