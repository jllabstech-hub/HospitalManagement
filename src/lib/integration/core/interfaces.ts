/**
 * ABDM Milestone 1: Identity and Registry Interfaces
 */
export interface IHealthIdentityAdapter {
  /**
   * Verifies an ABHA address/number using ABDM Gateway APIs.
   */
  verifyIdentity(abhaAddress: string): Promise<boolean>;

  /**
   * Verifies a doctor's HPR ID.
   */
  verifyHprId(hprId: string): Promise<boolean>;

  /**
   * Generates a link session to create an ABHA number.
   */
  createIdentitySession(aadharOrMobile: string): Promise<string>;
}

/**
 * ABDM Milestone 3: Consent Management Interfaces
 */
export interface IConsentManagerAdapter {
  /**
   * Request consent from a patient to view their health records.
   */
  requestConsent(patientId: string, purpose: string): Promise<string>;

  /**
   * Check the status of a pending consent request.
   */
  checkConsentStatus(consentRequestId: string): Promise<'GRANTED' | 'DENIED' | 'PENDING'>;
}

/**
 * ABDM Milestone 2 & 3: Health Data Exchange Interfaces
 */
export interface IHealthDataExchangeAdapter {
  /**
   * Links a hospital visit (care context) to an ABHA address.
   */
  linkCareContext(patientId: string, visitId: string): Promise<void>;

  /**
   * Fetches health records using an approved consent artifact.
   */
  fetchHealthData(consentArtifactId: string): Promise<Record<string, unknown>[]>;
}
