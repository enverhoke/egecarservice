'use client';

import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { RequireAuth } from '@/components/RequireAuth';
import { auth, db } from '@/lib/firebase';
import { AppUser, UserRole } from '@/lib/types';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { FormEvent, useEffect, useState } from 'react';

const initial = { firstName: '', lastName: '', username: '', password: '', role: 'personel' as UserRole };

export default function KullanicilarPage() {
  return (
    <RequireAuth allow={['admin']}>
      <UsersInner />
    </RequireAuth>
  );
}

function UsersInner() {
  const { firebaseUser } = useAuth();
  const [items, setItems] = useState<AppUser[]>([]);
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState('');

  useEffect(() => onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), s => setItems(s.docs.map(d => d.data() as AppUser))), []);

  async function withAuth(path: string, body: object) {
    const token = await firebaseUser?.getIdToken();
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    return res.json();
  }

  async function createUser(e: FormEvent) {
    e.preventDefault();
    const result = await withAuth('/api/admin/users', form);
    setMessage(result.message || result.error || 'İşlem tamamlandı');
    if (!result.error) setForm(initial);
  }

  async function toggleActive(uid: string, active: boolean) {
    const result = await withAuth('/api/admin/users', { action: 'toggle-active', uid, active: !active });
    setMessage(result.message || result.error || 'Durum güncellendi');
  }

  async function resetPassword(uid: string) {
    const newPassword = prompt('Yeni şifreyi yazın');
    if (!newPassword) return;
    const result = await withAuth('/api/admin/users', { action: 'reset-password', uid, password: newPassword });
    setMessage(result.message || result.error || 'Şifre değiştirildi');
  }

  async function deleteUser(uid: string) {
    if (!confirm('Kullanıcı silinsin mi?')) return;
    const result = await withAuth('/api/admin/users', { action: 'delete', uid });
    setMessage(result.message || result.error || 'Kullanıcı silindi');
  }

  return (
    <AppShell title="Kullanıcılar" subtitle="Admin kullanıcı ekler, şifre değiştirir ve erişim yönetir.">
      {message ? <div className="alert">{message}</div> : null}
      <section className="panel-grid">
        <form className="panel-card" onSubmit={createUser}>
          <div className="panel-head"><h3>Yeni Kullanıcı</h3></div>
          <div className="form-grid">
            <label className="field"><span>Ad</span><input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></label>
            <label className="field"><span>Soyad</span><input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></label>
            <label className="field"><span>Kullanıcı Adı</span><input value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase() })} /></label>
            <label className="field"><span>Şifre</span><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
            <label className="field"><span>Rol</span><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}><option value="personel">Personel</option><option value="admin">Admin</option></select></label>
          </div>
          <button className="primary-btn" type="submit">Kullanıcı Ekle</button>
        </form>
        <div className="panel-card">
          <div className="panel-head"><h3>Kullanıcı Listesi</h3></div>
          <div className="table-wrap"><table><thead><tr><th>Ad Soyad</th><th>Kullanıcı</th><th>Rol</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>
            {items.map(item => <tr key={item.uid}><td>{item.firstName} {item.lastName}</td><td>{item.username}</td><td>{item.role}</td><td>{item.active ? 'Aktif' : 'Pasif'}</td><td><div className="row"><button className="secondary-btn" onClick={() => toggleActive(item.uid, item.active)} type="button">Durum</button><button className="secondary-btn" onClick={() => resetPassword(item.uid)} type="button">Şifre</button><button className="danger-btn" onClick={() => deleteUser(item.uid)} type="button">Sil</button></div></td></tr>)}
          </tbody></table></div>
        </div>
      </section>
    </AppShell>
  );
}
