import type {
  Dept,
  Abha, ClaimInput, ConsentRequest, Document, EpfSummary, HealthRecord, Licence, PanAadhaarLink, Passbook,
  PayMethod, Receipt, Registration, Request, Share, TaxDemand, TaxReturn, Challan, Contact, MobileTarget,
}  from './types';

/** One interface per department. A real adapter (API Setu, DigiLocker, Parivahan, ABDM, EPFO) implements the same shape. */
export interface EpfService {
  getSummary(): Promise<EpfSummary>;
  getPassbook(): Promise<Passbook>;
  /** `queued` is set when the claim waited in the outbox: when it was saved on the phone. */
  submitClaim(input: ClaimInput, queued?: { on: string; at: number }): Promise<Request>;
}

export interface DocumentsService {
  listDocuments(): Promise<Document[]>;
  listShares(): Promise<Share[]>;
  createShare(docId: string, hours: number): Promise<Share>;
  revokeShare(id: string): Promise<void>;
}

export interface VehicleService {
  getRegistration(): Promise<Registration>;
  getLicence(): Promise<Licence>;
  listChallans(): Promise<Challan[]>;
  payChallan(id: string, method: PayMethod): Promise<Receipt>;
}

export interface TaxService {
  getPanAadhaarLink(): Promise<PanAadhaarLink>;
  getReturn(): Promise<TaxReturn>;
  getDemands(): Promise<TaxDemand[]>;
}

export interface HealthService {
  getAbha(): Promise<Abha>;
  listConsentRequests(): Promise<ConsentRequest[]>;
  respondToConsent(id: string, decision: 'allowed' | 'denied'): Promise<ConsentRequest>;
  listRecords(): Promise<HealthRecord[]>;
}

/** Aasaan's own tracker across departments. */
export interface RequestsService {
  list(): Promise<Request[]>;
}

/** What one department holds for a mobile number: a masked identifier when it has records, nothing when it doesn't. */
export interface Finding { dept: Dept; found: boolean; id?: string }
/** The person the records belong to, as their Aadhaar has them, for the "is this you" check. */
export interface Identity { name: string; born: number }

export interface AuthService {
  /**
   * Device binding: the app sends one SMS from the chosen SIM to the verification number, and the server checks it
   * arrived from this mobile number. Rejects with SimMismatch when that SIM holds a different number.
   */
  verifySim(mobile: string, sim: 1 | 2): Promise<void>;
  /** Ask one department whether it holds records for this number. */
  discover(mobile: string, dept: Dept): Promise<Finding>;
  identity(mobile: string): Promise<Identity>;
  sendOtp(mobile: string): Promise<void>;
  /** Resolves with the citizen's name, rejects with InvalidOtp. */
  verifyOtp(mobile: string, otp: string): Promise<{ name: string }>;
}

export class InvalidOtp extends Error {
  name = 'InvalidOtp';
}
export class SimMismatch extends Error {
  name = 'SimMismatch';
}

export interface ProfileService {
  /** Ask one department to replace the mobile number or email on the citizen's record. */
  updateContact(kind: Contact, target: MobileTarget, value: string, queued?: { on: string; at: number }): Promise<Request>;
}

export interface Adapters {
  /** Is the department reachable right now. Used by the refresh button. */
  ping(dept: Dept): Promise<void>;
  epf: EpfService;
  docs: DocumentsService;
  vehicle: VehicleService;
  tax: TaxService;
  health: HealthService;
  profile: ProfileService;
  requests: RequestsService;
  auth: AuthService;
  /** Prototype only: restore the sample data. */
  reset?(): void;
}
