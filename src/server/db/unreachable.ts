export function isDatabaseUnreachable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { name?: string; code?: string; message?: string };
  return (
    maybe.name === 'PrismaClientInitializationError' ||
    maybe.code === 'P1001' ||
    maybe.code === 'P1002' ||
    maybe.code === 'P1017' ||
    /Can't reach database server/i.test(maybe.message || '')
  );
}
