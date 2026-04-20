'use client';

import { AppShell } from '@/components/AppShell';
import { RequireAuth } from '@/components/RequireAuth';
import { db } from '@/lib/firebase';
import { money } from '@/lib/helpers';
import { Firm, PaymentRecord, ServiceRecord } from '@/lib/types';
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
  const [firms, setFirms] = useState<Firm[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'firms'), orderBy('createdAt', 'desc')),
      (snapshot) =>
        setFirms(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Firm, 'id'>),
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

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'payments'), orderBy('createdAt', 'desc')),
      (snapshot) =>
        setPayments(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PaymentRecord, 'id'>),
          }))
        ),
      console.error
    );
  }, []);

  const stats = useMemo(() => {
    const totalIncome = services.reduce((sum, x) => sum + (x.totalCost || 0), 0);
    const totalTahsilat = payments
      .filter((x) => x.type === 'alinan')
      .reduce((sum, x) => sum + x.amount, 0);
    const totalVerilen = payments
      .filter((x) => x.type === 'verilen')
      .reduce((sum, x) => sum + x.amount, 0);
    const totalReceivable = totalIncome - totalTahsilat;
    const waiting = services.filter((x) => !x.delivered).length;

    return {
      totalIncome,
      totalTahsilat,
      totalVerilen,
      totalReceivable,
      waiting,
    };
  }, [services, payments]);

  const firmSummary = useMemo(() => {
    return firms.map((firm) => {
      const firmServices = services.filter((s) => s.firmId === firm.id);
      const firmPayments = payments.filter(
        (p) => p.firmId === firm.id && p.type === 'alinan'
      );

      const serviceTotal = firmServices.reduce(
        (sum, x) => sum + (x.totalCost || 0),
        0
      );
      const tahsilat = firmPayments.reduce((sum, x) => sum + x.amount, 0);

      return {
        firm,
        serviceTotal,
        tahsilat,
        kalan: serviceTotal - tahsilat,
        count: firmServices.length,
      };
    });
  }, [firms, services, payments]);

  return (
    <AppShell
      title="Ana Sayfa"
      subtitle="Günlük akışı, son kayıtları ve cari özetleri buradan takip edebilirsin."
    >
      <section className="stats-grid">
        <div className="stat-card">
          <span>Toplam Hizmet</span>
          <strong>{money(stats.totalIncome)}</strong>
        </div>
        <div className="stat-card">
          <span>Toplam Tahsilat</span>
          <strong>{money(stats.totalTahsilat)}</strong>
        </div>
        <div className="stat-card">
          <span>Toplam Verilen</span>
          <strong>{money(stats.totalVerilen)}</strong>
        </div>
        <div className="stat-card">
          <span>Toplam Alacak</span>
          <strong>{money(stats.totalReceivable)}</strong>
        </div>
        <div className="stat-card">
          <span>Bekleyen Araç</span>
          <strong>{stats.waiting}</strong>
        </div>
        <div className="stat-card">
          <span>Firma Sayısı</span>
          <strong>{firms.length}</strong>
        </div>
      </section>

      <section className="panel-grid">
        <div className="panel-card">
          <div className="panel-head">
            <h3>Son Servis Kayıtları</h3>
          </div>
          <div className="list-wrap">
            {services.slice(0, 6).map((item) => (
              <div className="list-item" key={item.id}>
                <div>
                  <strong>{item.processSummary}</strong>
                  <p>
                    {item.plate || '-'} · {item.createdByName}
                  </p>
                </div>
                <span>{money(item.totalCost || 0)}</span>
              </div>
            ))}
            {!services.length && (
              <p className="empty">Henüz servis kaydı yok.</p>
            )}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-head">
            <h3>Son Cari Hareketleri</h3>
          </div>
          <div className="list-wrap">
            {payments.slice(0, 6).map((item) => (
              <div className="list-item" key={item.id}>
                <div>
                  <strong>{item.type}</strong>
                  <p>
                    {item.note || '-'} · {item.createdByName}
                  </p>
                </div>
                <span>{money(item.amount)}</span>
              </div>
            ))}
            {!payments.length && (
              <p className="empty">Henüz ödeme kaydı yok.</p>
            )}
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-head">
          <h3>Firma Bazlı Özet</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Firma</th>
                <th>Hizmet</th>
                <th>Tahsilat</th>
                <th>Kalan</th>
                <th>Kayıt</th>
              </tr>
            </thead>
            <tbody>
              {firmSummary.map((row) => (
                <tr key={row.firm.id}>
                  <td>{row.firm.name}</td>
                  <td>{money(row.serviceTotal)}</td>
                  <td>{money(row.tahsilat)}</td>
                  <td>{money(row.kalan)}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
