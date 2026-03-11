import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/shared/ProtectedRoute'

import LandingPage        from '@/pages/LandingPage'
import TestInfoPage       from '@/pages/TestInfoPage'
import LoginPage          from '@/pages/auth/LoginPage'
import DashboardPage      from '@/pages/patient/DashboardPage'
import AppointmentPage    from '@/pages/patient/AppointmentPage'
import SettingsPage       from '@/pages/patient/SettingsPage'
import TestPage           from '@/pages/patient/TestPage'
import ReportPage         from '@/pages/patient/ReportPage'
import VoiceAssistantPage from '@/pages/patient/VoiceAssistantPage'
import DoctorDashboard    from '@/pages/doctor/DoctorDashboard'
import CalendarPage       from '@/pages/doctor/CalendarPage'
import PatientsPage       from '@/pages/doctor/PatientsPage'
import PatientDetailPage  from '@/pages/doctor/PatientDetailPage'
import SchedulePage       from '@/pages/doctor/SchedulePage'
import DoctorProfilePage  from '@/pages/doctor/DoctorProfilePage'
import AdminPage          from '@/pages/admin/AdminPage'
import NewsPage           from '@/pages/patient/NewsPage'

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public */}
          <Route element={<AppLayout />}>
            <Route path="/"             element={<LandingPage />} />
            <Route path="/test"         element={<TestInfoPage />} />
            <Route path="/test/go"      element={<TestPage />} />
            <Route path="/report/:hash" element={<ReportPage />} />
            <Route path="/news"          element={<NewsPage />} />
          </Route>

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />

          {/* Patient routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard"              element={<DashboardPage />} />
            <Route path="/dashboard/settings"     element={<SettingsPage />} />
            <Route path="/appointment"            element={<AppointmentPage />} />
            <Route path="/voice-assistant"        element={<VoiceAssistantPage />} />
          </Route>

          {/* Doctor routes */}
          <Route element={<ProtectedRoute requireDoctor><AppLayout /></ProtectedRoute>}>
            <Route path="/doctor"              element={<DoctorDashboard />} />
            <Route path="/doctor/calendar"     element={<CalendarPage />} />
            <Route path="/doctor/patients"     element={<PatientsPage />} />
            <Route path="/doctor/patients/:id" element={<PatientDetailPage />} />
            <Route path="/doctor/schedule"     element={<SchedulePage />} />
            <Route path="/doctor/profile"      element={<DoctorProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/admin/audit" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
