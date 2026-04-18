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
  firmId: string;
  date: string;
  plate?: string;
  brand?: string;
  model?: string;
  year?: string;
  processSummary: string;
  details?: string;
  partPurchased?: string;
  partCost?: number;
  laborCost?: number;
  totalCost?: number;
  onCredit?: number;
  tested?: boolean;
  delivered?: boolean;
  status?: string;
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
