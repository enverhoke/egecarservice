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
import Link from 'next/link';
const brandModelMap: Record<string, string[]> = {
  FIAT: ['Egea', 'Linea', 'Doblo', 'Albea', 'Tempra', 'Marea', 'Punto', 'Palio', 'Bravo', 'Brava', 'Tipo'],
  
  RENAULT: ['Clio', 'Megane', 'Symbol', 'Fluence', 'Taliant', 'Kangoo', 'Laguna', 'Captur', 'Kadjar', 'Koleos', 'Zoe'],
  
  FORD: ['Focus', 'Fiesta', 'Transit', 'Courier', 'Mondeo', 'Kuga', 'EcoSport', 'Puma', 'Mustang'],
  
  VOLKSWAGEN: ['Golf', 'Passat', 'Polo', 'Caddy', 'Transporter', 'Tiguan', 'Touareg', 'Jetta', 'Arteon'],
  
  OPEL: ['Astra', 'Corsa', 'Insignia', 'Combo', 'Vectra', 'Mokka', 'Crossland', 'Grandland'],
  
  TOYOTA: ['Corolla', 'Yaris', 'Hilux', 'Auris', 'Avensis', 'RAV4', 'C-HR', 'Camry', 'Land Cruiser'],
  
  HONDA: ['Civic', 'Accord', 'City', 'CR-V', 'HR-V', 'Jazz'],
  
  HYUNDAI: ['i10', 'i20', 'i30', 'Accent', 'Elantra', 'Tucson', 'Santa Fe', 'Kona'],
  
  PEUGEOT: ['206', '207', '208', '301', '308', '3008', '5008', 'Partner', 'Rifter'],
  
  CITROEN: ['C-Elysee', 'C3', 'C4', 'Berlingo', 'C5 Aircross'],
  
  BMW: ['1 Serisi', '3 Serisi', '5 Serisi', '7 Serisi', 'X1', 'X3', 'X5', 'X6', 'i3', 'i4'],
  
  MERCEDES: ['A Serisi', 'C Serisi', 'E Serisi', 'S Serisi', 'CLA', 'GLA', 'GLC', 'GLE', 'Vito', 'Sprinter'],
  
  AUDI: ['A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8'],
  
  SKODA: ['Fabia', 'Octavia', 'Superb', 'Rapid', 'Kodiaq', 'Kamiq', 'Scala'],
  
  DACIA: ['Sandero', 'Logan', 'Duster', 'Jogger'],
  
  NISSAN: ['Micra', 'Qashqai', 'Juke', 'Navara', 'X-Trail'],
  
  KIA: ['Rio', 'Ceed', 'Sportage', 'Cerato', 'Sorento', 'Stonic'],
  
  VOLVO: ['S40', 'S60', 'S90', 'XC40', 'XC60', 'XC90', 'V40'],
  
  TESLA: ['Model S', 'Model 3', 'Model X', 'Model Y'],
  
  MAZDA: ['Mazda 2', 'Mazda 3', 'Mazda 6', 'CX-3', 'CX-5', 'CX-9'],
  
  MITSUBISHI: ['Lancer', 'ASX', 'Outlander', 'Pajero'],
  
  SUZUKI: ['Swift', 'Vitara', 'SX4', 'Baleno', 'Jimny'],
  
  SEAT: ['Ibiza', 'Leon', 'Ateca', 'Arona', 'Toledo'],
  
  MINI: ['Cooper', 'Countryman', 'Clubman'],
  
  JEEP: ['Renegade', 'Compass', 'Cherokee', 'Wrangler'],
  
  LAND_ROVER: ['Discovery', 'Range Rover', 'Defender', 'Evoque'],
  
  PORSCHE: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  
  FERRARI: ['488', 'F8', 'Roma', 'Portofino'],
  
  LAMBORGHINI: ['Huracan', 'Aventador', 'Urus']
};
const fuelOptions = ['Benzin', 'Dizel', 'LPG', 'Hybrid', 'Elektrik'];
const brandOptions = Object.keys(brandModelMap);
const yearOptions = Array.from(
  { length: 40 },
  (_, i) => String(new Date().getFullYear() - i)
);
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
const modelOptions = form.brand ? brandModelMap[form.brand] || [] : [];
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
  <select
    value={form.brand}
    onChange={(e) =>
      setForm({ ...form, brand: e.target.value, model: '' })
    }
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
  <select
    value={form.model}
    onChange={(e) =>
      setForm({ ...form, model: e.target.value })
    }
    disabled={!form.brand}
  >
    <option value="">Seçiniz</option>
    {modelOptions.map((model) => (
      <option key={model} value={model}>
        {model}
      </option>
    ))}
  </select>
</label>

            <label className="field">
  <span>Yıl</span>
  <select
    value={form.year}
    onChange={(e) =>
      setForm({ ...form, year: e.target.value })
    }
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
    <th>İşlem</th>
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
                    <td>
  <Link className="secondary-btn" href={`/araclar/${item.id}`}>
    Detay
  </Link>
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
