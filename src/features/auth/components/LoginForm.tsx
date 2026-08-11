'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput } from '@/features/auth/schemas';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!result || result.error) {
        if (result?.error === 'ACCOUNT_INACTIVE' || result?.error?.includes('ACCOUNT_INACTIVE')) {
          setServerError(
            'Your account is currently inactive. Please contact the hospital administrator.'
          );
        } else {
          setServerError('Invalid email or password.');
        }
        return;
      }

      window.location.href = '/';
    } catch (err) {
      console.error('Login submit error:', err);
      setServerError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md rounded-card border border-[#dde5e9] bg-white p-8 shadow-card">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Welcome Back</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Sign in to access your Hospital Appointment account
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
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="input-field"
            placeholder="you@example.com"
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
              autoComplete="current-password"
              {...register('password')}
              className="input-field pr-16"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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

        <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 w-full">
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-ink-muted">
        Don&apos;t have a patient account?{' '}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Register as Patient
        </Link>
      </div>

      <div className="mt-6 space-y-2 rounded-card border border-[#dde5e9] bg-surface-muted p-4 text-xs text-ink-muted">
        <div className="mb-2 border-b border-[#dde5e9] pb-1 text-sm font-semibold text-ink">
          Demo Login Credentials
        </div>
        <div className="flex items-center justify-between rounded-button border border-[#dde5e9] bg-white p-2">
          <div>
            <span className="font-medium text-brand-800">Admin:</span>{' '}
            <code className="rounded bg-surface-soft px-1 py-0.5 font-mono text-ink">
              admin@hospital.com
            </code>
          </div>
          <span className="font-mono text-ink-soft">test123</span>
        </div>
        <div className="flex items-center justify-between rounded-button border border-[#dde5e9] bg-white p-2">
          <div>
            <span className="font-medium text-accent-700">Doctor:</span>{' '}
            <code className="rounded bg-surface-soft px-1 py-0.5 font-mono text-ink">
              dr.smith@hospital.com
            </code>
          </div>
          <span className="font-mono text-ink-soft">test123</span>
        </div>
        <div className="flex items-center justify-between rounded-button border border-[#dde5e9] bg-white p-2">
          <div>
            <span className="font-medium text-brand-600">Patient:</span>{' '}
            <code className="rounded bg-surface-soft px-1 py-0.5 font-mono text-ink">
              patient.alice@example.com
            </code>
          </div>
          <span className="font-mono text-ink-soft">test123</span>
        </div>
      </div>
    </div>
  );
}
