import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'

const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const formatDate = date => dateLabel.format(new Date(date))
const formatCount = new Intl.NumberFormat('en-US')

function DailyChart({ days }) {
  const maxCount = Math.max(...days.map(day => day.unique_browsers))
  const ceiling = Math.max(2, Math.ceil(maxCount / 2) * 2)

  return <div>
    <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-2.5" aria-hidden="true">
      <div className="flex h-40 flex-col justify-between text-right text-note leading-none text-muted tabular-nums sm:h-52">
        {[ceiling, ceiling / 2, 0].map(value => <span key={value}>{formatCount.format(value)}</span>)}
      </div>
      <div>
        <div className="relative h-40 border-y border-line sm:h-52">
          <div className="absolute top-1/2 w-full border-t border-line" />
          <div className="relative grid h-full grid-cols-[repeat(30,minmax(0,1fr))] items-end gap-0.5 sm:gap-1.5">
            {days.map(({ visit_date, unique_browsers }, index) => <div key={visit_date}
              title={`${formatDate(visit_date)} · ${formatCount.format(unique_browsers)}`}
              className={`rounded-t-sm ${index === days.length - 1 ? 'bg-scarf' : 'bg-scarf/55'}`}
              style={{ height: `${100 * unique_browsers / ceiling}%` }} />)}
          </div>
        </div>
        <div className="mt-2 flex justify-between gap-2 text-note text-muted">
          <span>{formatDate(days[0].visit_date)}</span>
          <span>{formatDate(days.at(-1).visit_date)}</span>
        </div>
      </div>
    </div>
    <details className="mt-5 border-t border-line pt-3 text-control">
      <summary className="cursor-pointer py-1.5 font-semibold text-scarf">Show daily counts</summary>
      <table className="mt-2 w-full border-collapse text-left">
        <thead className="text-muted">
          <tr><th scope="col" className="py-2">Date (WIB)</th><th scope="col" className="py-2 text-right">Unique browsers</th></tr>
        </thead>
        <tbody>
          {days.slice().reverse().map(({ visit_date, unique_browsers }) => <tr key={visit_date} className="border-t border-line">
            <td className="py-1.5"><time dateTime={visit_date}>{formatDate(visit_date)}</time></td>
            <td className="text-right tabular-nums">{formatCount.format(unique_browsers)}</td>
          </tr>)}
        </tbody>
      </table>
    </details>
  </div>
}

export default function VisitorAnalytics({ client, back }) {
  const [result, setResult] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      const { data, error } = await client.rpc('stickylore67_daily_visitors').abortSignal(controller.signal)
      if (error || !data?.length) throw error ?? new Error('Analytics is unavailable')
      if (!controller.signal.aborted) setResult({ status: 'ready', days: data })
    }
    load().catch(() => {
      if (!controller.signal.aborted) setResult({ status: 'error' })
    })
    return () => controller.abort()
  }, [client, attempt])

  function refresh() {
    setResult({ status: 'loading' })
    setAttempt(value => value + 1)
  }

  const today = result.days?.at(-1)

  return <section className="mx-auto grid max-w-4xl gap-4" aria-labelledby="analytics-title">
    <button type="button" className="admin-secondary justify-self-start" onClick={back}><ArrowLeft size={16} />Book collection</button>
    <div className="admin-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <h2 id="analytics-title" className="text-3xl">Visitor analytics</h2>
        <button type="button" className="admin-secondary disabled:cursor-default disabled:opacity-60"
          disabled={result.status === 'loading'} onClick={refresh}><RefreshCw size={16} />Refresh</button>
      </div>
      {result.status === 'loading' && <p className="py-8 text-muted" role="status">Loading traffic…</p>}
      {result.status === 'error' && <p className="admin-error mt-5" role="alert">Visitor counts couldn’t load. Try refreshing.</p>}
      {today && <>
        <div className="my-5 inline-grid gap-1 rounded-xl border border-line bg-paper px-5 py-3.5">
          <span className="text-control font-semibold text-muted">Today · {formatDate(today.visit_date)}</span>
          <strong className="font-serif text-4xl leading-none font-normal text-scarf tabular-nums">{formatCount.format(today.unique_browsers)}</strong>
          <span className="text-note text-muted">Unique browsers</span>
        </div>
        <h3 className="text-2xl">Last 30 days</h3>
        <p className="mt-1 text-control text-muted">One count per browser per day. Days reset at midnight Jakarta time (WIB).</p>
        <DailyChart days={result.days} />
      </>}
    </div>
  </section>
}
