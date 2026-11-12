export type Dept = 'epf' | 'docs' | 'vehicle' | 'tax' | 'health';
export const DEPTS: Dept[] = ['epf', 'docs', 'vehicle', 'tax', 'health'];

export type StepState = 'done' | 'current' | 'todo';
export interface Step { label: string; date: string; state: StepState; note?: string }

export interface Request {
  id: string;
  svc: Dept;
  title: string;
  ref: string;
  amount?: number;
  created: string;
  /** ordering key, newest first */
  at: number;
  status: 'active' | 'done' | 'queued';
  steps: Step[];
}

export interface EpfSummary { uan: string; org: string; employee: number; employer: number; eps: number; eligible: number }
export interface PassbookMonth { month: string; employee: number; employer: number; pension: number }
export interface Passbook { months: PassbookMonth[]; interest: { fy: string; credited: string; amount: number } }
export type ClaimReason = 'Housing' | 'Medical treatment' | 'Education' | 'Marriage';
export interface ClaimInput { reason: ClaimReason; amount: number }

export interface Document { id: string; name: string; issuer: string; no: string; issued: string; fields: [string, string][] }
export interface Share { id: string; doc: string; code: string; exp: number }

export interface Registration { number: string; model: string; fuel: string; registered: string; insuranceTill: string; pucTill: string; fitnessTill: string }
export interface Licence { number: string; classes: string; rto: string; status: string; validTill: string }
export interface Challan { id: string; no: string; offence: string; place: string; date: string; amount: number; paid: boolean; paidOn?: string }
export type PayMethod = 'UPI app on this phone' | 'UPI ID' | 'Debit card' | 'Net banking';
export interface Receipt { utr: string; paidOn: string; amount: number; challanNo: string }

export interface PanAadhaarLink { linked: boolean; pan: string; linkedOn: string }
export interface TaxReturn { ay: string; form: string; filedOn: string; status: string; refund: number; steps: Step[] }
export interface TaxDemand { id: string; amount: number }

export interface Abha { number: string; address: string }
export interface ConsentRequest { id: string; from: string; purpose: string; what: string; until: string; status: 'pending' | 'allowed' | 'denied' }
export interface HealthRecord { name: string; facility: string; date: string }
