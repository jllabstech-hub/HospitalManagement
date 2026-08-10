export const PUBLISHED_FILTER = { contentStatus: 'PUBLISHED' as const };

export const ACTIVE_PUBLISHED_FILTER = {
  ...PUBLISHED_FILTER,
  isActive: true,
} as const;
