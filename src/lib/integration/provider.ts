import { IHealthIdentityAdapter, IConsentManagerAdapter, IHealthDataExchangeAdapter } from './core/interfaces';
import { AbdmIdentityAdapter } from './adapters/abdm/AbdmIdentityAdapter';
import { AbdmConsentAdapter } from './adapters/abdm/AbdmConsentAdapter';
import { AbdmDataExchangeAdapter } from './adapters/abdm/AbdmDataExchangeAdapter';

// In the future, this can be driven by a DB setting or environment variable.
const INTEGRATION_MODE = process.env.HEALTHCARE_INTEGRATION_MODE || 'ABDM_MOCK';

export function getIdentityAdapter(): IHealthIdentityAdapter {
  if (INTEGRATION_MODE === 'ABDM') {
    // Return production ABDM adapter
    return new AbdmIdentityAdapter();
  }
  
  // Return a mock or sandbox implementation by default
  return new AbdmIdentityAdapter(true);
}

export function getConsentAdapter(): IConsentManagerAdapter {
  return new AbdmConsentAdapter(INTEGRATION_MODE !== 'ABDM');
}

export function getDataExchangeAdapter(): IHealthDataExchangeAdapter {
  return new AbdmDataExchangeAdapter(INTEGRATION_MODE !== 'ABDM');
}
