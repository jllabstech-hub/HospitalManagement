import { IHealthIdentityAdapter } from '../../core/interfaces';

export class AbdmIdentityAdapter implements IHealthIdentityAdapter {
  private isMock: boolean;

  constructor(isMock: boolean = false) {
    this.isMock = isMock;
  }

  async verifyIdentity(abhaAddress: string): Promise<boolean> {
    if (this.isMock) {
      console.log(`[ABDM MOCK] Verifying ABHA Address: ${abhaAddress}`);
      return abhaAddress.includes('@abdm');
    }

    // TODO: Milestone 1 - Implement ABDM Gateway /v1/searchByHealthId API
    throw new Error('Not implemented for production. Requires NHA certification.');
  }

  async verifyHprId(hprId: string): Promise<boolean> {
    if (this.isMock) {
      console.log(`[ABDM MOCK] Verifying HPR ID: ${hprId}`);
      return hprId.length > 5;
    }

    // TODO: Milestone 1 - Implement Healthcare Professionals Registry API
    throw new Error('Not implemented for production. Requires NHA certification.');
  }

  async createIdentitySession(aadharOrMobile: string): Promise<string> {
    if (this.isMock) {
      console.log(`[ABDM MOCK] Creating ABHA session for: ${aadharOrMobile}`);
      return 'mock-session-txn-id';
    }

    // TODO: Milestone 1 - Implement /v1/registration/mobile/generateOtp API
    throw new Error('Not implemented for production. Requires NHA certification.');
  }
}
