'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput } from '@/features/auth/schemas';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
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
          setServerError('Your account is currently inactive. Please contact the hospital administrator.');
        } else {
          setServerError('Invalid email or password.');
        }
        return;
      }

      // Successful login -> Full redirect to trigger middleware role routing
      window.location.href = '/';
    } catch (err) {
      console.error('Login submit error:', err);
      setServerError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to access your Hospital Appointment account
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 hover:text-slate-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have a patient account?{' '}
          <Link
            href="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            Register as Patient
          </Link>
        </div>

        {/* Demo Credentials Helper Box */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2">
          <div className="font-semibold text-slate-900 text-sm border-b border-slate-200 pb-1 mb-2">
            🔑 Demo Login Credentials
          </div>
          <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
            <div>
              <span className="font-medium text-purple-700">Admin:</span>{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">admin@hospital.com</code>
            </div>
            <span className="font-mono text-slate-500">test123</span>
          </div>
          <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
            <div>
              <span className="font-medium text-emerald-700">Doctor:</span>{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">dr.smith@hospital.com</code>
            </div>
            <span className="font-mono text-slate-500">test123</span>
          </div>
          <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
            <div>
              <span className="font-medium text-blue-700">Patient:</span>{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">patient.alice@example.com</code>
            </div>
            <span className="font-mono text-slate-500">test123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
