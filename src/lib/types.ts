
export type UserRole = 'admin' | 'professional';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
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
