import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { SiteFooter } from './components/Closing'
import { SiteNav } from './components/SiteNav'
import { BackToTop, ScrollProgressBar } from './components/primitives'
import { RouteFallback } from './components/RouteFallback'
import { useScrollToHash } from './lib/useScrollToHash'
import { RequirementProvider } from './lib/requirement'
import { AuthProvider } from './lib/auth'
import { trackVisit } from './lib/db'
import { installSpotlight } from './lib/motion'
import Landing from './pages/Landing'

/**
 * The landing page ships in the initial bundle because it is what most
 * visitors load first. Everything else is split per route, which keeps
 * the charting and configurator code out of the first paint.
 */
const Industries = lazy(() => import('./pages/IndustriesIndex'))
const IndustryDetail = lazy(() => import('./pages/IndustryDetail'))
const ProductsIndex = lazy(() => import('./pages/ProductsIndex'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const ControlPanelsPage = lazy(() => import('./pages/ControlPanelsPage'))
const Configure = lazy(() => import('./pages/Configure'))
const Configurators = lazy(() => import('./pages/Configurators'))
const IiotDashboard = lazy(() => import('./pages/IiotDashboard'))
const Rfq = lazy(() => import('./pages/Rfq'))
const StandardsPage = lazy(() => import('./pages/StandardsPage'))
const CaseStudies = lazy(() => import('./pages/CaseStudies'))
const Consult = lazy(() => import('./pages/Consult'))
const NotFound = lazy(() => import('./pages/NotFound'))

/* Sign-in and the portal: their own chunks, their own chrome. */
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/AccountFlows').then((m) => ({ default: m.Signup })))
const VerifyEmail = lazy(() => import('./pages/auth/AccountFlows').then((m) => ({ default: m.VerifyEmail })))
const ForgotPassword = lazy(() => import('./pages/auth/AccountFlows').then((m) => ({ default: m.ForgotPassword })))
const ResetPassword = lazy(() => import('./pages/auth/AccountFlows').then((m) => ({ default: m.ResetPassword })))
const Portal = lazy(() => import('./pages/portal/Portal'))

/** Routes that replace the public site's header, footer and action bar. */
const APP_ROUTES = /^\/(portal|login|signup|verify-email|forgot-password|reset-password)(\/|$)/

export default function App() {
  useScrollToHash()
  const { pathname } = useLocation()
  const appRoute = APP_ROUTES.test(pathname)
  // App routes render their own <main>; a second one would nest landmarks.
  const Shell = appRoute ? 'div' : 'main'

  // Every public page view is recorded, so the portal's analytics start
  // at zero and count real use. Portal and sign-in pages are not counted.
  useEffect(() => {
    if (!appRoute) trackVisit(pathname)
  }, [appRoute, pathname])

  useEffect(() => installSpotlight(), [])

  return (
    <AuthProvider>
      <RequirementProvider>
        {!appRoute && <ScrollProgressBar />}
        {!appRoute && <SiteNav />}
        <Shell id={appRoute ? undefined : 'main'}>
          {/* Public pages settle in on navigation; the portal keeps its shell. */}
          <div key={appRoute ? 'app' : pathname} className={appRoute ? undefined : 'route-enter'}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/industries" element={<Industries />} />
              <Route path="/industries/:slug" element={<IndustryDetail />} />
              <Route path="/products" element={<ProductsIndex />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/control-panels" element={<ControlPanelsPage />} />
              <Route path="/configure" element={<Configure />} />
              <Route path="/configurators" element={<Configurators />} />
              <Route path="/iiot" element={<IiotDashboard />} />
              <Route path="/rfq" element={<Rfq />} />
              <Route path="/standards" element={<StandardsPage />} />
              <Route path="/case-studies" element={<CaseStudies />} />
              <Route path="/consult" element={<Consult />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login/:role" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/portal/:role" element={<Portal />} />
              <Route path="/portal/:role/:section" element={<Portal />} />
              <Route path="/portal/:role/:section/:id" element={<Portal />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </div>
        </Shell>
        {!appRoute && <SiteFooter />}
        {!appRoute && <BackToTop />}
      </RequirementProvider>
    </AuthProvider>
  )
}
