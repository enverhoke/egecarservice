'use client';

import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { nowIso } from '@/lib/helpers';
import { Customer } from '@/lib/types';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { FormEvent, useEffect, useMemo, useState } from 'react';

const initial = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  note: '',
};

export default function MusterilerPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Customer[]>([]);
  const [form, setForm] = useState(initial);
  const [search, setSearch] = useState('');

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'customers'), orderBy('createdAt', 'desc')),
      (snapshot) =>
        setItems(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Customer, 'id'>),
          }))
        )
    );
  }, []);

  const filtered = useMemo(() => {
    return items.filter((x) =>
      [x.firstName, x.lastName, x.phone, x.email]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search]);

  async function saveCustomer(e: FormEvent) {
    e.preventDefault();
    if (!profile || !form.firstName.trim() || !form.lastName.trim()) return;

    await addDoc(collection(db, 'customers'), {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      note: form.note,
      createdAt: nowIso(),
      createdByUid: profile.uid,
    });

    setForm(initial);
  }

  return (
    <AppShell title="Müşteriler" subtitle="Müşteri ekle, ara ve listele.">
      <section className="panel-grid">
        <form className="panel-card" onSubmit={saveCustomer}>
          <div className="panel-head">
            <h3>Yeni Müşteri</h3>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Ad *</span>
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Soyad *</span>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Telefon</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>

            <label className="field">
              <span>E-posta</span>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            <label className="field-full" style={{ gridColumn: '1 / -1' }}>
              <span>Not</span>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </label>
          </div>

          <button className="primary-btn" type="submit">
            Müşteriyi Kaydet
          </button>
        </form>

        <div className="panel-card">
          <div className="panel-head">
            <h3>Müşteri Listesi</h3>
            <input
              className="search-input"
              placeholder="Müşteri ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>Telefon</th>
                  <th>E-posta</th>
                  <th>Not</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.firstName} {item.lastName}
                    </td>
                    <td>{item.phone || '-'}</td>
                    <td>{item.email || '-'}</td>
                    <td>{item.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}