export interface UserShort {
  id: number
  first_name: string | null
  last_name: string | null
  middle_name: string | null
  email: string | null
  phone: string | null
  is_doctor: boolean
  is_admin: boolean
  avatar_path: string | null
  preliminary_conclusion: string | null
  age: number | null
  height: string | null
  weight: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: number
  is_doctor: boolean
  is_admin: boolean
  profile_complete: boolean
  user?: UserShort | null
}

export interface Me {
  id: number
  first_name: string | null
  last_name: string | null
  middle_name: string | null
  phone: string | null
  email: string | null
  is_doctor: boolean
  is_admin: boolean
  profile_complete: boolean
  avatar_path: string | null
  preliminary_conclusion: string | null
  age: number | null
  height: string | null
  weight: string | null
}

export interface Doctor {
  id: number
  full_name: string
  first_name: string | null
  last_name: string | null
  position: string | null
  experience_years: number | null
  avatar_path: string | null
  address: string | null
  phone: string | null
}

export interface Patient {
  id: number
  name: string
  age: number | null
  city: string | null
  phone: string | null
  avatar_path: string | null
  last_test_score: number | null
}

export interface Test {
  id: number
  hash: string
  user_id: number | null
  payload: Record<string, { answer: string; point: number }> | null
  points: number
  neurocognitive_score: number
  completed_at: string | null
  created_at: string
}

export interface DayInfo { date: string; label: string; has_slots: boolean; is_past: boolean }
export interface SlotGroup { time: string; end: string; types: { online?: number; offline?: number } }
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export interface Appointment {
  id: number
  patient_id: number | null
  doctor_id: number | null
  date: string | null
  start_time: string | null
  end_time: string | null
  type: string | null
  status: AppointmentStatus
  created_at: string
  patient?: Doctor | null
  doctor?: Doctor | null
  conclusion?: Conclusion | null
}

export interface Conclusion {
  id: number
  appointment_id: number
  patient_id: number
  doctor_id: number
  complaints: string | null
  diagnosis: string | null
  medications: string | null
  diet_recommendations: string | null
  examination_recommendations: string | null
  created_at: string
  updated_at: string
  appointment_date?: string | null
  doctor_name?: string | null
}

export interface Analysis {
  id: number
  file_name: string
  file_path: string
  description: string | null
  uploaded_at: string
}

export interface PatientDetail {
  patient: {
    id: number; full_name: string; first_name: string | null; last_name: string | null
    middle_name: string | null; phone: string | null; birth_date: string | null; age: number | null
    medical_history: string | null; chronic_diseases: string | null; medication_allergies: string | null
    preliminary_conclusion: string | null; avatar_path: string | null
  }
  appointments: Array<{ id: number; date: string; start_time: string; end_time: string; type: string; status: AppointmentStatus }>
  conclusions: Array<{
    id: number; appointment_id: number; complaints: string | null; diagnosis: string | null
    medications: string | null; diet_recommendations: string | null; examination_recommendations: string | null
    created_at: string; appointment_date: string | null
  }>
  analyses: Array<{ id: number; file_name: string; file_path: string; description: string | null; uploaded_at: string }>
  last_test: { hash: string; score: number; points: number; completed_at: string | null } | null
}

export interface SlotConfig { enabled: boolean; type: 'online' | 'offline' | 'both' }
export type WeekSchedule = Record<number, Record<string, SlotConfig>>

export interface AuditLog {
  id: number; user_id: number | null; event_type: string; description: string | null
  ip_address: string | null; created_at: string
}

// Алиасы
export type DaySlot = DayInfo
export interface ScheduleData {
  schedule: WeekSchedule
  time_slots: string[]
  slot_duration: number
}
