'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { BusyLabel } from '@/components/ui/Spinner';

export default function LogoutButton() {
  const [signingOut, setSigningOut] = useState(false);

  return (
    <button
      onClick={() => {
        setSigningOut(true);
        void signOut({ callbackUrl: '/login' });
      }}
      disabled={signingOut}
      className="btn-danger !px-4 !py-2 !text-sm !font-medium"
    >
      {signingOut ? <BusyLabel>Signing out...</BusyLabel> : 'Sign Out'}
    </button>
  );
}
