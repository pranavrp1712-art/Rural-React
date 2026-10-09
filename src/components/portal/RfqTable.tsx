import { Link } from 'react-router-dom'
import { relativeDue, type Rfq } from '../../data/portalTypes'
import { stageTone } from './styles'
import { Badge, DataTable } from './ui'

/**
 * The RFQ list, shared by Engineering (its own worklist and queue) and
 * Super Admin (commercial list and the engineering drill-down), so the
 * same data never has two different renderings.
 */
export function RfqTable({ rows, linkBase, empty }: { rows: Rfq[]; linkBase?: string; empty?: string }) {
  return (
    <DataTable
      caption="RFQs"
      rows={rows}
      rowKey={(r) => r.id}
      empty={empty ?? 'No RFQs yet. They show up here once submitted.'}
      columns={[
        {
          key: 'id',
          label: 'RFQ',
          render: (r) =>
            linkBase ? (
              <Link to={`${linkBase}/${r.id}`} className="font-mono text-xs font-semibold text-signal-ink hoverable:hover:underline">
                {r.id}
              </Link>
            ) : (
              <span className="font-mono text-xs font-semibold">{r.id}</span>
            ),
        },
        {
          key: 'scope',
          label: 'Scope',
          render: (r) => (
            <>
              <span className="block">{r.scope}</span>
              <span className="text-xs text-ink-faint">
                {r.customer} · {r.industry}
              </span>
            </>
          ),
        },
        { key: 'stage', label: 'Stage', render: (r) => <Badge tone={stageTone[r.stage]}>{r.stage}</Badge> },
        { key: 'assignee', label: 'Engineer', secondary: true, render: (r) => (r.assignee ? <span className="font-mono text-xs">{r.assignee}</span> : <span className="text-ink-faint">Unassigned</span>) },
        { key: 'due', label: 'Due', align: 'right', render: (r) => <span className="whitespace-nowrap">{relativeDue(r.due)}</span> },
      ]}
    />
  )
}
