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

export type ServiceItem = {
  title: string;
  amount: number;
};
export type ServiceRecord = {
  id: string;
  customerId: string;
  vehicleId: string;
  date: string;
  faultType:
    | 'Motor'
    | 'Şanzıman'
    | 'Mekanik'
    | 'Alt Takım'
    | 'Elektrik'
    | 'Yağ Bakım Benzinli'
    | 'Yağ Bakım Dizel'
    | 'Fren Sistemi'
    | 'Klima'
    | 'Lastik / Rot Balans'
    | 'Akü'
    | 'Diğer';

  description?: string;
  status?: string;
  kilometer?: number;
  
  items?: ServiceItem[];

  partCost?: number;
  laborCost?: number;
  totalCost?: number;

  tested?: boolean;
  delivered?: boolean;

  createdAt: string;
createdByUid: string;
createdByName: string;

updatedAt?: string;
updatedBy?: string;
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

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  note?: string;
  createdAt: string;
  createdByUid: string;
};

export type Vehicle = {
  id: string;
  customerId: string;
  plate: string;
  brand: string;
  model: string;
  year?: string;
  fuelType?: 'Benzin' | 'Dizel' | 'LPG' | 'Hybrid' | 'Elektrik';
  chassisNo?: string;
  engineNo?: string;
  note?: string;
  createdAt: string;
  createdByUid: string;
};
