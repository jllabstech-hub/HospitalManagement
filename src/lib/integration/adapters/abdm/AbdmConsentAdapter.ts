import { IConsentManagerAdapter } from '../../core/interfaces';
import { logger } from '@/lib/logger';

export class AbdmConsentAdapter implements IConsentManagerAdapter {
  private isMock: boolean;

  constructor(isMock: boolean = false) {
    this.isMock = isMock;
  }

  async requestConsent(patientId: string, purpose: string): Promise<string> {
    if (this.isMock) {
      void patientId;
      void purpose;
      logger.info({ event: 'abdm.mock.request_consent' }, 'ABDM mock consent request');
      return `mock-consent-req-${Date.now()}`;
    }

    throw new Error('Not implemented for production. Requires NHA certification.');
  }

  async checkConsentStatus(consentRequestId: string): Promise<'GRANTED' | 'DENIED' | 'PENDING'> {
    if (this.isMock) {
      void consentRequestId;
      logger.info({ event: 'abdm.mock.check_consent' }, 'ABDM mock consent status check');
      return 'GRANTED';
    }

    throw new Error('Not implemented for production. Requires NHA certification.');
  }
}
