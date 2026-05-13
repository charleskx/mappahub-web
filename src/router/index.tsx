import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/auth'
import Shell from '../components/layout/Shell'

const LoginPage = lazy(() => import('../features/auth/LoginPage'))
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'))
const ForgotPage = lazy(() => import('../features/auth/ForgotPage'))
const VerifyEmailPage = lazy(() => import('../features/auth/VerifyEmailPage'))
const TwoFactorPage = lazy(() => import('../features/auth/TwoFactorPage'))
const OnboardingPage = lazy(() => import('../features/auth/OnboardingPage'))

const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'))
const PartnersPage = lazy(() => import('../features/partners/PartnersPage'))
const MapPage = lazy(() => import('../features/map/MapPage'))
const PublicMapPage = lazy(() => import('../features/map/PublicMapPage'))
const PublicMapsPage = lazy(() => import('../features/map/PublicMapsPage'))
const ImportPage = lazy(() => import('../features/import/ImportPage'))
const ExportPage = lazy(() => import('../features/export/ExportPage'))
const IntegrationsPage = lazy(() => import('../features/integrations/IntegrationsPage'))
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'))
const TeamPage = lazy(() => import('../features/team/TeamPage'))
const BillingPage = lazy(() => import('../features/billing/BillingPage'))
const SuperAdminPage = lazy(() => import('../features/super-admin/SuperAdminPage'))
const PinTypesPage = lazy(() => import('../features/pin-types/PinTypesPage'))
const TicketsPage = lazy(() => import('../features/tickets/TicketsPage'))

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="skel" style={{ width: 40, height: 40, borderRadius: 20 }} />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Loader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Loader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function AppRouter() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Guest routes */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot" element={<GuestRoute><ForgotPage /></GuestRoute>} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/2fa" element={<TwoFactorPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

        {/* Public map — no auth required */}
        <Route path="/public-map/:token" element={<PublicMapPage />} />

        {/* Protected shell routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Shell>
                <Routes>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="partners" element={<PartnersPage />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="public-map" element={<PublicMapsPage />} />
                  <Route path="import" element={<ImportPage />} />
                  <Route path="export" element={<ExportPage />} />
                  <Route path="integrations" element={<IntegrationsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="team" element={<TeamPage />} />
                  <Route path="billing" element={<BillingPage />} />
                  <Route path="pin-types" element={<PinTypesPage />} />
                  <Route path="admin" element={<SuperAdminPage />} />
                  <Route path="support" element={<TicketsPage />} />
                </Routes>
              </Shell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  )
}
