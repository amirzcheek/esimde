import { apiClient } from './client'
import type { WeekSchedule, SlotConfig } from '@/types'

export interface ScheduleData {
  schedule: WeekSchedule
  time_slots: string[]
  slot_duration: number
}

export const scheduleApi = {
  get: () => apiClient.get<ScheduleData>('/schedule'),
  save: (schedule: WeekSchedule, generateWeeks = 4) =>
    apiClient.post<{ message: string; slots_created: number }>('/schedule', {
      schedule,
      generate_weeks: generateWeeks,
    }),
}
