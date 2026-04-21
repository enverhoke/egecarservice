'use client';

import { AppShell } from '@/components/AppShell';
import { RequireAuth } from '@/components/RequireAuth';
import { db } from '@/lib/firebase';
import { money } from '@/lib/helpers';
import { Customer, ServiceRecord, Vehicle } from '@/lib/types';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

export default function AnasayfaPage() {
  return (
    <RequireAuth allow={['admin']}>
      <AnasayfaInner />
    </RequireAuth>
  );
}

function AnasayfaInner() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'customers'), orderBy('createdAt', 'desc')),
      (snapshot) =>
        setCustomers(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Customer, 'id'>),
          }))
        ),
      console.error
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
        ),
      console.error
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'service_records'), orderBy('createdAt', 'desc')),
      (snapshot) =>
        setServices(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ServiceRecord, 'id'>),
          }))
        ),
      console.error
    );
  }, []);

  const customerMap = Object.fromEntries(
    customers.map((c) => [c.id, `${c.firstName} ${c.lastName}`])
  );

  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));

  const stats = useMemo(() => {
    const totalIncome = services.reduce((sum, x) => sum + (x.totalCost || 0), 0);
    const waiting = services.filter((x) => !x.delivered).length;
    const delivered = services.filter((x) => x.delivered).length;
    const recentServices = services.slice(0, 10);

    return {
      totalIncome,
      waiting,
      delivered,
      customerCount: customers.length,
      vehicleCount: vehicles.length,
      serviceCount: services.length,
      recentServices,
    };
  }, [services, customers, vehicles]);

  return (
    <AppShell
      title="Ana Sayfa"
      subtitle="Müşteri, araç ve servis özetlerini buradan takip edebilirsin."
    >
      <section className="dashboard-hero">
        <div className="dashboard-hero__content">
          <span className="dashboard-hero__eyebrow">Servis Yönetim Paneli</span>
          <h3>Servis operasyonlarını tek ekrandan takip et</h3>
          <p>
            Güncel araç durumu, müşteri yoğunluğu ve servis hareketlerini daha
            hızlı ve düzenli şekilde görüntüleyebilirsin.
          </p>
        </div>

        <div className="dashboard-hero__summary">
          <div className="hero-mini-card">
            <span>Toplam Hizmet Tutarı</span>
            <strong>{money(stats.totalIncome)}</strong>
          </div>
          <div className="hero-mini-card">
            <span>Bekleyen Araç</span>
            <strong>{stats.waiting}</strong>
          </div>
        </div>
      </section>

      <section className="stats-grid dashboard-stats-grid">
        <div className="stat-card stat-card--accent">
          <span>Toplam Hizmet Tutarı</span>
          <strong>{money(stats.totalIncome)}</strong>
          <small>Tüm servis kayıtlarının toplamı</small>
        </div>

        <div className="stat-card">
          <span>Bekleyen Araç</span>
          <strong>{stats.waiting}</strong>
          <small>Teslim edilmemiş kayıtlar</small>
        </div>

        <div className="stat-card">
          <span>Teslim Edilen</span>
          <strong>{stats.delivered}</strong>
          <small>Tamamlanan servisler</small>
        </div>

        <div className="stat-card">
          <span>Müşteri Sayısı</span>
          <strong>{stats.customerCount}</strong>
          <small>Kayıtlı müşteri adedi</small>
        </div>

        <div className="stat-card">
          <span>Araç Sayısı</span>
          <strong>{stats.vehicleCount}</strong>
          <small>Sistemde kayıtlı araçlar</small>
        </div>

        <div className="stat-card">
          <span>Servis Kaydı</span>
          <strong>{stats.serviceCount}</strong>
          <small>Toplam açılan kayıtlar</small>
        </div>
      </section>

      <section className="dashboard-panels">
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Son Servis Kayıtları</h3>
              <p className="panel-subtitle">
                En son eklenen servis hareketlerini burada görebilirsin.
              </p>
            </div>
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
                </tr>
              </thead>
              <tbody>
                {stats.recentServices.length > 0 ? (
                  stats.recentServices.map((item) => {
                    const vehicle = vehicleMap[item.vehicleId];
                    return (
                      <tr key={item.id}>
                        <td>{item.date || '-'}</td>
                        <td>{customerMap[item.customerId] || '-'}</td>
                        <td>{vehicle?.plate || '-'}</td>
                        <td>{vehicle ? `${vehicle.brand} ${vehicle.model}` : '-'}</td>
                        <td>{item.faultType || '-'}</td>
                        <td>{money(item.totalCost || 0)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state-inline">
                        Henüz servis kaydı bulunmuyor.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
