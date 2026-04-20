'use client';

import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { money, nowIso } from '@/lib/helpers';
import { Firm, ServiceRecord } from '@/lib/types';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { FormEvent, useEffect, useState } from 'react';

const initial = { firmId: '', date: '', plate: '', brand: '', model: '', year: '', processSummary: '', details: '', partPurchased: '', partCost: 0, laborCost: 0, totalCost: 0, onCredit: 0, tested: false, delivered: false, status: '' };

export default function ServisKayitlariPage() {
  const { profile } = useAuth();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [items, setItems] = useState<ServiceRecord[]>([]);

  const firmMap = Object.fromEntries(firms.map(f => [f.id, f.name]));

  const [form, setForm] = useState(initial);

  useEffect(() => onSnapshot(query(collection(db, 'firms'), orderBy('name', 'asc')), s => setFirms(s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Firm,'id'>) })))), []);
  useEffect(() => onSnapshot(query(collection(db, 'service_records'), orderBy('createdAt', 'desc')), s => setItems(s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ServiceRecord,'id'>) })))), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!profile || !form.firmId || !form.date || !form.processSummary.trim()) return;
    await addDoc(collection(db, 'service_records'), {
      ...form,
      partCost: Number(form.partCost || 0),
      laborCost: Number(form.laborCost || 0),
      totalCost: Number(form.totalCost || 0),
      onCredit: Number(form.onCredit || 0),
      createdAt: nowIso(),
      createdByUid: profile.uid,
      createdByName: `${profile.firstName} ${profile.lastName}`,
    });
    setForm(initial);
  }
function printItem(item: ServiceRecord) {
  const firmName = firmMap[item.firmId] || '-';

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
          <div class="row"><span class="label">Tarih:</span> ${item.date || '-'}</div>
          <div class="row"><span class="label">Firma:</span> ${firmName}</div>
          <div class="row"><span class="label">Plaka:</span> ${item.plate || '-'}</div>
          <div class="row"><span class="label">Marka:</span> ${item.brand || '-'}</div>
          <div class="row"><span class="label">Model:</span> ${item.model || '-'}</div>
          <div class="row"><span class="label">Yıl:</span> ${item.year || '-'}</div>
          <div class="row"><span class="label">Yapılan İş:</span> ${item.processSummary || '-'}</div>
          <div class="row"><span class="label">Detay:</span> ${item.details || '-'}</div>
          <div class="row"><span class="label">Parça:</span> ${item.partPurchased || '-'}</div>
          <div class="row"><span class="label">Durum:</span> ${item.status || '-'}</div>
          <div class="row"><span class="label">Parça Tutarı:</span> ${item.partCost || 0} TL</div>
          <div class="row"><span class="label">İşçilik:</span> ${item.laborCost || 0} TL</div>
          <div class="row"><span class="label">Toplam:</span> ${item.totalCost || 0} TL</div>
          <div class="row"><span class="label">Veresiye:</span> ${item.onCredit || 0} TL</div>
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
    <AppShell title="Servis Kayıtları" subtitle="Personel araç, işlem, test ve parça kayıtlarını buradan girer.">
      <section className="panel-grid">
        <form className="panel-card" onSubmit={save}>
          <div className="panel-head"><h3>Yeni Servis Kaydı</h3></div>
          <div className="form-grid">
            <label className="field"><span>Firma *</span><select value={form.firmId} onChange={e => setForm({ ...form, firmId: e.target.value })}><option value="">Seçiniz</option>{firms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
            <label className="field"><span>Tarih *</span><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
            <label className="field"><span>Plaka</span><input value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} /></label>
            <label className="field"><span>Marka</span><input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></label>
            <label className="field"><span>Model</span><input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></label>
            <label className="field"><span>Yıl</span><input value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></label>
            <label className="field-full" style={{gridColumn:'1 / -1'}}><span>Yapılan İş *</span><textarea value={form.processSummary} onChange={e => setForm({ ...form, processSummary: e.target.value })} /></label>
            <label className="field-full" style={{gridColumn:'1 / -1'}}><span>Detay / Not</span><textarea value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} /></label>
            <label className="field"><span>Parça Alındı</span><input value={form.partPurchased} onChange={e => setForm({ ...form, partPurchased: e.target.value })} /></label>
            <label className="field"><span>Durum</span><input value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} placeholder="örn: test edildi" /></label>
            <label className="field"><span>Parça Tutarı</span><input type="number" value={form.partCost} onChange={e => setForm({ ...form, partCost: Number(e.target.value) })} /></label>
            <label className="field"><span>İşçilik</span><input type="number" value={form.laborCost} onChange={e => setForm({ ...form, laborCost: Number(e.target.value) })} /></label>
            <label className="field"><span>Toplam</span><input type="number" value={form.totalCost} onChange={e => setForm({ ...form, totalCost: Number(e.target.value) })} /></label>
            <label className="field"><span>Veresiye</span><input type="number" value={form.onCredit} onChange={e => setForm({ ...form, onCredit: Number(e.target.value) })} /></label>
            <label className="field"><span>Test</span><select value={form.tested ? 'Evet' : 'Hayır'} onChange={e => setForm({ ...form, tested: e.target.value === 'Evet' })}><option>Evet</option><option>Hayır</option></select></label>
            <label className="field"><span>Teslim</span><select value={form.delivered ? 'Evet' : 'Hayır'} onChange={e => setForm({ ...form, delivered: e.target.value === 'Evet' })}><option>Hayır</option><option>Evet</option></select></label>
          </div>
          <button className="primary-btn" type="submit">Servis Kaydet</button>
        </form>

        <div className="panel-card">
          <div className="panel-head"><h3>Son Servisler</h3></div>
          <div className="table-wrap">
            <table><thead><tr><th>Tarih</th><th>Firma</th><th>Plaka</th><th>İş</th><th>Tutar</th><th>Giren</th><th>İşlem</th></tr></thead><tbody>
              {items.map(item => (
  <tr key={item.id}>
    <td>{item.date}</td>
    <td>{firmMap[item.firmId] || '-'}</td>
    <td>{item.plate || '-'}</td>
    <td>{item.processSummary}</td>
    <td>{money(item.totalCost || 0)}</td>
    <td>{item.createdByName}</td>
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
            </tbody></table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
