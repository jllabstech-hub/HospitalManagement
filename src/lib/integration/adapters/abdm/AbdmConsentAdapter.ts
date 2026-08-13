import { IConsentManagerAdapter } from '../../core/interfaces';

export class AbdmConsentAdapter implements IConsentManagerAdapter {
  private isMock: boolean;

  constructor(isMock: boolean = false) {
    this.isMock = isMock;
  }

  async requestConsent(patientId: string, purpose: string): Promise<string> {
    if (this.isMock) {
      console.log(`[ABDM MOCK] Requesting consent for patient ${patientId}. Purpose: ${purpose}`);
      return `mock-consent-req-${Date.now()}`;
    }

    // TODO: Milestone 3 - Implement /v1/consent-requests/init API
    throw new Error('Not implemented for production. Requires NHA certification.');
  }

  async checkConsentStatus(consentRequestId: string): Promise<'GRANTED' | 'DENIED' | 'PENDING'> {
    if (this.isMock) {
      console.log(`[ABDM MOCK] Checking status for consent req ${consentRequestId}`);
      return 'GRANTED';
    }

    // TODO: Milestone 3 - Implement /v1/consent-requests/status API
    throw new Error('Not implemented for production. Requires NHA certification.');
  }
}
