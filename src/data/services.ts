import type {
  Dept,
  Abha, ClaimInput, ConsentRequest, Document, EpfSummary, HealthRecord, Licence, PanAadhaarLink, Passbook,
  PayMethod, Receipt, Registration, Request, Share, TaxDemand, TaxReturn, Challan,
} from './types';

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

export interface AuthService {
  sendOtp(mobile: string): Promise<void>;
  /** Resolves with the citizen's name, rejects with InvalidOtp. */
  verifyOtp(mobile: string, otp: string): Promise<{ name: string }>;
}

export class InvalidOtp extends Error {
  name = 'InvalidOtp';
}

export interface Adapters {
  /** Is the department reachable right now. Used by the refresh button. */
  ping(dept: Dept): Promise<void>;
  epf: EpfService;
  docs: DocumentsService;
  vehicle: VehicleService;
  tax: TaxService;
  health: HealthService;
  requests: RequestsService;
  auth: AuthService;
  /** Prototype only: restore the sample data. */
  reset?(): void;
}
