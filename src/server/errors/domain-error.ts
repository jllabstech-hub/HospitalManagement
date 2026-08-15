export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'DOCTOR_UNAVAILABLE'
  | 'SLOT_NOT_AVAILABLE'
  | 'APPOINTMENT_IN_PAST'
  | 'INVALID_STATUS_TRANSITION'
  | 'CONFLICT'
  | 'DATABASE_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'TENANT_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'CONFIGURATION_ERROR'
  | 'DATABASE_GUARD_VIOLATION'
  | 'STORAGE_UNCONFIGURED'
  | 'PRODUCTION_CONFIG_INVALID';

export class DomainError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public userMessage?: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
