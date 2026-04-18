'use client';

import { useAuth } from './AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@/lib/types';

export function RequireAuth({ children, allow }: { children: React.ReactNode; allow?: UserRole[] }) {
  const { loading, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!profile || !profile.active) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (allow && !allow.includes(profile.role)) {
      router.replace('/anasayfa');
    }
  }, [loading, profile, allow, router, pathname]);

  if (loading || !profile) {
    return <main className="auth-shell"><div className="auth-card">Yükleniyor...</div></main>;
  }

  return <>{children}</>;
}
