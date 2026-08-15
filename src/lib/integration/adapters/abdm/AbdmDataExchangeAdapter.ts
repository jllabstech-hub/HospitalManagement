import { IHealthDataExchangeAdapter } from '../../core/interfaces';
import { logger } from '@/lib/logger';

export class AbdmDataExchangeAdapter implements IHealthDataExchangeAdapter {
  private isMock: boolean;

  constructor(isMock: boolean = false) {
    this.isMock = isMock;
  }

  async linkCareContext(patientId: string, visitId: string): Promise<void> {
    if (this.isMock) {
      void patientId;
      void visitId;
      logger.info({ event: 'abdm.mock.link_care_context' }, 'ABDM mock care context link');
      return;
    }

    throw new Error('Not implemented for production. Requires NHA certification.');
  }

  async fetchHealthData(consentArtifactId: string): Promise<Record<string, unknown>[]> {
    if (this.isMock) {
      void consentArtifactId;
      logger.info({ event: 'abdm.mock.fetch_health_data' }, 'ABDM mock health data fetch');
      return [{ resourceType: 'Bundle', entry: [] }];
    }

    throw new Error('Not implemented for production. Requires NHA certification.');
  }
}
