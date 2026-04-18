'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { AppSettings } from '@/lib/types';

const navItems = [
  { href: '/anasayfa', label: 'Ana Sayfa' },
  { href: '/firmalar', label: 'Firmalar' },
  { href: '/servis-kayitlari', label: 'Servis Kayıtları' },
  { href: '/cari-odeme', label: 'Cari / Ödeme' },
  { href: '/sifre', label: 'Şifre Değiştir' },
  { href: '/kullanicilar', label: 'Kullanıcılar', adminOnly: true },
  { href: '/ayarlar', label: 'Ayarlar', adminOnly: true },
];

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({ systemName: 'Ege Car Service' });

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'system'), (snap) => {
      if (snap.exists()) setSettings(snap.data() as AppSettings);
    });
  }, []);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/anasayfa" className="brand-block">
          <div className="brand-icon">
            {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" /> : <div className="brand-icon-fallback">ECS</div>}
          </div>
          <div className="brand-text">
            <h1>{settings.systemName || 'Ege Car Service'}</h1>
            <p>Tamir, bakım ve cari takip paneli</p>
          </div>
        </Link>

        <nav className="nav-list">
          {navItems
            .filter((item) => !item.adminOnly || profile?.role === 'admin')
            .map((item) => (
              <Link key={item.href} href={item.href} className={pathname === item.href ? 'nav-btn active' : 'nav-btn'}>
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="sidebar-actions">
          <button className="secondary-btn" onClick={logout}>Çıkış Yap</button>
        </div>
      </aside>

      <section className="content">
        <div className="top-user">
          <span className="pill">{profile?.role === 'admin' ? 'Admin' : 'Personel'}</span>
          <span><strong>{profile?.firstName} {profile?.lastName}</strong> · {profile?.username}</span>
        </div>
        <header className="topbar">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
