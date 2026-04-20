export type UserRole = 'admin' | 'personel';

export type AppUser = {
  uid: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: UserRole;
  active: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

export type Firm = {
  id: string;
  name: string;
  managerName?: string;
  phone?: string;
  address?: string;
  note?: string;
  active: boolean;
  createdAt: string;
  createdByUid: string;
};

export type ServiceRecord = {
  id: string;

  // 👤 müşteri
  customerName?: string;
  phone?: string;

  // 🚗 araç
  plate?: string;
  brand?: string;
  model?: string;
  year?: string;
  fuelType?: string;

  // 🔧 servis
  faultType?: string;
  processSummary?: string;
  description?: string;
  details?: string;
  status?: string;

  // 💰 ücret
  partCost?: number;
  laborCost?: number;
  totalCost?: number;
  onCredit?: number;

  // ✔️ durum
  tested?: boolean;
  delivered?: boolean;

  // 📅 meta
  date: string;
  createdAt: string;
  createdByUid: string;
  createdByName: string;
};

export type PaymentRecord = {
  id: string;
  firmId: string;
  date: string;
  type: 'alinan' | 'verilen' | 'veresiye' | 'borc-kapatma';
  amount: number;
  note?: string;
  createdAt: string;
  createdByUid: string;
  createdByName: string;
};

export type AppSettings = {
  systemName: string;
  logoUrl?: string;
  updatedAt?: string;
  updatedBy?: string;
};
