'use client';

import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { FormEvent, useState } from 'react';

export default function SifrePage() {
  const { firebaseUser } = useAuth();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = await firebaseUser?.getIdToken();
    const res = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setMessage(data.message || data.error || 'İşlem tamamlandı');
    if (!data.error) setPassword('');
  }

  return (
    <AppShell title="Şifre Değiştir" subtitle="Kendi giriş şifreni buradan değiştirebilirsin.">
      {message ? <div className="alert">{message}</div> : null}
      <form className="panel-card" onSubmit={onSubmit}>
        <div className="panel-head"><h3>Yeni Şifre</h3></div>
        <label className="field-full"><span>Yeni Şifre</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button className="primary-btn" type="submit">Şifreyi Güncelle</button>
      </form>
    </AppShell>
  );
}
