'use client';

import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { nowIso } from '@/lib/helpers';
import { Customer, Vehicle } from '@/lib/types';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { FormEvent, useEffect, useMemo, useState } from 'react';

const fuelOptions = ['Benzin', 'Dizel', 'LPG', 'Hybrid', 'Elektrik'];

const initial = {
  customerId: '',
  plate: '',
  brand: '',
  model: '',
  year: '',
  fuelType: '',
  chassisNo: '',
  engineNo: '',
  note: '',
};

export default function AraclarPage() {
  const { profile } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Vehicle[]>([]);
  const [form, setForm] = useState(initial);
  const [search, setSearch] = useState('');

  // müşterileri çek
  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'customers'), orderBy('createdAt', 'desc')),
      (snapshot) =>
        setCustomers(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Customer, 'id'>),
          }))
        )
    );
  }, []);

  // araçları çek
  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'vehicles'), orderBy('createdAt', 'desc')),
      (snapshot) =>
        setItems(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Vehicle, 'id'>),
          }))
        )
    );
  }, []);

  // müşteri map (isim gösterimi için)
  const customerMap = Object.fromEntries(
    customers.map((c) => [c.id, `${c.firstName} ${c.lastName}`])
  );

  // filtre
  const filtered = useMemo(() => {
    return items.filter((x) =>
      [x.plate, x.brand, x.model]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search]);

  async function saveVehicle(e: FormEvent) {
    e.preventDefault();

    if (
      !profile ||
      !form.customerId ||
      !form.plate.trim() ||
      !form.brand.trim() ||
      !form.model.trim()
    ) {
      return;
    }

    await addDoc(collection(db, 'vehicles'), {
      ...form,
      plate: form.plate.toUpperCase(),
      createdAt: nowIso(),
      createdByUid: profile.uid,
    });

    setForm(initial);
  }

  return (
    <AppShell title="Araçlar" subtitle="Müşterilere ait araçları ekle ve yönet.">
      <section className="panel-grid">
        <form className="panel-card" onSubmit={saveVehicle}>
          <div className="panel-head">
            <h3>Yeni Araç</h3>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Müşteri *</span>
              <select
                value={form.customerId}
                onChange={(e) =>
                  setForm({ ...form, customerId: e.target.value })
                }
              >
                <option value="">Seçiniz</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Plaka *</span>
              <input
                value={form.plate}
                onChange={(e) =>
                  setForm({ ...form, plate: e.target.value.toUpperCase() })
                }
              />
            </label>

            <label className="field">
              <span>Marka *</span>
              <input
                value={form.brand}
                onChange={(e) =>
                  setForm({ ...form, brand: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Model *</span>
              <input
                value={form.model}
                onChange={(e) =>
                  setForm({ ...form, model: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Yıl</span>
              <input
                value={form.year}
                onChange={(e) =>
                  setForm({ ...form, year: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Yakıt Tipi</span>
              <select
                value={form.fuelType}
                onChange={(e) =>
                  setForm({ ...form, fuelType: e.target.value })
                }
              >
                <option value="">Seçiniz</option>
                {fuelOptions.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Şasi No</span>
              <input
                value={form.chassisNo}
                onChange={(e) =>
                  setForm({ ...form, chassisNo: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Motor No</span>
              <input
                value={form.engineNo}
                onChange={(e) =>
                  setForm({ ...form, engineNo: e.target.value })
                }
              />
            </label>

            <label className="field-full" style={{ gridColumn: '1 / -1' }}>
              <span>Not</span>
              <textarea
                value={form.note}
                onChange={(e) =>
                  setForm({ ...form, note: e.target.value })
                }
              />
            </label>
          </div>

          <button className="primary-btn" type="submit">
            Aracı Kaydet
          </button>
        </form>

        <div className="panel-card">
          <div className="panel-head">
            <h3>Araç Listesi</h3>
            <input
              className="search-input"
              placeholder="Plaka / model ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plaka</th>
                  <th>Marka</th>
                  <th>Model</th>
                  <th>Yıl</th>
                  <th>Yakıt</th>
                  <th>Müşteri</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{item.plate}</td>
                    <td>{item.brand}</td>
                    <td>{item.model}</td>
                    <td>{item.year || '-'}</td>
                    <td>{item.fuelType || '-'}</td>
                    <td>{customerMap[item.customerId] || '-'}</td>
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