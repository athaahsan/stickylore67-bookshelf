import { lazy, Suspense, useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
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
    <footer className="wrap flex items-center gap-2 border-t border-line py-[19px] text-[.875rem] text-muted"><BookOpen size={16} /> Sticky Lore’s Bookshelf</footer>
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
