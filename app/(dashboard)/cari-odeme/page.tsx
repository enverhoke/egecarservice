'use client';

import { AppShell } from '@/components/AppShell';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { money, nowIso } from '@/lib/helpers';
import { Firm, PaymentRecord } from '@/lib/types';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { FormEvent, useEffect, useMemo, useState } from 'react';

const initial = {
  firmId: '',
  date: '',
  type: 'alinan' as PaymentRecord['type'],
  amount: 0,
  note: '',
};

export default function CariOdemePage() {
  return (
    <RequireAuth allow={['admin']}>
      <CariOdemeInner />
    </RequireAuth>
  );
}

function CariOdemeInner() {
  const { profile } = useAuth();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [items, setItems] = useState<PaymentRecord[]>([]);
  const [form, setForm] = useState(initial);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'firms'), orderBy('name', 'asc')),
      (snapshot) =>
        setFirms(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Firm, 'id'>),
          }))
        )
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'payments'), orderBy('createdAt', 'desc')),
      (snapshot) =>
        setItems(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PaymentRecord, 'id'>),
          }))
        )
    );
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!profile || !form.firmId || !form.date || form.amount <= 0) return;

    await addDoc(collection(db, 'payments'), {
      ...form,
      amount: Number(form.amount),
      createdAt: nowIso(),
      createdByUid: profile.uid,
      createdByName: `${profile.firstName} ${profile.lastName}`,
    });

    setForm(initial);
  }

  const summary = useMemo(() => {
    return firms.map((f) => {
      const records = items.filter((x) => x.firmId === f.id);
      const alinan = records
        .filter((x) => x.type === 'alinan')
        .reduce((s, x) => s + x.amount, 0);
      const verilen = records
        .filter((x) => x.type !== 'alinan')
        .reduce((s, x) => s + x.amount, 0);

      return {
        firm: f,
        alinan,
        verilen,
        bakiye: alinan - verilen,
      };
    });
  }, [firms, items]);

  const firmMap = Object.fromEntries(firms.map((f) => [f.id, f.name]));

  return (
    <AppShell title="Cari / Ödeme" subtitle="Alınan, verilen ve veresiye hareketlerini kaydet.">
      <section className="panel-grid">
        <form className="panel-card" onSubmit={save}>
          <div className="panel-head">
            <h3>Yeni Cari Hareket</h3>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Firma *</span>
              <select
                value={form.firmId}
                onChange={(e) => setForm({ ...form, firmId: e.target.value })}
              >
                <option value="">Seçiniz</option>
                {firms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Tarih *</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Tip</span>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as PaymentRecord['type'] })
                }
              >
                <option value="alinan">Firmadan Alınan</option>
                <option value="verilen">Firmaya Verilen</option>
                <option value="veresiye">Veresiye</option>
                <option value="borc-kapatma">Borç Kapatma</option>
              </select>
            </label>

            <label className="field">
              <span>Tutar *</span>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
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
            Kaydet
          </button>
        </form>

        <div className="panel-card">
          <div className="panel-head">
            <h3>Firma Cari Özeti</h3>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>Alınan</th>
                  <th>Verilen</th>
                  <th>Bakiye</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((r) => (
                  <tr key={r.firm.id}>
                    <td>{r.firm.name}</td>
                    <td>{money(r.alinan)}</td>
                    <td>{money(r.verilen)}</td>
                    <td className={r.bakiye >= 0 ? 'kpi-ok' : 'kpi-bad'}>
                      {money(r.bakiye)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-head">
          <h3>Son Hareketler</h3>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Firma</th>
                <th>Tip</th>
                <th>Tutar</th>
                <th>Not</th>
                <th>Giren</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>{firmMap[item.firmId] || '-'}</td>
                  <td>{item.type}</td>
                  <td>{money(item.amount)}</td>
                  <td>{item.note || '-'}</td>
                  <td>{item.createdByName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
