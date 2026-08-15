import { IHealthIdentityAdapter } from '../../core/interfaces';
import { logger } from '@/lib/logger';

export class AbdmIdentityAdapter implements IHealthIdentityAdapter {
  private isMock: boolean;

  constructor(isMock: boolean = false) {
    this.isMock = isMock;
  }

  async verifyIdentity(abhaAddress: string): Promise<boolean> {
    if (this.isMock) {
      logger.info({ event: 'abdm.mock.verify_identity' }, 'ABDM mock identity verification');
      return abhaAddress.includes('@abdm');
    }

    throw new Error('Not implemented for production. Requires NHA certification.');
  }

  async verifyHprId(hprId: string): Promise<boolean> {
    if (this.isMock) {
      logger.info({ event: 'abdm.mock.verify_hpr' }, 'ABDM mock HPR verification');
      return hprId.length > 5;
    }

    throw new Error('Not implemented for production. Requires NHA certification.');
  }

  async createIdentitySession(aadharOrMobile: string): Promise<string> {
    if (this.isMock) {
      void aadharOrMobile;
      logger.info({ event: 'abdm.mock.create_session' }, 'ABDM mock session create');
      return 'mock-session-txn-id';
    }

    throw new Error('Not implemented for production. Requires NHA certification.');
  }
}
