
export type UserRole = 'admin' | 'professional';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  specialty: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  diagnosis: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  professional_id: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  patient_id: string;
  professional_id: string;
  amount: number;
  description: string | null;
  status: PaymentStatus;
  payment_date: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
}
