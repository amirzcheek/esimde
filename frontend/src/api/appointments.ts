import { apiClient } from './client'
import type { Appointment, AppointmentStatus, DayInfo, SlotGroup } from '@/types'

export const appointmentsApi = {
  weekSlots: (doctorId: number, weekOffset = 0) =>
    apiClient.get<{ week_offset: number; days: DayInfo[] }>('/appointments/week-slots', {
      params: { doctor_id: doctorId, week_offset: weekOffset },
    }),

  daySlots: (doctorId: number, date: string) =>
    apiClient.get<{ date: string; slots: SlotGroup[] }>('/appointments/day-slots', {
      params: { doctor_id: doctorId, slot_date: date },
    }),

  book: (slotId: number) =>
    apiClient.post<Appointment>('/appointments', { slot_id: slotId }),

  active: () =>
    apiClient.get<Appointment | null>('/appointments/active'),

  cancel: (id: number) =>
    apiClient.delete(`/appointments/${id}`),

  updateStatus: (id: number, status: AppointmentStatus) =>
    apiClient.patch<Appointment>(`/appointments/${id}/status`, { status }),

  doctorList: (status?: string) =>
    apiClient.get<Appointment[]>('/appointments/doctor/list', {
      params: status ? { status_filter: status } : {},
    }),
}
