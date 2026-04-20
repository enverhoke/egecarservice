'use client';

import { AppShell } from '@/components/AppShell';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/components/AuthProvider';
import { db, storage } from '@/lib/firebase';
import { AppSettings } from '@/lib/types';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { FormEvent, useEffect, useState } from 'react';

export default function AyarlarPage() {
  return <RequireAuth allow={['admin']}><SettingsInner /></RequireAuth>;
}

function SettingsInner() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({ systemName: 'Ege Car Service' });
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => onSnapshot(doc(db, 'settings', 'system'), (snap) => {
    if (snap.exists()) setSettings(snap.data() as AppSettings);
  }), []);

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      let logoUrl = settings.logoUrl;
      if (file) {
        const storageRef = ref(storage, `logos/system-logo-${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        logoUrl = await getDownloadURL(storageRef);
      }
      await setDoc(doc(db, 'settings', 'system'), {
        ...settings,
        logoUrl,
        updatedAt: new Date().toISOString(),
        updatedBy: profile.uid,
      }, { merge: true });
      setMessage('Ayarlar kaydedildi.');
      setFile(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Ayarlar" subtitle="Sistem adı ve logo ayarlarını admin yönetir.">
      {message ? <div className="alert">{message}</div> : null}
      <form className="panel-card" onSubmit={saveSettings}>
        <div className="panel-head"><h3>Genel Ayarlar</h3></div>
        <div className="form-grid">
          <label className="field"><span>Sistem Adı</span><input value={settings.systemName || ''} onChange={e => setSettings({ ...settings, systemName: e.target.value })} /></label>
          <div className="upload-box">
            <span className="text-muted">Sistem Logosu</span>
            {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" style={{ width: 180, borderRadius: 16, border: '1px solid var(--border)' }} /> : <div className="text-muted">Henüz logo yok.</div>}
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <div className="row"><button className="primary-btn" disabled={saving} type="submit">{saving ? 'Kaydediliyor...' : 'Kaydet'}</button></div>
      </form>
    </AppShell>
  );
}
