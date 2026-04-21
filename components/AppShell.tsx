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
  { href: '/musteriler', label: 'Müşteriler' },
  { href: '/araclar', label: 'Araçlar' },
  { href: '/sifre', label: 'Şifre Değiştir' },
  { href: '/cari-odeme', label: 'Cari / Ödeme', adminOnly: true },
  { href: '/kullanicilar', label: 'Kullanıcılar', adminOnly: true },
  { href: '/ayarlar', label: 'Ayarlar', adminOnly: true },
];

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({
    systemName: 'Ege Car Service',
  });

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'system'), (snap) => {
      if (snap.exists()) setSettings(snap.data() as AppSettings);
    });
  }, []);

  return (
    <main className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <Link href="/anasayfa" className="brand-block">
          <div className="brand-icon">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" />
            ) : (
              <div className="brand-icon-fallback">ECS</div>
            )}
          </div>

          <div className="brand-text">
            <h1>{settings.systemName || 'Ege Car Service'}</h1>
            <p>Servis yönetim paneli</p>
          </div>
        </Link>

        <nav className="nav-list">
          {navItems
            .filter(
              (item) => !item.adminOnly || profile?.role === 'admin'
            )
            .map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-btn ${active ? 'active' : ''}`}
                >
                  <span className="nav-indicator" />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-box">
            <div className="user-avatar">
              {profile?.firstName?.[0] || 'U'}
            </div>
            <div>
              <strong>
                {profile?.firstName} {profile?.lastName}
              </strong>
              <span>{profile?.username}</span>
            </div>
          </div>

          <button className="secondary-btn logout-btn" onClick={logout}>
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <section className="content">
        <header className="topbar modern-topbar">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="topbar-right">
            <span className="pill">
              {profile?.role === 'admin' ? 'Admin' : 'Personel'}
            </span>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}
