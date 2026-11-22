import { lazy, Suspense, useEffect, useState } from 'react'
import { BookOpen, ChevronDown, MessageCircle } from 'lucide-react'
import { Header, ShelfCollection, ShelfHeading } from './Shelf'
import { fetchBooks, fetchSeriesTotals } from './books'
import { trackBookshelfVisit } from './analytics'

function Bookshelf() {
  const [catalog, setCatalog] = useState({ books: [], status: 'loading' })
  const [seriesTotals, setSeriesTotals] = useState(() => new Map())
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (import.meta.env.PROD && window.location.protocol === 'https:') trackBookshelfVisit()
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    fetchBooks(controller.signal).then(books => {
      if (!controller.signal.aborted) setCatalog({ books, status: 'ready' })
    }).catch(() => {
      if (!controller.signal.aborted) setCatalog({ books: [], status: 'error' })
    })
    fetchSeriesTotals(controller.signal).then(totals => {
      if (!controller.signal.aborted) setSeriesTotals(totals)
    }).catch(() => { /* Series totals are optional display metadata. */ })
    return () => controller.abort()
  }, [attempt])
  return <>
    <Header />
    <main className="wrap">
      <ShelfHeading />
      <ShelfCollection {...catalog} seriesTotals={seriesTotals} retry={() => { setCatalog({ books: [], status: 'loading' }); setAttempt(attempt + 1) }} />
    </main>
    <footer className="wrap flex items-start justify-between gap-x-6 border-t border-line py-3 text-note text-muted phone:grid phone:grid-cols-1">
      <p className="flex min-h-11 items-center gap-2 phone:col-start-1 phone:row-start-1 phone:max-w-1/2"><BookOpen size={16} aria-hidden="true" /> Sticky Lore’s Bookshelf</p>
      <details className="group max-w-md phone:col-start-1 phone:row-start-1 phone:w-full phone:max-w-none">
        <summary className="ml-auto flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 rounded-sm font-medium text-series hover:text-ink focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-3 phone:max-w-[calc(50%-8px)] [&::-webkit-details-marker]:hidden">
          Are you an author?
          <ChevronDown size={15} className="group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="mt-1 mb-2 rounded-xl border border-line bg-surface p-4 sm:p-5">
          <h2 className="mb-2 text-xl text-ink">Work with Sticky Lore</h2>
          <p className="text-control leading-relaxed">I make illustrated book trailers and offer featured spots on my bookshelf. If you’re interested, send me your book title, a link to the book, and what you have in mind.</p>
          <a className="primary mt-4 w-fit" href="https://www.instagram.com/stickylore67/">
            <MessageCircle size={16} aria-hidden="true" /> Find me on Instagram
          </a>
        </div>
      </details>
    </footer>
  </>
}

const Admin = lazy(() => import('./Admin.jsx'))

export default function App() {
  if (/^\/admin\/?$/.test(window.location.pathname)) {
    return <Suspense fallback={<p className="wrap py-8" role="status">Loading admin…</p>}>
      <Admin />
    </Suspense>
  }
  return <Bookshelf />
}
