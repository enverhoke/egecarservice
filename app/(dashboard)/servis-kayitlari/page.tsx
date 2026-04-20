'use client';

import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { money, nowIso } from '@/lib/helpers';
import { ServiceRecord } from '@/lib/types';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { FormEvent, useEffect, useState } from 'react';

const brandOptions = [
  'Ford',
  'Fiat',
  'Renault',
  'Volkswagen',
  'Opel',
  'Peugeot',
  'Citroen',
  'Toyota',
  'Honda',
  'Hyundai',
  'Kia',
  'BMW',
  'Mercedes',
  'Audi',
  'Skoda',
  'Dacia',
  'Nissan',
  'Volvo',
  'Diğer',
];

const yearOptions = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

const fuelOptions = ['Benzin', 'Dizel', 'LPG', 'Hybrid', 'Elektrik'];

const faultOptions = [
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
  customerName: '',
  phone: '',
  plate: '',
  brand: '',
  model: '',
  year: '',
  fuelType: '',
  date: '',
  faultType: '',
  description: '',
  partCost: 0,
  laborCost: 0,
  totalCost: 0,
  tested: false,
  delivered: false,
  status: '',
};

export default function ServisKayitlariPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<ServiceRecord[]>([]);
  const [form, setForm] = useState(initial);

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

  async function save(e: FormEvent) {
    e.preventDefault();

    if (
      !profile ||
      !form.customerName.trim() ||
      !form.plate.trim() ||
      !form.brand ||
      !form.model.trim() ||
      !form.year ||
      !form.date ||
      !form.faultType
    ) {
      return;
    }

    await addDoc(collection(db, 'service_records'), {
      ...form,
      partCost: Number(form.partCost || 0),
      laborCost: Number(form.laborCost || 0),
      totalCost: Number(form.totalCost || 0),
      createdAt: nowIso(),
      createdByUid: profile.uid,
      createdByName: `${profile.firstName} ${profile.lastName}`,
      processSummary: form.faultType,
      details: form.description,
    });

    setForm(initial);
  }

  function printItem(item: ServiceRecord) {
    const w = window.open('', '_blank');
    if (!w) return;

    w.document.write(`
      <html>
        <head>
          <title>Servis Formu</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h2 { margin-bottom: 20px; }
            .box { border: 1px solid #ccc; border-radius: 8px; padding: 18px; }
            .row { margin-bottom: 10px; font-size: 14px; }
            .label { font-weight: bold; display: inline-block; min-width: 160px; }
          </style>
        </head>
        <body>
          <h2>Servis Kayıt Formu</h2>
          <div class="box">
            <div class="row"><span class="label">Müşteri Adı:</span> ${item.customerName || '-'}</div>
            <div class="row"><span class="label">Telefon:</span> ${item.phone || '-'}</div>
            <div class="row"><span class="label">Tarih:</span> ${item.date || '-'}</div>
            <div class="row"><span class="label">Plaka:</span> ${item.plate || '-'}</div>
            <div class="row"><span class="label">Marka:</span> ${item.brand || '-'}</div>
            <div class="row"><span class="label">Model:</span> ${item.model || '-'}</div>
            <div class="row"><span class="label">Yıl:</span> ${item.year || '-'}</div>
            <div class="row"><span class="label">Yakıt Tipi:</span> ${item.fuelType || '-'}</div>
            <div class="row"><span class="label">Arıza Türü:</span> ${item.faultType || item.processSummary || '-'}</div>
            <div class="row"><span class="label">Açıklama:</span> ${item.description || item.details || '-'}</div>
            <div class="row"><span class="label">Durum:</span> ${item.status || '-'}</div>
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
    <AppShell
      title="Servis Kayıtları"
      subtitle="Araç sahibi, araç bilgisi ve servis işlemlerini buradan kaydet."
    >
      <section className="panel-grid">
        <form className="panel-card" onSubmit={save}>
          <div className="panel-head">
            <h3>Yeni Servis Kaydı</h3>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Müşteri Adı *</span>
              <input
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
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
              <span>Tarih *</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Plaka *</span>
              <input
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
              />
            </label>

            <label className="field">
              <span>Marka *</span>
              <select
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              >
                <option value="">Seçiniz</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Model *</span>
              <input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Yıl *</span>
              <select
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              >
                <option value="">Seçiniz</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Yakıt Tipi</span>
              <select
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
              >
                <option value="">Seçiniz</option>
                {fuelOptions.map((fuel) => (
                  <option key={fuel} value={fuel}>
                    {fuel}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-full" style={{ gridColumn: '1 / -1' }}>
              <span>Arıza Türü *</span>
              <select
                value={form.faultType}
                onChange={(e) => setForm({ ...form, faultType: e.target.value })}
              >
                <option value="">Seçiniz</option>
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
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Yapılan işlem, arıza detayı, değişen parçalar vb."
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
                onChange={(e) => setForm({ ...form, partCost: Number(e.target.value) })}
              />
            </label>

            <label className="field">
              <span>İşçilik</span>
              <input
                type="number"
                value={form.laborCost}
                onChange={(e) => setForm({ ...form, laborCost: Number(e.target.value) })}
              />
            </label>

            <label className="field">
              <span>Toplam</span>
              <input
                type="number"
                value={form.totalCost}
                onChange={(e) => setForm({ ...form, totalCost: Number(e.target.value) })}
              />
            </label>

            <label className="field">
              <span>Test</span>
              <select
                value={form.tested ? 'Evet' : 'Hayır'}
                onChange={(e) => setForm({ ...form, tested: e.target.value === 'Evet' })}
              >
                <option>Hayır</option>
                <option>Evet</option>
              </select>
            </label>

            <label className="field">
              <span>Teslim</span>
              <select
                value={form.delivered ? 'Evet' : 'Hayır'}
                onChange={(e) => setForm({ ...form, delivered: e.target.value === 'Evet' })}
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
                  <th>Marka / Model</th>
                  <th>Arıza</th>
                  <th>Tutar</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.customerName || '-'}</td>
                    <td>{item.plate || '-'}</td>
                    <td>
                      {item.brand || '-'} / {item.model || '-'}
                    </td>
                    <td>{item.faultType || item.processSummary || '-'}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
