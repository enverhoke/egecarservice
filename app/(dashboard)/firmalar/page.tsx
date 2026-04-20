'use client';
import { RequireAuth } from '@/components/RequireAuth';

export default function FirmalarPage() {
  return (
    <RequireAuth allow={['admin']}>
      <FirmalarInner />
    </RequireAuth>
  );
}
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { nowIso } from '@/lib/helpers';
import { Firm } from '@/lib/types';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { FormEvent, useEffect, useMemo, useState } from 'react';

const initial = { name: '', managerName: '', phone: '', address: '', note: '', active: true };

export default function FirmalarPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Firm[]>([]);
  const [form, setForm] = useState(initial);
  const [search, setSearch] = useState('');

  useEffect(() => onSnapshot(query(collection(db, 'firms'), orderBy('createdAt', 'desc')), s => setItems(s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Firm,'id'>) })))), []);

  const filtered = useMemo(() => items.filter(x => [x.name, x.managerName, x.phone].join(' ').toLowerCase().includes(search.toLowerCase())), [items, search]);

  async function saveFirm(e: FormEvent) {
    e.preventDefault();
    if (!profile || !form.name.trim()) return;
    await addDoc(collection(db, 'firms'), {
      ...form,
      createdAt: nowIso(),
      createdByUid: profile.uid,
    });
    setForm(initial);
  }

  async function toggleActive(item: Firm) {
    await updateDoc(doc(db, 'firms', item.id), { active: !item.active });
  }

  async function removeFirm(id: string) {
    if (!confirm('Firma silinsin mi?')) return;
    await deleteDoc(doc(db, 'firms', id));
  }

  return (
    <AppShell title="Firmalar" subtitle="Firma ekle, ara ve yönetin.">
      <section className="panel-grid">
        <form className="panel-card" onSubmit={saveFirm}>
          <div className="panel-head"><h3>Yeni Firma</h3></div>
          <div className="form-grid">
            <label className="field"><span>Firma Adı *</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field"><span>Yetkili</span><input value={form.managerName} onChange={e => setForm({ ...form, managerName: e.target.value })} /></label>
            <label className="field"><span>Telefon</span><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="field"><span>Adres</span><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
            <label className="field"><span>Not</span><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
            <label className="field"><span>Durum</span><select value={form.active ? 'Aktif' : 'Pasif'} onChange={e => setForm({ ...form, active: e.target.value === 'Aktif' })}><option>Aktif</option><option>Pasif</option></select></label>
          </div>
          <button className="primary-btn" type="submit">Firmayı Kaydet</button>
        </form>

        <div className="panel-card">
          <div className="panel-head"><h3>Firma Listesi</h3><input className="search-input" placeholder="Firma ara..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="list-wrap company-list">
            {filtered.map(item => (
              <div className="company-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.managerName || '-'} · {item.phone || '-'}</p>
                </div>
                <div className="row">
                  <span className="pill">{item.active ? 'Aktif' : 'Pasif'}</span>
                  <button className="secondary-btn" onClick={() => toggleActive(item)} type="button">Durum</button>
                  {profile?.role === 'admin' && <button className="danger-btn" onClick={() => removeFirm(item.id)} type="button">Sil</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
