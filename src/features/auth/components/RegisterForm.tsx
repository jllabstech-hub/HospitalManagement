'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterInput } from '@/features/auth/schemas';
import { registerPatientAction } from '@/features/auth/actions';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BusyLabel } from '@/components/ui/Spinner';

export default function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);

    const res = await registerPatientAction(data);

    if (!res.success) {
      setServerError(res.error);
      return;
    }

    const loginRes = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (loginRes?.error) {
      router.push('/login');
    } else {
      router.refresh();
      router.push('/patient/dashboard');
    }
  };

  return (
    <div className="w-full max-w-md rounded-card border border-[#dde5e9] bg-white p-8 shadow-card">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Patient Registration</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Create an account to book and manage medical appointments
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-4 rounded-button border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-ink">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            {...register('fullName')}
            className="input-field"
            placeholder="Jane Doe"
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-rose-600">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="input-field"
            placeholder="jane.doe@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password')}
              className="input-field pr-16"
              placeholder="Minimum 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-ink-muted hover:text-ink"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-ink">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="input-field"
            placeholder="Repeat password"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 w-full">
          {isSubmitting ? <BusyLabel>Creating Account...</BusyLabel> : 'Register'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-ink-muted">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
