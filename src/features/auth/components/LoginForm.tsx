'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput, PhoneInputSchema, PhoneInput, OtpInputSchema, OtpInput } from '@/features/auth/schemas';
import { sendOtpAction } from '@/features/auth/actions';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

type AuthMode = 'phone' | 'email';

export default function LoginForm() {
  const [authMode, setAuthMode] = useState<AuthMode>('phone');
  const [otpSent, setOtpSent] = useState(false);
  const [activePhone, setActivePhone] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors, isSubmitting: isEmailSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Phone Step 1 Form
  const {
    register: registerPhone,
    handleSubmit: handleSubmitPhone,
    formState: { errors: phoneErrors },
  } = useForm<PhoneInput>({
    resolver: zodResolver(PhoneInputSchema),
    defaultValues: { phoneNumber: '' },
  });

  // OTP Step 2 Form
  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors, isSubmitting: isOtpSubmitting },
  } = useForm<OtpInput>({
    resolver: zodResolver(OtpInputSchema),
    defaultValues: { phoneNumber: '', otp: '123456' },
  });

  // 1. Dispatch OTP via Server Action
  const onSendOtp = async (data: PhoneInput) => {
    setServerError(null);
    setInfoMsg(null);
    setSendingOtp(true);

    try {
      const res = await sendOtpAction(data.phoneNumber);
      if (!res.success) {
        setServerError(res.error);
        return;
      }

      setActivePhone(data.phoneNumber);
      setOtpSent(true);
      if (res.data?.isRealSmsSent) {
        setInfoMsg(`📲 SMS verification OTP code sent to ${data.phoneNumber} via Telephony Gateway!`);
      } else {
        setInfoMsg(`OTP code sent to ${data.phoneNumber}. (Sandbox mode: Use OTP 123456)`);
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setServerError('Failed to dispatch OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // 2. Submit OTP to NextAuth Credentials authorize()
  const onVerifyOtp = async (data: OtpInput) => {
    setServerError(null);

    try {
      const result = await signIn('credentials', {
        phone: activePhone,
        otp: data.otp,
        isPhoneAuth: 'true',
        redirect: false,
      });

      if (!result || result.error) {
        if (result?.error === 'ACCOUNT_INACTIVE' || result?.error?.includes('ACCOUNT_INACTIVE')) {
          setServerError('Your account is currently inactive. Please contact the hospital administrator.');
        } else {
          setServerError('Invalid OTP code. Please enter 123456.');
        }
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl) {
        window.location.href = callbackUrl;
      } else {
        window.location.href = '/patient/dashboard';
      }
    } catch (err) {
      console.error('OTP login error:', err);
      setServerError('An unexpected error occurred during OTP verification.');
    }
  };

  // 3. Email + Password Login
  const onSubmitEmail = async (data: LoginInput) => {
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

      const searchParams = new URLSearchParams(window.location.search);
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl) {
        window.location.href = callbackUrl;
      } else {
        // Fetch session to determine role dashboard
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        const role = sessionData?.user?.role;
        if (role === 'DOCTOR') window.location.href = '/doctor/dashboard';
        else if (role === 'ADMIN') window.location.href = '/admin/dashboard';
        else if (role === 'PATIENT') window.location.href = '/patient/dashboard';
        else window.location.href = '/';
      }
    } catch (err) {
      console.error('Email login error:', err);
      setServerError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md rounded-card border border-[#dde5e9] bg-white p-8 shadow-card">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Welcome to CarePulse</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Sign in to view your medical records & appointments
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="mb-6 grid grid-cols-2 rounded-button bg-surface-muted p-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setAuthMode('phone');
            setServerError(null);
            setInfoMsg(null);
          }}
          className={`rounded-button py-2 transition duration-brand ${
            authMode === 'phone'
              ? 'bg-white text-brand-800 shadow-soft'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          📱 Patient Phone OTP
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode('email');
            setServerError(null);
            setInfoMsg(null);
          }}
          className={`rounded-button py-2 transition duration-brand ${
            authMode === 'email'
              ? 'bg-white text-brand-800 shadow-soft'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          ✉️ Email & Password
        </button>
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-4 rounded-button border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {serverError}
        </div>
      )}

      {infoMsg && (
        <div
          role="status"
          className="mb-4 rounded-button border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"
        >
          {infoMsg}
        </div>
      )}

      {/* TAB 1: PHONE + OTP PATIENT LOGIN */}
      {authMode === 'phone' && (
        <>
          {!otpSent ? (
            <form onSubmit={handleSubmitPhone(onSendOtp)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="phoneNumber" className="mb-1 block text-sm font-medium text-ink">
                  Patient Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  {...registerPhone('phoneNumber')}
                  className="input-field font-mono"
                  placeholder="+91 98765 43210"
                />
                {phoneErrors.phoneNumber && (
                  <p className="mt-1 text-xs text-rose-600">{phoneErrors.phoneNumber.message}</p>
                )}
                <p className="mt-1 text-[11px] text-ink-muted">
                  We will send a 6-digit verification OTP code to your phone.
                </p>
              </div>

              <button
                type="submit"
                disabled={sendingOtp}
                className="btn-primary mt-2 w-full"
              >
                {sendingOtp ? 'Sending OTP...' : 'Send OTP Verification Code'}
              </button>

              <div className="mt-3 flex items-center justify-between rounded-card border border-brand-200 bg-brand-50/70 p-3 text-xs text-brand-900">
                <span>Enter any 10-digit phone number. Default OTP: <strong className="font-mono text-brand-950 font-bold">123456</strong></span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitOtp(onVerifyOtp)} className="space-y-4" noValidate>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="otp" className="mb-1 block text-sm font-medium text-ink">
                    Enter 6-Digit OTP Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Change Phone
                  </button>
                </div>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  {...registerOtp('otp')}
                  className="input-field text-center font-mono text-lg tracking-widest"
                  placeholder="123456"
                />
                {otpErrors.otp && (
                  <p className="mt-1 text-xs text-rose-600">{otpErrors.otp.message}</p>
                )}
                <p className="mt-1 text-center text-[11px] font-semibold text-emerald-700">
                  Demo Test OTP: <code className="rounded bg-emerald-100 px-1 py-0.5 font-mono">123456</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={isOtpSubmitting}
                className="btn-primary mt-2 w-full"
              >
                {isOtpSubmitting ? 'Verifying OTP...' : 'Verify OTP & Access Patient Portal'}
              </button>
            </form>
          )}
        </>
      )}

      {/* TAB 2: EMAIL & PASSWORD STAFF/PATIENT LOGIN */}
      {authMode === 'email' && (
        <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...registerEmail('email')}
              className="input-field"
              placeholder="you@example.com"
            />
            {emailErrors.email && (
              <p className="mt-1 text-xs text-rose-600">{emailErrors.email.message}</p>
            )}
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
                {...registerEmail('password')}
                className="input-field pr-16"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-ink-muted hover:text-ink"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {emailErrors.password && (
              <p className="mt-1 text-xs text-rose-600">{emailErrors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isEmailSubmitting}
            className="btn-primary mt-2 w-full"
          >
            {isEmailSubmitting ? 'Signing in...' : 'Sign In with Password'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-sm text-ink-muted">
        Don&apos;t have a patient account?{' '}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Register as Patient
        </Link>
      </div>

      <div className="mt-6 space-y-2 rounded-card border border-[#dde5e9] bg-surface-muted p-4 text-xs text-ink-muted">
        <div className="mb-2 border-b border-[#dde5e9] pb-1 text-sm font-semibold text-ink">
          Demo Quick Login Credentials
        </div>
        <div className="flex items-center justify-between rounded-button border border-[#dde5e9] bg-white p-2">
          <div>
            <span className="font-medium text-brand-600">Patient Phone OTP:</span>{' '}
            <code className="rounded bg-surface-soft px-1 py-0.5 font-mono text-ink">
              +91 99999 11111
            </code>
          </div>
          <span className="font-mono text-emerald-700 font-bold">OTP: 123456</span>
        </div>
        <div className="flex items-center justify-between rounded-button border border-[#dde5e9] bg-white p-2">
          <div>
            <span className="font-medium text-brand-600">Patient Email:</span>{' '}
            <code className="rounded bg-surface-soft px-1 py-0.5 font-mono text-ink">
              patient.alice@example.com
            </code>
          </div>
          <span className="font-mono text-ink-soft">test123</span>
        </div>
        <div className="flex items-center justify-between rounded-button border border-[#dde5e9] bg-white p-2">
          <div>
            <span className="font-medium text-accent-700">Doctor Email:</span>{' '}
            <code className="rounded bg-surface-soft px-1 py-0.5 font-mono text-ink">
              dr.smith@hospital.com
            </code>
          </div>
          <span className="font-mono text-ink-soft">test123</span>
        </div>
        <div className="flex items-center justify-between rounded-button border border-[#dde5e9] bg-white p-2">
          <div>
            <span className="font-medium text-brand-800">Admin Email:</span>{' '}
            <code className="rounded bg-surface-soft px-1 py-0.5 font-mono text-ink">
              admin@hospital.com
            </code>
          </div>
          <span className="font-mono text-ink-soft">test123</span>
        </div>
      </div>
    </div>
  );
}

