import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Me } from '@/types'

interface AuthState {
  token: string | null
  user: Me | null
  isDoctor: boolean
  isAdmin: boolean
  setToken: (token: string) => void
  setUser: (user: Me) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isDoctor: false,
      isAdmin: false,
      setToken: (token) => {
        localStorage.setItem('access_token', token)
        set({ token })
      },
      setUser: (user) => set({
        user,
        isDoctor: user.is_doctor,
        isAdmin: user.is_admin,
      }),
      logout: () => {
        localStorage.removeItem('access_token')
        set({ token: null, user: null, isDoctor: false, isAdmin: false })
      },
    }),
    {
      name: 'esimde-auth',
      partialize: (s) => ({ token: s.token, user: s.user, isDoctor: s.isDoctor, isAdmin: s.isAdmin }),
    },
  ),
)
