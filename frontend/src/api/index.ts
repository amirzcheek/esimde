import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Хелпер для URL аватара — бэкенд отдаёт статику на /uploads/
export const getAvatarUrl = (path?: string | null): string | null => {
  if (!path) return null
  if (path.startsWith('http')) return path
  // Vite проксирует /uploads → http://localhost:8000/uploads
  return `/uploads/${path}`
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
    || localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp:     (data: { phone?: string; email?: string }) =>
    api.post('/auth/send-otp', data),
  verifyOtp:   (data: { phone?: string; email?: string; code: string }) =>
    api.post('/auth/verify-otp', data),
  doctorLogin: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  me:          () => api.get('/auth/me'),
  logout:      () => api.post('/auth/logout'),

  // алиасы для совместимости
  sendCode:    (data: { phone?: string; email?: string }) =>
    api.post('/auth/send-otp', data),
  verifyCode:  (data: { phone?: string; email?: string; code: string }) =>
    api.post('/auth/verify-otp', data),
  loginDoctor: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
}

// ─── Tests ─────────────────────────────────────────────────────────────────
export const testsApi = {
  start:      () => api.post('/tests/start'),
  startGuest: () => api.post('/tests/start-guest'),
  get:        (hash: string) => api.get(`/tests/${hash}`),
  answer:     (hash: string, d: any) => api.post(`/tests/${hash}/answer`, d),
}

// ─── Appointments ──────────────────────────────────────────────────────────
export const appointmentsApi = {
  weekSlots:    (doctor_id: number, week_offset = 0) =>
    api.get('/appointments/week-slots', { params: { doctor_id, week_offset } }),
  daySlots:     (doctor_id: number, slot_date: string) =>
    api.get('/appointments/day-slots', { params: { doctor_id, slot_date } }),
  book:         (slot_id: number) => api.post('/appointments', { slot_id }),
  getActive:    () => api.get('/appointments/active'),
  get:          (id: number) => api.get(`/appointments/${id}`),
  cancel:       (id: number) => api.delete(`/appointments/${id}`),
  updateStatus: (id: number, status: string) =>
    api.patch(`/appointments/${id}/status`, { status }),
  doctorList:   (status?: string) =>
    api.get('/appointments/doctor/list', { params: status ? { status_filter: status } : {} }),
  todayList:    () => api.get('/doctor/today-appointments'),
}

// ─── Schedule ──────────────────────────────────────────────────────────────
export const scheduleApi = {
  get:  () => api.get('/schedule'),
  save: (schedule: any, generate_weeks = 4) =>
    api.post('/schedule', { schedule, generate_weeks }),
}

// ─── Doctors / Users ───────────────────────────────────────────────────────
export const doctorsApi = {
  list: () => api.get('/doctors'),
}

export const usersApi = {
  getProfile: () => api.get('/users/me/profile'),
  profile:    () => api.get('/users/me/profile'),
  updateProfile:       (d: any) => api.patch('/users/me', d),
  updateDoctorProfile: (d: any) => api.patch('/users/me/doctor-profile', d),
  uploadAvatar:        (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ─── Patients ──────────────────────────────────────────────────────────────
export const patientsApi = {
  list: () => api.get('/patients'),
  get:  (id: number) => api.get(`/patients/${id}`),
  updatePreliminary: (id: number, text: string) => api.patch(`/patients/${id}/preliminary-conclusion`, { preliminary_conclusion: text }),
}

// ─── Conclusions ───────────────────────────────────────────────────────────
export const conclusionsApi = {
  list:   () => api.get('/conclusions/patient'),
  update: (id: number, d: any) => api.put(`/conclusions/${id}`, d),
}

// ─── Analyses ──────────────────────────────────────────────────────────────
export const analysesApi = {
  list:   () => api.get('/analyses'),
  upload: (file: File, description?: string) => {
    const fd = new FormData()
    fd.append('file', file)
    if (description) fd.append('description', description)
    return api.post('/analyses', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  delete: (id: number) => api.delete(`/analyses/${id}`),
}

// ─── Voice ─────────────────────────────────────────────────────────────────
export const voiceApi = {
  transcribe: (audio: Blob) => {
    const fd = new FormData()
    fd.append('file', audio, 'recording.webm')  // бэк ждёт 'file', не 'audio'
    return api.post('/voice/transcribe', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  structure: (answers: string[]) => api.post('/voice/structure', { answers }),
  save:      (d: any) => api.post('/voice/save', d),
}

// ─── Admin / Audit ─────────────────────────────────────────────────────────
export const auditApi = {
  logs:  (params?: any) => api.get('/admin/audit-logs', { params }),
  stats: () => api.get('/admin/stats'),
  users: (params?: any) => api.get('/admin/users', { params }),
}

// ─── News ──────────────────────────────────────────────────────────────────
export const newsApi = {
  list:        (page = 1, per_page = 10) => api.get('/news', { params: { page, per_page } }),
  get:         (id: number) => api.get(`/news/${id}`),
  adminList:   () => api.get('/news/admin/all'),
  create:      (data: FormData) => api.post('/news', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:      (id: number, data: FormData) => api.patch(`/news/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:      (id: number) => api.delete(`/news/${id}`),
}

// ─── Memories ──────────────────────────────────────────────────────────────
export const memoriesApi = {
  list:   () => api.get('/memories'),
  random: () => api.get('/memories/random'),
  create: (data: FormData) => api.post('/memories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: FormData) => api.put(`/memories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/memories/${id}`),
}
