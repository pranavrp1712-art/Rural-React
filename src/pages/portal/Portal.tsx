import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { AuthShell } from '../../components/portal/AuthShell'
import { PortalLayout } from '../../components/portal/PortalLayout'
import { Alert, EmptyState } from '../../components/portal/ui'
import { btn } from '../../components/portal/styles'
import { accountNav, canOpen, isRoleId, loginPath, portalPath, roles, sectionsFor, type RoleId } from '../../data/portal'
import { useAuth } from '../../lib/auth'
import { usePageMeta } from '../../lib/usePageMeta'
import { AccountView } from './AccountViews'
import { AdminView } from './AdminViews'
import { CustomerView } from './CustomerViews'
import { EngineeringView } from './EngineeringViews'
import { MarketingView } from './MarketingViews'

function Forbidden({ role, signedInAs }: { role: RoleId; signedInAs: RoleId }) {
  return (
    <AuthShell eyebrow="403 · Not authorised" title="This workspace belongs to another role">
      <Alert tone="bad" title={`You're signed in as ${roles[signedInAs].title}`}>
        The {roles[role].title} workspace is not available to your account. Access is set by your role, not by the address.
      </Alert>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to={portalPath(signedInAs)} className={btn.primary}>Go to my dashboard</Link>
        <Link to="/login" className={btn.secondary}>Sign in as someone else</Link>
      </div>
    </AuthShell>
  )
}

function View({ role, section, id }: { role: RoleId; section: string; id?: string }) {
  if (accountNav.items.some((s) => s.id === section)) return <AccountView role={role} section={section} />
  switch (role) {
    case 'admin':
      return <AdminView section={section} id={id} />
    case 'engineering':
      return <EngineeringView section={section} id={id} />
    case 'marketing':
      return <MarketingView section={section} />
    case 'customer':
      return <CustomerView section={section} />
  }
}

export default function Portal() {
  const { role, section = '', id } = useParams()
  const { session } = useAuth()
  const location = useLocation()

  const known = isRoleId(role)
  const label = known ? (sectionsFor(role).find((s) => s.id === section)?.label ?? roles[role].title) : 'Portal'
  usePageMeta({
    title: `${label} · ${known ? roles[role].title : 'Portal'} | RuralReact`,
    description: 'RuralReact portal.',
    path: location.pathname,
  })

  if (!known) return <Navigate to="/login" replace />

  // Guard: the route itself refuses, not just the menu.
  if (!session) {
    return <Navigate to={`${loginPath(role)}?next=${encodeURIComponent(location.pathname)}`} replace />
  }
  if (session.role !== role) return <Forbidden role={role} signedInAs={session.role} />

  const allowed = canOpen(role, section, id)

  return (
    <PortalLayout role={role}>
      {allowed ? (
        <View role={role} section={section} id={id} />
      ) : (
        <EmptyState
          title="That page is not part of your workspace"
          action={<Link to={portalPath(role)} className={btn.secondary}>Back to dashboard</Link>}
        />
      )}
    </PortalLayout>
  )
}
