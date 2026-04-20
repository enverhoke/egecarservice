'use client';

import { AppShell } from '@/components/AppShell';
import { db } from '@/lib/firebase';
import { Customer, ServiceRecord, Vehicle } from '@/lib/types';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

export default function AracDetayPage() {
  const params = useParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);

  // araç çek
  useEffect(() => {
    return onSnapshot(
      collection(db, 'vehicles'),
      (snapshot) => {
        const found = snapshot.docs.find((d) => d.id === vehicleId);
        if (found) {
          const data = { id: found.id, ...(found.data() as any) };
          setVehicle(data);
        }
      }
    );
  }, [vehicleId]);

  // müşteri çek
  useEffect(() => {
    if (!vehicle) return;

    return onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        const found = snapshot.docs.find((d) => d.id === vehicle.customerId);
        if (found) {
          const data = { id: found.id, ...(found.data() as any) };
          setCustomer(data);
        }
      }
    );
  }, [vehicle]);

  // servisler çek
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

  return (
    <AppShell title="Araç Detay" subtitle="Araç bilgisi ve servis geçmişi">
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
                <td>{s.description}</td>
                <td>{s.totalCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
