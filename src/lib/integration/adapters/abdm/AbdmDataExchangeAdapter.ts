import { IHealthDataExchangeAdapter } from '../../core/interfaces';

export class AbdmDataExchangeAdapter implements IHealthDataExchangeAdapter {
  private isMock: boolean;

  constructor(isMock: boolean = false) {
    this.isMock = isMock;
  }

  async linkCareContext(patientId: string, visitId: string): Promise<void> {
    if (this.isMock) {
      console.log(`[ABDM MOCK] Linking Care Context. Patient: ${patientId}, Visit: ${visitId}`);
      return;
    }

    // TODO: Milestone 2 - Implement /v1/links/link/init API (HIP)
    throw new Error('Not implemented for production. Requires NHA certification.');
  }

  async fetchHealthData(consentArtifactId: string): Promise<Record<string, unknown>[]> {
    if (this.isMock) {
      console.log(`[ABDM MOCK] Fetching FHIR bundles for consent artifact: ${consentArtifactId}`);
      return [{ resourceType: 'Bundle', entry: [] }]; // Mock empty FHIR bundle
    }

    // TODO: Milestone 3 - Implement /v1/health-information/request API (HIU)
    // Requires decrypting payload using standard ECDH keys as per ABDM encryption specs
    throw new Error('Not implemented for production. Requires NHA certification.');
  }
}
