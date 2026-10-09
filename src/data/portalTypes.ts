import type { RoleId } from './portal'

/**
 * Record shapes for the portal, plus date formatting. There is no seed
 * data anywhere: every record is created by something a person did on
 * the site or in the portal (see src/lib/db.ts), so a fresh install
 * shows zeros and empty states in every account.
 */

export const DAY = 86_400_000

export const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const dayLabel = (t: number) => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export const formatDate = (t: number) =>
  new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateTime = (t: number) =>
  new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export const relativeDue = (t: number) => {
  const days = Math.round((t - startOfToday()) / DAY)
  if (days < 0) return `${-days} d overdue`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} d`
}

export const formatInr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

/* ------------------------------------------------------------------
   Charts and tiles
   ------------------------------------------------------------------ */

export interface Point {
  t: number
  label: string
  value: number
}

export interface Bar {
  label: string
  value: number
}

export interface Metric {
  label: string
  value: string
  delta?: number
  note?: string
}

/* ------------------------------------------------------------------
   Website activity (recorded by the public site)
   ------------------------------------------------------------------ */

export type TrafficSource = 'Direct' | 'Search' | 'Social' | 'Referral' | 'Campaign' | 'QR code'
export type Device = 'Mobile' | 'Tablet' | 'Desktop'

export interface Visit {
  at: number
  path: string
  visitor: string
  session: string
  source: TrafficSource
  campaign?: string
  content?: string
  device: Device
}

export type LeadStage = 'New' | 'Contacted' | 'RFQ raised' | 'Closed'

export interface Lead {
  id: string
  at: number
  email: string
  company?: string
  message: string
  interest: string
  source: TrafficSource
  campaign?: string
  content?: string
  page: string
  stage: LeadStage
}

export interface PageRow {
  path: string
  views: number
  leads: number
  exitRate: number
}

export interface Campaign {
  name: string
  channel: string
  at: number
  by: string
}

export interface QrCode {
  id: string
  event: string
  placement: string
  url: string
  at: number
}

export interface SeoRow {
  path: string
  title: string
  description: string
  at: number
}

/* ------------------------------------------------------------------
   RFQs and engineering work
   ------------------------------------------------------------------ */

export type RfqStage = 'Preliminary' | 'Technical review' | 'Awaiting customer' | 'Approval pending' | 'Quoted'

export interface BomLine {
  item: string
  qty: number
  basis: string
}

export interface Io {
  di: number
  do: number
  ai: number
  ao: number
}

export interface RfqNote {
  at: number
  by: string
  text: string
}

export interface Rfq {
  id: string
  at: number
  customer: string
  customerEmail: string
  contact: string
  industry: string
  scope: string
  details: string
  via: 'Website' | 'Portal'
  stage: RfqStage
  assignee?: string
  due: number
  missing: string[]
  io: Io
  bom: BomLine[]
  notes: RfqNote[]
  files: string[]
}

export type WorkType = 'reviews' | 'io' | 'panel' | 'drawings' | 'programming' | 'configuration' | 'testing' | 'site'
export type WorkStatus = 'To do' | 'In progress' | 'Blocked' | 'Done'

export interface WorkItem {
  id: string
  rfq: string
  type: WorkType
  title: string
  due: number
  status: WorkStatus
  by: string
}

/* ------------------------------------------------------------------
   Customer-facing records
   ------------------------------------------------------------------ */

export interface CustomerQuote {
  id: string
  at: number
  rfq: string
  org: string
  customerEmail: string
  title: string
  amount: number
  validUntil: number
  status: 'Awaiting decision' | 'Accepted' | 'Rejected'
}

export const PROJECT_STAGES = ['Requirement', 'Drawings approved', 'Fabrication', 'FAT', 'Installation', 'Commissioning', 'Handover']

export interface Milestone {
  label: string
  state: 'done' | 'current' | 'next'
}

export interface Project {
  id: string
  at: number
  org: string
  customerEmail: string
  rfq: string
  quote: string
  title: string
  /** Index into PROJECT_STAGES of the stage in progress. */
  stage: number
}

export const milestones = (p: Project): Milestone[] =>
  PROJECT_STAGES.map((label, i) => ({ label, state: i < p.stage ? 'done' : i === p.stage ? 'current' : 'next' }))

export interface Doc {
  id: string
  at: number
  org: string
  project: string
  name: string
  kind: 'Drawing' | 'Datasheet' | 'Site photo' | 'Proposal' | 'Report'
  by: 'customer' | 'ruralreact'
}

export interface Message {
  at: number
  from: 'customer' | 'engineer'
  author: string
  text: string
}

export interface Thread {
  id: string
  rfq: string
  org: string
  subject: string
  messages: Message[]
}

export interface ServiceRequest {
  id: string
  at: number
  org: string
  customerEmail: string
  project: string
  summary: string
  priority: 'Normal' | 'Urgent'
  status: 'Open' | 'Scheduled' | 'Resolved'
}

export type IiotStatus = 'requested' | 'provisioned' | 'failed'

export interface IiotRequest {
  id: string
  customerEmail: string
  organisation: string
  site: string
  measures: string[]
  hasGateway: 'yes' | 'no' | 'unsure'
  notes: string
  status: IiotStatus
  requestedAt: number
  gatewayId?: string
  devices?: string
  engineer?: string
  provisionedAt?: number
  failureReason?: string
}

/* ------------------------------------------------------------------
   Shared: tasks and notifications
   ------------------------------------------------------------------ */

export interface Task {
  id: string
  owner: string
  title: string
  due: number
  done: boolean
  at: number
}

export type NoticeTopic = 'rfq' | 'review' | 'clarification' | 'quote' | 'project' | 'iiot' | 'lead' | 'service' | 'account'

export interface Notification {
  id: string
  at: number
  /** Delivered to everyone with this role, or to one account. */
  toRole?: RoleId
  toEmail?: string
  topic: NoticeTopic
  title: string
  body: string
  kind: 'info' | 'action' | 'alert'
  readBy: string[]
}

/** The same notification as one person sees it. */
export type Inbox = Omit<Notification, 'readBy'> & { unread: boolean }

/* ------------------------------------------------------------------
   Super Admin views built from accounts and records
   ------------------------------------------------------------------ */

export interface Customer {
  id: string
  company: string
  contact: string
  email: string
  industry: string
  status: 'Active project' | 'Prospect' | 'New'
  hasAccount: boolean
  lastActivity: number
}

export interface PortalUser {
  email: string
  name: string
  role: RoleId
  status: 'Active' | 'Disabled' | 'Invited' | 'Unverified'
  lastActive?: number
}
