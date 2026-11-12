import type { Challan, ConsentRequest, Document, EpfSummary, HealthRecord, Licence, PanAadhaarLink, Passbook, Registration, Request, Share, TaxReturn } from '../types';

const EMPLOYEE = 342180;
export const EPF: EpfSummary = {
  uan: '1012 3456 7890', org: 'Brightline Technologies Pvt Ltd',
  employee: EMPLOYEE, employer: 296540, eps: 112400, eligible: Math.round(EMPLOYEE * 0.5),
};
export const PASSBOOK: Passbook = {
  months: ['Oct 2026', 'Sep 2026', 'Aug 2026', 'Jul 2026', 'Jun 2026', 'May 2026'].map((month) => ({ month, employee: 7200, employer: 5950, pension: 1250 })),
  interest: { fy: '2025-26', credited: '2026-08-12', amount: 48320 },
};

export const DOCS: Document[] = [
  { id: 'aadhaar', name: 'Aadhaar', issuer: 'UIDAI', no: 'XXXX XXXX 4821', issued: '2014-06-11', fields: [['Name', 'Ananya Rao'], ['Year of birth', '1994'], ['Address', 'Indiranagar, Bengaluru']] },
  { id: 'pan', name: 'PAN card', issuer: 'Income Tax Department', no: 'ABCPR••••K', issued: '2012-03-02', fields: [['Name', 'Ananya Rao'], ['Father’s name', 'Suresh Rao'], ['Date of birth', '14 Aug 1994']] },
  { id: 'dl', name: 'Driving licence', issuer: 'Transport Department, Karnataka', no: 'KA01 20190012345', issued: '2019-01-22', fields: [['Class', 'LMV, MCWG'], ['Valid till', '13 Aug 2039'], ['RTO', 'Bengaluru Central']] },
  { id: 'rc', name: 'Vehicle RC', issuer: 'Transport Department, Karnataka', no: 'KA 01 MJ 4521', issued: '2019-03-14', fields: [['Vehicle', 'Maruti Suzuki Swift VXi'], ['Fuel', 'Petrol'], ['Owner', 'Ananya Rao']] },
  { id: 'xii', name: 'Class XII marksheet', issuer: 'CBSE', no: 'Roll 9142873', issued: '2012-05-28', fields: [['Year', '2012'], ['Result', 'Pass, 88.4%']] },
  { id: 'abha', name: 'ABHA card', issuer: 'National Health Authority', no: '91-4821-7735-0062', issued: '2023-02-09', fields: [['ABHA address', 'ananya.rao@abdm'], ['Name', 'Ananya Rao']] },
];

export const REGISTRATION: Registration = {
  number: 'KA 01 MJ 4521', model: 'Maruti Suzuki Swift VXi', fuel: 'petrol', registered: '2019-03-14',
  insuranceTill: '2027-03-21', pucTill: '2026-12-02', fitnessTill: '2034-03-13',
};
export const LICENCE: Licence = { number: 'KA01 20190012345', classes: 'LMV and MCWG', rto: 'Bengaluru Central RTO', status: 'Active', validTill: '2039-08-13' };

export const PAN_LINK: PanAadhaarLink = { linked: true, pan: 'ABCPR••••K', linkedOn: '2022-03-18' };
const REFUND_STEPS: TaxReturn['steps'] = [
  { label: 'Return filed', date: '2026-07-24', state: 'done' }, { label: 'Return processed', date: '2026-09-19', state: 'done' },
  { label: 'Refund issued', date: '2026-10-26', state: 'done' }, { label: 'Credited to SBI ••0932', date: '2026-10-28', state: 'done' },
];
export const TAX_RETURN: TaxReturn = { ay: '2026-27', form: 'ITR-1', filedOn: '2026-07-24', status: 'Processed', refund: 14230, steps: REFUND_STEPS };

export const ABHA = { number: '91-4821-7735-0062', address: 'ananya.rao@abdm' };
export const RECORDS: HealthRecord[] = [
  { name: 'Complete blood count', facility: 'City Diagnostics', date: '2026-09-12' },
  { name: 'Prescription', facility: 'Sanjeevani Clinic', date: '2026-09-14' },
  { name: 'Vaccination record', facility: 'Urban PHC, Indiranagar', date: '2025-11-03' },
];

export const CITIZEN = { name: 'Ananya Rao' };

export interface MockState { challans: Challan[]; requests: Request[]; consents: ConsentRequest[]; shares: Share[] }

export const seedState = (): MockState => ({
  challans: [
    { id: 'c1', no: 'KA03926100811', offence: 'Parking in a no-parking zone', place: '100 Feet Road, Indiranagar', date: '2026-10-08', amount: 500, paid: false },
    { id: 'c2', no: 'KA03925051204', offence: 'Jumping a red signal', place: 'Silk Board Junction', date: '2025-05-12', amount: 1000, paid: true, paidOn: '2025-05-14' },
  ],
  requests: [
    { id: 'r1', svc: 'epf', title: 'PF withdrawal for housing', ref: 'EPF/KA/26/118042', amount: 85000, created: '2026-11-03', at: Date.parse('2026-11-03'), status: 'active', steps: [
      { label: 'Submitted to EPFO', date: '2026-11-03', state: 'done' }, { label: 'Verified by employer', date: '2026-11-05', state: 'done' },
      { label: 'EPFO review', date: '', state: 'current', note: 'Usually 5 to 7 working days' }, { label: 'Paid to HDFC Bank ••4417', date: '', state: 'todo' }] },
    { id: 'r2', svc: 'tax', title: 'Income tax refund, AY 2026-27', ref: 'Acknowledgement 482917306241026', amount: 14230, created: '2026-07-24', at: Date.parse('2026-07-24'), status: 'done', steps: REFUND_STEPS },
    { id: 'r3', svc: 'vehicle', title: 'Challan paid for red signal', ref: 'KA03925051204', amount: 1000, created: '2025-05-14', at: Date.parse('2025-05-14'), status: 'done', steps: [
      { label: 'Payment received', date: '2025-05-14', state: 'done' }, { label: 'Challan closed', date: '2025-05-14', state: 'done' }] },
  ],
  consents: [{ id: 'k1', from: 'City Care Hospital, Bengaluru', purpose: 'a doctor consultation', what: 'lab reports and prescriptions from the last 12 months', until: '7 days', status: 'pending' }],
  shares: [],
});
