'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="btn-danger !px-4 !py-2 !text-sm !font-medium"
    >
      Sign Out
    </button>
  );
}
