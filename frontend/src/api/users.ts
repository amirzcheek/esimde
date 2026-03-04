import { apiClient } from './client'
import type { Doctor, Patient, PatientDetail, Conclusion } from '@/types'

export const usersApi = {
  doctors: () => apiClient.get<Doctor[]>('/doctors'),

  updateProfile: (data: Record<string, unknown>) =>
    apiClient.patch('/users/me', data),

  updateDoctorProfile: (data: Record<string, unknown>) =>
    apiClient.patch('/users/me/doctor-profile', data),

  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<{ avatar_path: string }>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  patients:  () => apiClient.get<Patient[]>('/patients'),
  patient:   (id: number) => apiClient.get<PatientDetail>(`/patients/${id}`),
  updateConclusion: (id: number, data: Partial<Conclusion>) =>
    apiClient.put<Conclusion>(`/conclusions/${id}`, data),
}
