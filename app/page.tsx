'use client';
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useMemo, useState } from 'react';

type CompanyStatus = 'Aktif' | 'Pasif';
type ServiceCategory = 'Motor' | 'Mekanik' | 'Elektrik' | 'Kaporta' | 'Bakım' | 'Diğer';
type ServiceStatus = 'Tamamlandı' | 'Beklemede' | 'Parça bekleniyor' | 'Teslim edildi';
type PaymentType = 'Nakit' | 'Havale / EFT' | 'Kart' | 'Veresiye';
type ExpenseCategory = 'Kira' | 'Elektrik' | 'Su' | 'Parça alımı' | 'Personel' | 'Vergi' | 'Diğer';

type Company = {
  id: string;
  name: string;
  authorizedPerson: string;
  phone: string;
  address: string;
  note: string;
  status: CompanyStatus;
  createdAt: string;
};

type ServiceRecord = {
  id: string;
  companyId: string;
  date: string;
  brand: string;
  model: string;
  year: string;
  plate: string;
  kilometer: string;
  processType: string;
  description: string;
  category: ServiceCategory;
  partChanged: boolean;
  partName: string;
  laborFee: number;
  partFee: number;
  totalFee: number;
  vatIncluded: boolean;
  status: ServiceStatus;
};

type Payment = {
  id: string;
  companyId: string;
  date: string;
  amount: number;
  type: PaymentType;
  note: string;
};

type Expense = {
  id: string;
  date: string;
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
};

type DB = {
  companies: Company[];
  serviceRecords: ServiceRecord[];
  payments: Payment[];
  expenses: Expense[];
};

const STORAGE_KEY = 'ege-car-service-db-v1';

const emptyDB: DB = {
  companies: [],
  serviceRecords: [],
  payments: [],
  expenses: [],
};

const companyInitial = {
  name: '',
  authorizedPerson: '',
  phone: '',
  address: '',
  note: '',
  status: 'Aktif' as CompanyStatus,
};

const serviceInitial = {
  date: '',
  brand: '',
  model: '',
  year: '',
  plate: '',
  kilometer: '',
  processType: '',
  description: '',
  category: 'Motor' as ServiceCategory,
  partChanged: false,
  partName: '',
  laborFee: 0,
  partFee: 0,
  totalFee: 0,
  vatIncluded: true,
  status: 'Tamamlandı' as ServiceStatus,
};

const paymentInitial = {
  date: '',
  amount: 0,
  type: 'Nakit' as PaymentType,
  note: '',
};

const expenseInitial = {
  date: '',
  title: '',
  description: '',
  amount: 0,
  category: 'Diğer' as ExpenseCategory,
};

function money(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Page() {
  const [db, setDb] = useState<DB>(emptyDB);
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'companies' | 'expenses' | 'reports'>('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [companyForm, setCompanyForm] = useState(companyInitial);
  const [serviceForm, setServiceForm] = useState(serviceInitial);
  const [paymentForm, setPaymentForm] = useState(paymentInitial);
  const [expenseForm, setExpenseForm] = useState(expenseInitial);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setDb(JSON.parse(raw));
    } else {
      const starter: DB = {
        companies: [
          {
            id: uid(),
            name: 'Örnek Filo A.Ş.',
            authorizedPerson: 'Ahmet Kaya',
            phone: '0532 000 00 00',
            address: 'İzmir Sanayi Sitesi 1. Blok',
            note: 'Demo kayıt',
            status: 'Aktif',
            createdAt: new Date().toISOString(),
          },
        ],
        serviceRecords: [],
        payments: [],
        expenses: [],
      };
      setDb(starter);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }
  }, [db, ready]);

  useEffect(() => {
    if (!selectedCompanyId && db.companies[0]) {
      setSelectedCompanyId(db.companies[0].id);
    }
  }, [db.companies, selectedCompanyId]);

  const selectedCompany = db.companies.find((c) => c.id === selectedCompanyId);

  const totals = useMemo(() => {
    const totalIncome = db.serviceRecords.reduce((sum, item) => sum + item.totalFee, 0);
    const totalExpense = db.expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalCollection = db.payments.reduce((sum, item) => sum + item.amount, 0);
    const totalReceivable = totalIncome - totalCollection;
    const waitingPayments = db.serviceRecords
      .filter((item) => item.status === 'Beklemede' || item.status === 'Parça bekleniyor')
      .reduce((sum, item) => sum + item.totalFee, 0);

    return { totalIncome, totalExpense, totalCollection, totalReceivable, waitingPayments };
  }, [db]);

  const companySummaries = useMemo(() => {
    return db.companies.map((company) => {
      const services = db.serviceRecords.filter((item) => item.companyId === company.id);
      const payments = db.payments.filter((item) => item.companyId === company.id);
      const serviceTotal = services.reduce((sum, item) => sum + item.totalFee, 0);
      const paymentTotal = payments.reduce((sum, item) => sum + item.amount, 0);
      return {
        company,
        serviceTotal,
        paymentTotal,
        balance: serviceTotal - paymentTotal,
        serviceCount: services.length,
      };
    });
  }, [db]);

  const selectedServices = db.serviceRecords
    .filter((item) => item.companyId === selectedCompanyId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const selectedPayments = db.payments
    .filter((item) => item.companyId === selectedCompanyId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const selectedBalance = useMemo(() => {
    const serviceTotal = selectedServices.reduce((sum, item) => sum + item.totalFee, 0);
    const paymentTotal = selectedPayments.reduce((sum, item) => sum + item.amount, 0);
    return { serviceTotal, paymentTotal, balance: serviceTotal - paymentTotal };
  }, [selectedServices, selectedPayments]);

  const filteredCompanies = db.companies.filter((company) =>
    [company.name, company.authorizedPerson, company.phone].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  function addCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyForm.name.trim()) return;
    const newCompany: Company = {
      id: uid(),
      ...companyForm,
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => ({ ...prev, companies: [newCompany, ...prev.companies] }));
    setSelectedCompanyId(newCompany.id);
    setCompanyForm(companyInitial);
    setActiveTab('companies');
  }

  function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompanyId || !serviceForm.date || !serviceForm.description.trim()) return;
    const totalFee = Number(serviceForm.laborFee) + Number(serviceForm.partFee);
    const record: ServiceRecord = {
      id: uid(),
      companyId: selectedCompanyId,
      ...serviceForm,
      laborFee: Number(serviceForm.laborFee),
      partFee: Number(serviceForm.partFee),
      totalFee,
    };
    setDb((prev) => ({ ...prev, serviceRecords: [record, ...prev.serviceRecords] }));
    setServiceForm(serviceInitial);
  }

  function addPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompanyId || !paymentForm.date || paymentForm.amount <= 0) return;
    const payment: Payment = {
      id: uid(),
      companyId: selectedCompanyId,
      ...paymentForm,
      amount: Number(paymentForm.amount),
    };
    setDb((prev) => ({ ...prev, payments: [payment, ...prev.payments] }));
    setPaymentForm(paymentInitial);
  }

  function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseForm.date || !expenseForm.title.trim() || expenseForm.amount <= 0) return;
    const expense: Expense = {
      id: uid(),
      ...expenseForm,
      amount: Number(expenseForm.amount),
    };
    setDb((prev) => ({ ...prev, expenses: [expense, ...prev.expenses] }));
    setExpenseForm(expenseInitial);
    setActiveTab('expenses');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ege-car-service-yedek.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setDb(parsed);
      } catch {
        alert('Geçersiz yedek dosyası.');
      }
    };
    reader.readAsText(file);
  }

  if (!ready) return <main className="loading">Yükleniyor...</main>;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="logo-box">ECS</div>
          <h1>Ege Car Service</h1>
          <p>Gelir gider ve servis takip paneli</p>
        </div>

        <nav className="nav-list">
          <button className={activeTab === 'dashboard' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button className={activeTab === 'companies' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('companies')}>Firmalar</button>
          <button className={activeTab === 'expenses' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('expenses')}>Giderler</button>
          <button className={activeTab === 'reports' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('reports')}>Raporlar</button>
        </nav>

        <div className="sidebar-actions">
          <button className="secondary-btn" onClick={exportData}>Yedek Al</button>
          <label className="secondary-btn file-btn">
            Yedek Yükle
            <input type="file" accept="application/json" onChange={importData} />
          </label>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <h2>Hoş geldin</h2>
            <p>Bugün dükkanın finans ve servis akışını buradan yönetebilirsin.</p>
          </div>
          <div className="badge">Ücretsiz MVP Panel</div>
        </header>

        {activeTab === 'dashboard' && (
          <>
            <section className="stats-grid">
              <StatCard title="Toplam Gelir" value={money(totals.totalIncome)} />
              <StatCard title="Toplam Gider" value={money(totals.totalExpense)} />
              <StatCard title="Toplam Tahsilat" value={money(totals.totalCollection)} />
              <StatCard title="Toplam Alacak" value={money(totals.totalReceivable)} />
              <StatCard title="Bekleyen Ödemeler" value={money(totals.waitingPayments)} />
              <StatCard title="Net Durum" value={money(totals.totalCollection - totals.totalExpense)} />
            </section>

            <section className="panel-grid">
              <div className="panel-card">
                <div className="panel-head">
                  <h3>Son İşlemler</h3>
                </div>
                <div className="list-wrap">
                  {db.serviceRecords.slice(0, 6).map((item) => {
                    const company = db.companies.find((c) => c.id === item.companyId);
                    return (
                      <div key={item.id} className="list-item">
                        <div>
                          <strong>{company?.name || 'Firma silinmiş'}</strong>
                          <p>{item.date} • {item.brand} {item.model} • {item.description}</p>
                        </div>
                        <span>{money(item.totalFee)}</span>
                      </div>
                    );
                  })}
                  {!db.serviceRecords.length && <p className="empty">Henüz servis kaydı yok.</p>}
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-head">
                  <h3>Son Tahsilatlar</h3>
                </div>
                <div className="list-wrap">
                  {db.payments.slice(0, 6).map((item) => {
                    const company = db.companies.find((c) => c.id === item.companyId);
                    return (
                      <div key={item.id} className="list-item">
                        <div>
                          <strong>{company?.name || 'Firma silinmiş'}</strong>
                          <p>{item.date} • {item.type}</p>
                        </div>
                        <span>{money(item.amount)}</span>
                      </div>
                    );
                  })}
                  {!db.payments.length && <p className="empty">Henüz ödeme kaydı yok.</p>}
                </div>
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-head">
                <h3>Firma Bazlı Borç / Alacak Özeti</h3>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Firma</th>
                      <th>İşlem Toplamı</th>
                      <th>Tahsilat</th>
                      <th>Kalan</th>
                      <th>Kayıt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companySummaries.map((row) => (
                      <tr key={row.company.id}>
                        <td>{row.company.name}</td>
                        <td>{money(row.serviceTotal)}</td>
                        <td>{money(row.paymentTotal)}</td>
                        <td>{money(row.balance)}</td>
                        <td>{row.serviceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === 'companies' && (
          <>
            <section className="panel-grid">
              <form className="panel-card form-card" onSubmit={addCompany}>
                <div className="panel-head"><h3>Yeni Firma Ekle</h3></div>
                <div className="form-grid">
                  <Input label="Firma Adı" value={companyForm.name} onChange={(v) => setCompanyForm({ ...companyForm, name: v })} />
                  <Input label="Yetkili Kişi" value={companyForm.authorizedPerson} onChange={(v) => setCompanyForm({ ...companyForm, authorizedPerson: v })} />
                  <Input label="Telefon" value={companyForm.phone} onChange={(v) => setCompanyForm({ ...companyForm, phone: v })} />
                  <Input label="Adres" value={companyForm.address} onChange={(v) => setCompanyForm({ ...companyForm, address: v })} />
                  <Input label="Not" value={companyForm.note} onChange={(v) => setCompanyForm({ ...companyForm, note: v })} />
                  <Select label="Durum" value={companyForm.status} onChange={(v) => setCompanyForm({ ...companyForm, status: v as CompanyStatus })} options={['Aktif', 'Pasif']} />
                </div>
                <button className="primary-btn" type="submit">Firmayı Kaydet</button>
              </form>

              <div className="panel-card">
                <div className="panel-head">
                  <h3>Firma Listesi</h3>
                  <input className="search-input" placeholder="Firma ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="list-wrap company-list">
                  {filteredCompanies.map((company) => (
                    <button
                      key={company.id}
                      className={selectedCompanyId === company.id ? 'company-item active' : 'company-item'}
                      onClick={() => setSelectedCompanyId(company.id)}
                    >
                      <div>
                        <strong>{company.name}</strong>
                        <p>{company.authorizedPerson} • {company.phone}</p>
                      </div>
                      <span>{company.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {selectedCompany && (
              <>
                <section className="panel-card company-header">
                  <div>
                    <h3>{selectedCompany.name}</h3>
                    <p>{selectedCompany.authorizedPerson} • {selectedCompany.phone}</p>
                    <p>{selectedCompany.address}</p>
                  </div>
                  <div className="summary-boxes">
                    <MiniStat label="Hizmet Toplamı" value={money(selectedBalance.serviceTotal)} />
                    <MiniStat label="Tahsilat" value={money(selectedBalance.paymentTotal)} />
                    <MiniStat label="Kalan" value={money(selectedBalance.balance)} />
                  </div>
                </section>

                <section className="panel-grid">
                  <form className="panel-card form-card" onSubmit={addService}>
                    <div className="panel-head"><h3>Servis Kaydı Ekle</h3></div>
                    <div className="form-grid">
                      <Input type="date" label="İşlem Tarihi" value={serviceForm.date} onChange={(v) => setServiceForm({ ...serviceForm, date: v })} />
                      <Input label="Araç Markası" value={serviceForm.brand} onChange={(v) => setServiceForm({ ...serviceForm, brand: v })} />
                      <Input label="Araç Modeli" value={serviceForm.model} onChange={(v) => setServiceForm({ ...serviceForm, model: v })} />
                      <Input label="Araç Yılı" value={serviceForm.year} onChange={(v) => setServiceForm({ ...serviceForm, year: v })} />
                      <Input label="Plaka" value={serviceForm.plate} onChange={(v) => setServiceForm({ ...serviceForm, plate: v })} />
                      <Input label="Kilometre" value={serviceForm.kilometer} onChange={(v) => setServiceForm({ ...serviceForm, kilometer: v })} />
                      <Input label="İşlem Türü" value={serviceForm.processType} onChange={(v) => setServiceForm({ ...serviceForm, processType: v })} />
                      <Select label="Kategori" value={serviceForm.category} onChange={(v) => setServiceForm({ ...serviceForm, category: v as ServiceCategory })} options={['Motor', 'Mekanik', 'Elektrik', 'Kaporta', 'Bakım', 'Diğer']} />
                      <Input label="Parça Adı" value={serviceForm.partName} onChange={(v) => setServiceForm({ ...serviceForm, partName: v })} />
                      <Select label="Durum" value={serviceForm.status} onChange={(v) => setServiceForm({ ...serviceForm, status: v as ServiceStatus })} options={['Tamamlandı', 'Beklemede', 'Parça bekleniyor', 'Teslim edildi']} />
                      <Input type="number" label="İşçilik Ücreti" value={String(serviceForm.laborFee)} onChange={(v) => setServiceForm({ ...serviceForm, laborFee: Number(v) })} />
                      <Input type="number" label="Parça Ücreti" value={String(serviceForm.partFee)} onChange={(v) => setServiceForm({ ...serviceForm, partFee: Number(v) })} />
                    </div>
                    <label className="textarea-label">
                      <span>Açıklama / Ne Yapıldı</span>
                      <textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
                    </label>
                    <div className="checkbox-row">
                      <label><input type="checkbox" checked={serviceForm.partChanged} onChange={(e) => setServiceForm({ ...serviceForm, partChanged: e.target.checked })} /> Parça değişti</label>
                      <label><input type="checkbox" checked={serviceForm.vatIncluded} onChange={(e) => setServiceForm({ ...serviceForm, vatIncluded: e.target.checked })} /> KDV dahil</label>
                    </div>
                    <button className="primary-btn" type="submit">Servis Kaydı Ekle</button>
                  </form>

                  <form className="panel-card form-card" onSubmit={addPayment}>
                    <div className="panel-head"><h3>Ödeme Ekle</h3></div>
                    <div className="form-grid">
                      <Input type="date" label="Ödeme Tarihi" value={paymentForm.date} onChange={(v) => setPaymentForm({ ...paymentForm, date: v })} />
                      <Input type="number" label="Tutar" value={String(paymentForm.amount)} onChange={(v) => setPaymentForm({ ...paymentForm, amount: Number(v) })} />
                      <Select label="Ödeme Tipi" value={paymentForm.type} onChange={(v) => setPaymentForm({ ...paymentForm, type: v as PaymentType })} options={['Nakit', 'Havale / EFT', 'Kart', 'Veresiye']} />
                    </div>
                    <label className="textarea-label">
                      <span>Ödeme Notu</span>
                      <textarea value={paymentForm.note} onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} />
                    </label>
                    <button className="primary-btn" type="submit">Ödemeyi Kaydet</button>
                  </form>
                </section>

                <section className="panel-grid">
                  <div className="panel-card">
                    <div className="panel-head"><h3>Servis Geçmişi</h3></div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Tarih</th>
                            <th>Araç</th>
                            <th>Kategori</th>
                            <th>Açıklama</th>
                            <th>Durum</th>
                            <th>Tutar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedServices.map((item) => (
                            <tr key={item.id}>
                              <td>{item.date}</td>
                              <td>{item.brand} {item.model} {item.year}</td>
                              <td>{item.category}</td>
                              <td>{item.description}</td>
                              <td>{item.status}</td>
                              <td>{money(item.totalFee)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!selectedServices.length && <p className="empty">Bu firmaya ait servis kaydı yok.</p>}
                    </div>
                  </div>

                  <div className="panel-card">
                    <div className="panel-head"><h3>Ödeme Geçmişi</h3></div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Tarih</th>
                            <th>Tip</th>
                            <th>Not</th>
                            <th>Tutar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPayments.map((item) => (
                            <tr key={item.id}>
                              <td>{item.date}</td>
                              <td>{item.type}</td>
                              <td>{item.note || '-'}</td>
                              <td>{money(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!selectedPayments.length && <p className="empty">Bu firmaya ait ödeme yok.</p>}
                    </div>
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {activeTab === 'expenses' && (
          <>
            <section className="panel-grid">
              <form className="panel-card form-card" onSubmit={addExpense}>
                <div className="panel-head"><h3>Gider Ekle</h3></div>
                <div className="form-grid">
                  <Input type="date" label="Tarih" value={expenseForm.date} onChange={(v) => setExpenseForm({ ...expenseForm, date: v })} />
                  <Input label="Gider Başlığı" value={expenseForm.title} onChange={(v) => setExpenseForm({ ...expenseForm, title: v })} />
                  <Input type="number" label="Tutar" value={String(expenseForm.amount)} onChange={(v) => setExpenseForm({ ...expenseForm, amount: Number(v) })} />
                  <Select label="Kategori" value={expenseForm.category} onChange={(v) => setExpenseForm({ ...expenseForm, category: v as ExpenseCategory })} options={['Kira', 'Elektrik', 'Su', 'Parça alımı', 'Personel', 'Vergi', 'Diğer']} />
                </div>
                <label className="textarea-label">
                  <span>Açıklama</span>
                  <textarea value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                </label>
                <button className="primary-btn" type="submit">Gideri Kaydet</button>
              </form>

              <div className="panel-card">
                <div className="panel-head"><h3>Gider Listesi</h3></div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Başlık</th>
                        <th>Kategori</th>
                        <th>Açıklama</th>
                        <th>Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.expenses.map((item) => (
                        <tr key={item.id}>
                          <td>{item.date}</td>
                          <td>{item.title}</td>
                          <td>{item.category}</td>
                          <td>{item.description}</td>
                          <td>{money(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!db.expenses.length && <p className="empty">Henüz gider girilmemiş.</p>}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'reports' && (
          <section className="panel-grid">
            <div className="panel-card">
              <div className="panel-head"><h3>Rapor Özeti</h3></div>
              <div className="report-grid">
                <MiniStat label="Günlük Gelir" value={money(sumByDate(db.serviceRecords, today()))} />
                <MiniStat label="Günlük Gider" value={money(sumExpenseByDate(db.expenses, today()))} />
                <MiniStat label="Aylık Gelir" value={money(sumByMonth(db.serviceRecords, monthPrefix()))} />
                <MiniStat label="Aylık Gider" value={money(sumExpenseByMonth(db.expenses, monthPrefix()))} />
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-head"><h3>En Çok İşlem Yapılan Firmalar</h3></div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Firma</th>
                      <th>İşlem Adedi</th>
                      <th>Toplam Tutar</th>
                      <th>Kalan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...companySummaries]
                      .sort((a, b) => b.serviceCount - a.serviceCount)
                      .slice(0, 10)
                      .map((row) => (
                        <tr key={row.company.id}>
                          <td>{row.company.name}</td>
                          <td>{row.serviceCount}</td>
                          <td>{money(row.serviceTotal)}</td>
                          <td>{money(row.balance)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthPrefix() {
  return new Date().toISOString().slice(0, 7);
}

function sumByDate(records: ServiceRecord[], date: string) {
  return records.filter((item) => item.date === date).reduce((sum, item) => sum + item.totalFee, 0);
}

function sumExpenseByDate(records: Expense[], date: string) {
  return records.filter((item) => item.date === date).reduce((sum, item) => sum + item.amount, 0);
}

function sumByMonth(records: ServiceRecord[], prefix: string) {
  return records.filter((item) => item.date.startsWith(prefix)).reduce((sum, item) => sum + item.totalFee, 0);
}

function sumExpenseByMonth(records: Expense[], prefix: string) {
  return records.filter((item) => item.date.startsWith(prefix)).reduce((sum, item) => sum + item.amount, 0);
}
