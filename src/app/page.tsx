import { auth } from '@/features/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role === 'ADMIN') {
    redirect('/admin/dashboard');
  }

  if (session.user.role === 'DOCTOR') {
    redirect('/doctor/dashboard');
  }

  redirect('/patient/dashboard');
}
