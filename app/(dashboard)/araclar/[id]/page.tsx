'use client';

import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { money, nowIso } from '@/lib/helpers';
import { Customer, ServiceItem, ServiceRecord, Vehicle } from '@/lib/types';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { FormEvent } from 'react';

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

const initialItem: ServiceItem = {
  title: '',
  amount: 0,
};

export default function AracDetayPage() {
  const { profile } = useAuth();
  const params = useParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);

  const [date, setDate] = useState('');
  const [faultType, setFaultType] = useState<ServiceRecord['faultType']>('Motor');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [kilometer, setKilometer] = useState(0);
  const [tested, setTested] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [items, setItems] = useState<ServiceItem[]>([{ ...initialItem }]);

  useEffect(() => {
    return onSnapshot(collection(db, 'vehicles'), (snapshot) => {
      const found = snapshot.docs.find((d) => d.id === vehicleId);
      if (found) {
        setVehicle({ id: found.id, ...(found.data() as Omit<Vehicle, 'id'>) });
      }
    });
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicle) return;

    return onSnapshot(collection(db, 'customers'), (snapshot) => {
      const found = snapshot.docs.find((d) => d.id === vehicle.customerId);
      if (found) {
        setCustomer({ id: found.id, ...(found.data() as Omit<Customer, 'id'>) });
      }
    });
  }, [vehicle]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'service_records'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ServiceRecord, 'id'>),
          }))
          .filter((s) => s.vehicleId === vehicleId);

        setServices(list);
      }
    );
  }, [vehicleId]);

  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [items]);

  function updateItem(index: number, key: keyof ServiceItem, value: string | number) {
    const next = [...items];
    next[index] = {
      ...next[index],
      [key]: key === 'amount' ? Number(value) : value,
    };
    setItems(next);
  }

  function addItem() {
    setItems([...items, { ...initialItem }]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  async function saveService(e: FormEvent) {
    e.preventDefault();
    if (!profile || !vehicle || !customer || !date || !faultType) return;

    const cleanItems = items.filter((x) => x.title.trim() && Number(x.amount) > 0);

    await addDoc(collection(db, 'service_records'), {
      customerId: customer.id,
      vehicleId: vehicle.id,
      date,
      faultType,
      description,
      status,
      kilometer: Number(kilometer || 0),
      items: cleanItems,
      totalCost,
      tested,
      delivered,
      createdAt: nowIso(),
      createdByUid: profile.uid,
      createdByName: `${profile.firstName} ${profile.lastName}`,
    });

    setDate('');
    setFaultType('Motor');
    setDescription('');
    setStatus('');
    setKilometer(0);
    setItems([{ ...initialItem }]);
    setTested(false);
    setDelivered(false);
  }
  function printService(service: ServiceRecord) {
  if (!vehicle || !customer) return;

  const serviceItems = service.items || [];

  const itemsHtml = serviceItems.length
    ? serviceItems
        .map(
          (item) => `
            <tr>
              <td style="padding:10px; border-bottom:1px solid #e5e7eb;">${item.title}</td>
              <td style="padding:10px; border-bottom:1px solid #e5e7eb; text-align:right;">${money(item.amount)}</td>
            </tr>
          `
        )
        .join('')
    : `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #e5e7eb;">Servis İşlemi</td>
        <td style="padding:10px; border-bottom:1px solid #e5e7eb; text-align:right;">${money(service.totalCost || 0)}</td>
      </tr>
    `;

  const w = window.open('', '_blank');
  if (!w) return;

w.document.write(`
  <html>
    <head>
      <title>Ege Car Service - Servis Formu</title>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f3f4f6;
          margin: 0;
          padding: 14px;
          color: #111827;
        }
        .sheet {
          max-width: 900px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          padding: 18px 22px;
          box-shadow: 0 6px 18px rgba(0,0,0,0.06);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 14px;
        }
        .brand h1 {
          margin: 0;
          font-size: 22px;
          line-height: 1.1;
        }
        .brand p {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 12px;
        }
        .meta {
          text-align: right;
          font-size: 12px;
          color: #6b7280;
        }
        .section-title {
          font-size: 14px;
          margin: 14px 0 8px;
          font-weight: bold;
        }
        .top-info {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        .top-info td {
          padding: 6px 8px;
          border: 1px solid #e5e7eb;
          font-size: 12px;
          vertical-align: top;
        }
        .label {
          color: #6b7280;
          font-size: 11px;
          display: block;
          margin-bottom: 2px;
        }
        .value {
          font-size: 13px;
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
        }
        th {
          text-align: left;
          background: #f9fafb;
          padding: 8px;
          border-bottom: 1px solid #d1d5db;
          font-size: 12px;
        }
        td {
          font-size: 12px;
        }
        .total-row td {
          padding-top: 10px;
          font-size: 14px;
          font-weight: bold;
        }
        .note-box {
          margin-top: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 12px;
          background: #fafafa;
          font-size: 12px;
        }
        .footer {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }
        .sign {
          flex: 1;
          border-top: 1px solid #d1d5db;
          padding-top: 6px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          margin-top: 30px;
        }
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .sheet {
            box-shadow: none;
            border-radius: 0;
            max-width: 100%;
            padding: 10px 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <div class="brand">
            <h1>Ege Car Service</h1>
            <p>Servis ve araç bakım formu</p>
          </div>
          <div class="meta">
            <div><strong>Tarih:</strong> ${service.date}</div>
            <div><strong>Kayıt:</strong> ${service.createdByName || '-'}</div>
          </div>
        </div>

        <div class="section-title">Araç ve Müşteri Bilgisi</div>
        <table class="top-info">
          <tr>
            <td>
              <span class="label">Müşteri</span>
              <span class="value">${customer.firstName} ${customer.lastName}</span>
            </td>
            <td>
              <span class="label">Telefon</span>
              <span class="value">${customer.phone || '-'}</span>
            </td>
            <td>
              <span class="label">Tarih</span>
              <span class="value">${service.date}</span>
            </td>
          </tr>
          <tr>
            <td>
              <span class="label">Plaka</span>
              <span class="value">${vehicle.plate}</span>
            </td>
            <td>
              <span class="label">Marka / Model</span>
              <span class="value">${vehicle.brand} ${vehicle.model}</span>
            </td>
            <td>
              <span class="label">Yıl / Yakıt</span>
              <span class="value">${vehicle.year || '-'} / ${vehicle.fuelType || '-'}</span>
            </td>
          </tr>
          <tr>
            <td>
              <span class="label">Kilometre</span>
              <span class="value">${service.kilometer || 0}</span>
            </td>
            <td>
              <span class="label">Arıza Türü</span>
              <span class="value">${service.faultType}</span>
            </td>
            <td>
              <span class="label">Kayıt</span>
              <span class="value">${service.createdByName || '-'}</span>
            </td>
          </tr>
        </table>

        <div class="section-title">İşlem Kalemleri</div>
        <table>
          <thead>
            <tr>
              <th>Kalem</th>
              <th style="text-align:right;">Tutar</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr class="total-row">
              <td>Toplam</td>
              <td style="text-align:right;">${money(service.totalCost || 0)}</td>
            </tr>
          </tbody>
        </table>

        <div class="note-box">
          <div><strong>Açıklama:</strong> ${service.description || '-'}</div>
          <div style="margin-top:8px;"><strong>Durum:</strong> ${service.status || '-'}</div>
          <div style="margin-top:8px;"><strong>Test:</strong> ${service.tested ? 'Evet' : 'Hayır'} &nbsp; | &nbsp; <strong>Teslim:</strong> ${service.delivered ? 'Evet' : 'Hayır'}</div>
        </div>

        <div class="footer">
          <div class="sign">Müşteri İmza</div>
          <div class="sign">Servis Yetkilisi</div>
        </div>
      </div>
    </body>
  </html>
`);

  w.document.close();
  w.focus();
  w.print();
}

  return (
    <AppShell title="Araç Detay" subtitle="Araç bilgisi, servis geçmişi ve yeni servis kaydı">
      <section className="panel-card">
        <h3>Araç Bilgisi</h3>

        {vehicle && (
          <div style={{ marginTop: 12 }}>
            <p><b>Plaka:</b> {vehicle.plate}</p>
            <p><b>Marka:</b> {vehicle.brand}</p>
            <p><b>Model:</b> {vehicle.model}</p>
            <p><b>Yıl:</b> {vehicle.year}</p>
            <p><b>Yakıt:</b> {vehicle.fuelType}</p>
            <p><b>Müşteri:</b> {customer ? `${customer.firstName} ${customer.lastName}` : '-'}</p>
          </div>
        )}
      </section>

      <section className="panel-card">
        <div className="panel-head">
          <h3>Yeni Servis Kaydı</h3>
        </div>

        <form onSubmit={saveService}>
          <div className="form-grid">
            <label className="field">
              <span>Tarih *</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>

            <label className="field">
              <span>Kilometre</span>
              <input
                type="number"
                value={kilometer}
                onChange={(e) => setKilometer(Number(e.target.value))}
              />
            </label>

            <label className="field-full" style={{ gridColumn: '1 / -1' }}>
              <span>Arıza Türü *</span>
              <select
                value={faultType}
                onChange={(e) => setFaultType(e.target.value as ServiceRecord['faultType'])}
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
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>

            <label className="field-full" style={{ gridColumn: '1 / -1' }}>
              <span>Durum</span>
              <input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="örn: işlem tamamlandı"
              />
            </label>
          </div>

          <div style={{ marginTop: 20 }}>
            <h4>İşlem Kalemleri</h4>

            {items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 180px 120px',
                  gap: 12,
                  marginTop: 12,
                  alignItems: 'end',
                }}
              >
                <label className="field">
                  <span>Kalem</span>
                  <input
                    value={item.title}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    placeholder="örn: Yağ filtresi"
                  />
                </label>

                <label className="field">
                  <span>Tutar</span>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateItem(index, 'amount', e.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => removeItem(index)}
                >
                  Sil
                </button>
              </div>
            ))}

            <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button type="button" className="secondary-btn" onClick={addItem}>
                + Kalem Ekle
              </button>
              <strong>Toplam: {money(totalCost)}</strong>
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: 20 }}>
            <label className="field">
              <span>Test</span>
              <select
                value={tested ? 'Evet' : 'Hayır'}
                onChange={(e) => setTested(e.target.value === 'Evet')}
              >
                <option>Hayır</option>
                <option>Evet</option>
              </select>
            </label>

            <label className="field">
              <span>Teslim</span>
              <select
                value={delivered ? 'Evet' : 'Hayır'}
                onChange={(e) => setDelivered(e.target.value === 'Evet')}
              >
                <option>Hayır</option>
                <option>Evet</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: 20 }}>
            <button className="primary-btn" type="submit">
              Servis Kaydet
            </button>
          </div>
        </form>
      </section>

      <section className="panel-card">
        <h3>Servis Geçmişi</h3>

        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Arıza</th>
              <th>Açıklama</th>
              <th>Tutar</th>
                  <th>İşlem</th>

            </tr>
          </thead>
         <tbody>
  {services.map((s) => (
    <tr key={s.id}>
      <td>{s.date}</td>
      <td>{s.faultType}</td>
      <td>{s.description || '-'}</td>
      <td>{money(s.totalCost || 0)}</td>
      <td>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => printService(s)}
        >
          Yazdır
        </button>
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </section>
    </AppShell>
  );
}
