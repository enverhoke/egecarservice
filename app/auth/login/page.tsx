'use client';

import { auth, db } from '@/lib/firebase';
import { appEmailFromUsername } from '@/lib/helpers';
import { doc, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { AppSettings } from '@/lib/types';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ systemName: 'Ege Car Service' });
  const [setup, setSetup] = useState({ firstName: '', lastName: '', username: '', password: '' });
  const [setupMsg, setSetupMsg] = useState('');
  const router = useRouter();
 
  useEffect(() => onSnapshot(doc(db, 'settings', 'system'), (snap) => {
    if (snap.exists()) setSettings(snap.data() as AppSettings);
  }), []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, appEmailFromUsername(username), password);
     router.replace('/anasayfa');
    } catch {
      setError('Kullanıcı adı veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  }

  async function bootstrap(e: FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/bootstrap-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(setup) });
    const data = await res.json();
    setSetupMsg(data.message || data.error || 'İşlem tamamlandı');
  }

  return (
    <main className="auth-shell">
      <div className="row" style={{ alignItems: 'flex-start', width: 'min(980px, 100%)' }}>
        <form className="auth-card" onSubmit={onSubmit}>
          <div className="logo-preview">
            {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" /> : <div className="brand-icon"><div className="brand-icon-fallback">ECS</div></div>}
            <div>
              <h1 className="title">{settings.systemName || 'Ege Car Service'}</h1>
              <p className="subtitle">Admin ve personel giriş ekranı</p>
            </div>
          </div>

          <label className="field-full">
            <span>Kullanıcı Adı</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ornek: enderhoke" />
          </label>
          <label className="field-full">
            <span>Şifre</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error ? <div className="alert">{error}</div> : null}
          <button className="primary-btn" disabled={loading} type="submit">{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</button>
        </form>

      </div>
    </main>
  );
}
