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
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td>{s.date}</td>
                <td>{s.faultType}</td>
                <td>{s.description || '-'}</td>
                <td>{money(s.totalCost || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
