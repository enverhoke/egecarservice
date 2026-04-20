'use client';

import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { money, nowIso } from '@/lib/helpers';
import { Customer, ServiceRecord, Vehicle } from '@/lib/types';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { FormEvent, useEffect, useMemo, useState } from 'react';

const faultOptions: ServiceRecord['faultType'][] = [
  'Motor',
  'Şanzıman',
  'Mekanik',
  'Alt Takım',
  'Elektrik',
  'Yağ Bakım Benzinli',
  'Yağ Bakım Dizel',
  'Fren Sistemi',
  'Klima',
  'Lastik / Rot Balans',
  'Akü',
  'Diğer',
];

const initial = {
  customerId: '',
  vehicleId: '',
  date: '',
  faultType: 'Motor' as ServiceRecord['faultType'],
  description: '',
  status: '',
  kilometer: 0,
  partCost: 0,
  laborCost: 0,
  totalCost: 0,
  tested: false,
  delivered: false,
};

export default function ServisKayitlariPage() {
  const { profile } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [items, setItems] = useState<ServiceRecord[]>([]);
  const [form, setForm] = useState(initial);

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

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'vehicles'), orderBy('createdAt', 'desc')),
      (snapshot) =>
        setVehicles(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Vehicle, 'id'>),
          }))
        )
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'service_records'), orderBy('createdAt', 'desc')),
      (snapshot) =>
        setItems(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ServiceRecord, 'id'>),
          }))
        )
    );
  }, []);

  const customerMap = Object.fromEntries(
    customers.map((c) => [c.id, `${c.firstName} ${c.lastName}`])
  );

  const vehicleMap = Object.fromEntries(
    vehicles.map((v) => [v.id, v])
  );

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => v.customerId === form.customerId);
  }, [vehicles, form.customerId]);

  async function save(e: FormEvent) {
    e.preventDefault();

    if (
      !profile ||
      !form.customerId ||
      !form.vehicleId ||
      !form.date ||
      !form.faultType
    ) {
      return;
    }

    await addDoc(collection(db, 'service_records'), {
      customerId: form.customerId,
      vehicleId: form.vehicleId,
      date: form.date,
      faultType: form.faultType,
      description: form.description,
      status: form.status,
      kilometer: Number(form.kilometer || 0),
      partCost: Number(form.partCost || 0),
      laborCost: Number(form.laborCost || 0),
      totalCost: Number(form.totalCost || 0),
      tested: form.tested,
      delivered: form.delivered,
      createdAt: nowIso(),
      createdByUid: profile.uid,
      createdByName: `${profile.firstName} ${profile.lastName}`,
    });

    setForm(initial);
  }

  function printItem(item: ServiceRecord) {
    const customerName = customerMap[item.customerId] || '-';
    const vehicle = vehicleMap[item.vehicleId];

    const w = window.open('', '_blank');
    if (!w) return;

    w.document.write(`
      <html>
        <head>
          <title>Servis Formu</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h2 { margin-bottom: 16px; }
            .row { margin-bottom: 8px; }
            .label { font-weight: bold; }
            .box { border: 1px solid #ccc; padding: 16px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h2>Servis Formu</h2>
          <div class="box">
            <div class="row"><span class="label">Müşteri:</span> ${customerName}</div>
            <div class="row"><span class="label">Tarih:</span> ${item.date || '-'}</div>
            <div class="row"><span class="label">Plaka:</span> ${vehicle?.plate || '-'}</div>
            <div class="row"><span class="label">Marka:</span> ${vehicle?.brand || '-'}</div>
            <div class="row"><span class="label">Model:</span> ${vehicle?.model || '-'}</div>
            <div class="row"><span class="label">Yıl:</span> ${vehicle?.year || '-'}</div>
            <div class="row"><span class="label">Yakıt:</span> ${vehicle?.fuelType || '-'}</div>
            <div class="row"><span class="label">Arıza Türü:</span> ${item.faultType || '-'}</div>
            <div class="row"><span class="label">Açıklama:</span> ${item.description || '-'}</div>
            <div class="row"><span class="label">Durum:</span> ${item.status || '-'}</div>
            <div class="row"><span class="label">Kilometre:</span> ${item.kilometer || 0}</div>
            <div class="row"><span class="label">Parça Tutarı:</span> ${item.partCost || 0} TL</div>
            <div class="row"><span class="label">İşçilik:</span> ${item.laborCost || 0} TL</div>
            <div class="row"><span class="label">Toplam:</span> ${item.totalCost || 0} TL</div>
            <div class="row"><span class="label">Test:</span> ${item.tested ? 'Evet' : 'Hayır'}</div>
            <div class="row"><span class="label">Teslim:</span> ${item.delivered ? 'Evet' : 'Hayır'}</div>
            <div class="row"><span class="label">Kaydı Giren:</span> ${item.createdByName || '-'}</div>
          </div>
        </body>
      </html>
    `);

    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <AppShell title="Servis Kayıtları" subtitle="Müşteri ve araca göre servis kaydı oluştur.">
      <section className="panel-grid">
        <form className="panel-card" onSubmit={save}>
          <div className="panel-head">
            <h3>Yeni Servis Kaydı</h3>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Müşteri *</span>
              <select
                value={form.customerId}
                onChange={(e) =>
                  setForm({ ...form, customerId: e.target.value, vehicleId: '' })
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
              <span>Araç *</span>
              <select
                value={form.vehicleId}
                onChange={(e) =>
                  setForm({ ...form, vehicleId: e.target.value })
                }
              >
                <option value="">Seçiniz</option>
                {filteredVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} - {v.brand} {v.model}
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
              <span>Kilometre</span>
              <input
                type="number"
                value={form.kilometer}
                onChange={(e) =>
                  setForm({ ...form, kilometer: Number(e.target.value) })
                }
              />
            </label>

            <label className="field-full" style={{ gridColumn: '1 / -1' }}>
              <span>Arıza Türü *</span>
              <select
                value={form.faultType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    faultType: e.target.value as ServiceRecord['faultType'],
                  })
                }
              >
                {faultOptions.map((fault) => (
                  <option key={fault} value={fault}>
                    {fault}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-full" style={{ gridColumn: '1 / -1' }}>
              <span>Açıklama</span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Durum</span>
              <input
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                placeholder="örn: işlem tamamlandı"
              />
            </label>

            <label className="field">
              <span>Parça Tutarı</span>
              <input
                type="number"
                value={form.partCost}
                onChange={(e) =>
                  setForm({ ...form, partCost: Number(e.target.value) })
                }
              />
            </label>

            <label className="field">
              <span>İşçilik</span>
              <input
                type="number"
                value={form.laborCost}
                onChange={(e) =>
                  setForm({ ...form, laborCost: Number(e.target.value) })
                }
              />
            </label>

            <label className="field">
              <span>Toplam</span>
              <input
                type="number"
                value={form.totalCost}
                onChange={(e) =>
                  setForm({ ...form, totalCost: Number(e.target.value) })
                }
              />
            </label>

            <label className="field">
              <span>Test</span>
              <select
                value={form.tested ? 'Evet' : 'Hayır'}
                onChange={(e) =>
                  setForm({ ...form, tested: e.target.value === 'Evet' })
                }
              >
                <option>Hayır</option>
                <option>Evet</option>
              </select>
            </label>

            <label className="field">
              <span>Teslim</span>
              <select
                value={form.delivered ? 'Evet' : 'Hayır'}
                onChange={(e) =>
                  setForm({ ...form, delivered: e.target.value === 'Evet' })
                }
              >
                <option>Hayır</option>
                <option>Evet</option>
              </select>
            </label>
          </div>

          <button className="primary-btn" type="submit">
            Servis Kaydet
          </button>
        </form>

        <div className="panel-card">
          <div className="panel-head">
            <h3>Son Servisler</h3>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Müşteri</th>
                  <th>Plaka</th>
                  <th>Araç</th>
                  <th>Arıza</th>
                  <th>Tutar</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const vehicle = vehicleMap[item.vehicleId];
                  return (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td>{customerMap[item.customerId] || '-'}</td>
                      <td>{vehicle?.plate || '-'}</td>
                      <td>
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : '-'}
                      </td>
                      <td>{item.faultType}</td>
                      <td>{money(item.totalCost || 0)}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => printItem(item)}
                        >
                          Yazdır
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}