import { Prisma } from '@prisma/client';

/**
 * Builds tokenized fuzzy search conditions for Prisma queries.
 * Splits query string into word tokens and ensures every token matches
 * at least one target field (case-insensitive substring match).
 */
export function buildFuzzyDoctorWhere(search: string): Prisma.DoctorProfileWhereInput {
  if (!search || !search.trim()) return {};

  const tokens = search.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return {};

  // For each token, must match fullName, qualification, bio, email, phone, or department name
  const AND: Prisma.DoctorProfileWhereInput[] = tokens.map((token) => ({
    OR: [
      { fullName: { contains: token, mode: 'insensitive' } },
      { qualification: { contains: token, mode: 'insensitive' } },
      { bio: { contains: token, mode: 'insensitive' } },
      { phoneNumber: { contains: token, mode: 'insensitive' } },
      { user: { is: { email: { contains: token, mode: 'insensitive' } } } },
      { department: { is: { name: { contains: token, mode: 'insensitive' } } } },
    ],
  }));

  return { AND };
}

export function buildFuzzyDepartmentWhere(search: string): Prisma.DepartmentWhereInput {
  if (!search || !search.trim()) return {};

  const tokens = search.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return {};

  const AND: Prisma.DepartmentWhereInput[] = tokens.map((token) => ({
    OR: [
      { name: { contains: token, mode: 'insensitive' } },
      { description: { contains: token, mode: 'insensitive' } },
    ],
  }));

  return { AND };
}

export function buildFuzzyAppointmentWhere(search: string): Prisma.AppointmentWhereInput {
  if (!search || !search.trim()) return {};

  const tokens = search.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return {};

  const AND: Prisma.AppointmentWhereInput[] = tokens.map((token) => ({
    OR: [
      { patient: { is: { fullName: { contains: token, mode: 'insensitive' } } } },
      { patient: { is: { phoneNumber: { contains: token, mode: 'insensitive' } } } },
      { doctor: { is: { fullName: { contains: token, mode: 'insensitive' } } } },
      { doctor: { is: { department: { is: { name: { contains: token, mode: 'insensitive' } } } } } },
      { reason: { contains: token, mode: 'insensitive' } },
      { cancellationReason: { contains: token, mode: 'insensitive' } },
    ],
  }));

  return { AND };
}
