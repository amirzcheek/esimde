import { apiClient } from './client'
import type { Test } from '@/types'

export const testsApi = {
  startGuest: () => apiClient.post<Test>('/tests/start-guest'),
  start:      () => apiClient.post<Test>('/tests/start'),
  get:        (hash: string) => apiClient.get<Test>(`/tests/${hash}`),
  answer: (hash: string, data: {
    current_question: number
    answer: string
    point: number
    next_question: number
    email?: string
    phone?: string
    first_name?: string
    last_name?: string
  }) => apiClient.post<Test>(`/tests/${hash}/answer`, data),
}
