import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, ChartNoAxesColumn, ChevronDown, LogOut, Trash2 } from 'lucide-react'
import { Header, ShelfCollection, ShelfHeading } from './Shelf'
import { adminBookColumns, booksTable, createAdminClient, fetchSeriesTotals, isBookFeatured, seriesOptions, seriesTable, webUrl, youtubeId } from './books'
import VisitorAnalytics from './VisitorAnalytics'

const client = createAdminClient()
const day = 24 * 60 * 60 * 1000

const linkFields = [
  ['physical_book_affiliate_url', 'Physical book URL'],
  ['ebook_affiliate_url', 'Ebook URL'],
  ['audiobook_affiliate_url', 'Audiobook URL'],
  ['box_set_affiliate_url', 'Box set URL'],
]

function RequiredMark() {
  return <span aria-hidden="true" className="text-scarf"> *</span>
}

function Field({ label, name, value = '', required, ...props }) {
  return <label className="grid gap-1.5 text-control font-semibold">
    <span>{label}{required && <RequiredMark />}</span>
    <input className="admin-input" name={name} defaultValue={value ?? ''} required={required} {...props} />
  </label>
}

function SignIn() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const form = new FormData(event.currentTarget)
    try {
      const { error } = await client.auth.signInWithPassword({
        email: form.get('email').trim(),
        password: form.get('password'),
      })
      if (error) throw error
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return <form className="admin-panel mx-auto grid w-full max-w-md gap-4" onSubmit={submit}>
    <h2 className="text-3xl">Sign in</h2>
    <p className="text-control text-muted">Both fields are required.</p>
    <Field label="Email" name="email" type="email" autoComplete="username" required />
    <Field label="Password" name="password" type="password" autoComplete="current-password" required />
    {error && <p role="alert" className="admin-error">{error}</p>}
    <button className="primary justify-self-start disabled:opacity-60" disabled={busy}>
      {busy ? 'Signing in…' : 'Sign in'}
    </button>
  </form>
}

function readBook(form, book) {
  const get = key => form.get(key)?.trim() || ''
  const record = {
    title: get('title'),
    author: get('author'),
    description: get('description'),
    cover_url: get('cover_url'),
    genres: [...new Set(get('genres').split(',').map(genre => genre.trim()).filter(Boolean))],
    series_name: get('series_name') || null,
    series_number: get('series_number') ? Number(get('series_number')) : null,
    trailer_url: get('trailer_url') || null,
    bookshelf_visibility: get('bookshelf_visibility') === 'visible',
  }
  if (!record.title || !record.author || !record.description) {
    throw new Error('Enter a title, author, and description.')
  }
  if (!webUrl(record.cover_url)) throw new Error('Enter a valid cover image URL.')
  if (record.trailer_url && !youtubeId(record.trailer_url)) throw new Error('Enter a valid YouTube trailer URL.')
  for (const [key, label] of linkFields) {
    record[key] = get(key) || null
    if (record[key] && !webUrl(record[key])) throw new Error(`Enter a valid ${label.toLowerCase()}.`)
  }

  const placement = get('placement')
  if (placement !== 'keep' || !book) {
    const days = Number(placement === 'custom' ? get('placement_days') : placement)
    record.is_featured = placement !== 'none'
    record.featured_until = null
    if (placement !== 'none' && placement !== 'manual') {
      if (!Number.isSafeInteger(days) || days < 1) throw new Error('Enter a whole number of days greater than zero.')
      const end = new Date(Date.now() + days * day)
      if (Number.isNaN(end.getTime()) || end.getUTCFullYear() > 9999) throw new Error('Choose a shorter Featured duration.')
      record.featured_until = end.toISOString()
    }
  }
  return record
}

function BookForm({ book, save, endPlacement, remove, back }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [placement, setPlacement] = useState(book ? 'keep' : 'none')
  const confirmDelete = useRef(null)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const end = Date.parse(book?.featured_until)
    if (!(end > now)) return
    const timeout = window.setTimeout(() => setNow(Date.now()), Math.min(end - Date.now(), 2_147_483_647))
    return () => window.clearTimeout(timeout)
  }, [book?.featured_until, now])
  const featured = book && isBookFeatured(book, now)

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')
    setBusy(true)
    try {
      await save(readBook(form, book))
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function endNow() {
    setError('')
    setBusy(true)
    try {
      await endPlacement()
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteBook() {
    setBusy(true)
    setDeleteError('')
    try {
      await remove(book)
    } catch (error) {
      setDeleteError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return <>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <button className="admin-secondary" disabled={busy} onClick={back}><ArrowLeft size={16} />Book collection</button>
      {book && <button className="admin-danger" disabled={busy} onClick={() => {
        setDeleteError('')
        confirmDelete.current.showModal()
      }}><Trash2 size={16} />Delete book</button>}
    </div>
    <form className="admin-panel grid gap-6" onSubmit={submit}>
      <div className="border-b border-line pb-4">
        <h2 className="text-3xl">{book ? 'Edit book' : 'Add a book'}</h2>
        <p className="mt-2 text-control text-muted">Fields marked with an asterisk (*) are required. All others are optional.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" name="title" value={book?.title} required />
        <Field label="Author" name="author" value={book?.author} required />
        <Field label="Cover image URL" name="cover_url" type="url" value={book?.cover_url} required />
        <Field label="YouTube trailer URL" name="trailer_url" type="url" value={book?.trailer_url} />
        <label className="grid gap-1.5 text-control font-semibold sm:col-span-2">
          <span>Description<RequiredMark /></span>
          <textarea className="admin-input" name="description" defaultValue={book?.description} rows={5} required />
        </label>
        <div className="sm:col-span-2">
          <Field label="Genres or tags" name="genres" value={book?.genres?.join(', ')} placeholder="Fantasy, mystery, young adult" />
          <p className="mt-1.5 text-note text-muted">Separate each genre or tag with a comma.</p>
        </div>
        <Field label="Series name" name="series_name" value={book?.series_name} />
        <Field label="Book number" name="series_number" type="number" min="0" value={book?.series_number} />
      </div>
      <fieldset className="m-0 min-w-0 border-0 border-t border-line p-0 pt-4">
        <legend className="pr-2 font-serif text-2xl">Affiliate links</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {linkFields.map(([key, label]) => <Field key={key} label={label} name={key} type="url" value={book?.[key]} />)}
        </div>
      </fieldset>
      <fieldset className="m-0 min-w-0 border-0 border-t border-line p-0 pt-4">
        <legend className="pr-2 font-serif text-2xl">On the bookshelf</legend>
        <div className="grid max-w-md gap-2">
          <label className="mb-2 grid gap-1.5 text-control font-semibold">
            Bookshelf visibility
            <span className="relative">
              <select className="admin-input placement-select" name="bookshelf_visibility"
                defaultValue={book?.bookshelf_visibility === false ? 'hidden' : 'visible'}>
                <option value="visible">Visible to visitors</option>
                <option value="hidden">Hidden from visitors</option>
              </select>
              <ChevronDown aria-hidden="true" size={18} className="placement-chevron pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-scarf" />
            </span>
          </label>
          <label className="grid gap-1.5 text-control font-semibold">
            Featured placement
            <span className="relative">
              <select className="admin-input placement-select" name="placement" value={placement}
                onChange={event => setPlacement(event.target.value)}>
                {book && <option value="keep">Keep current setting</option>}
                <option value="none">Not featured</option>
                <option value="manual">Forever</option>
                <option value="custom">Custom duration</option>
                {Array.from({ length: 7 }, (_, i) => i + 1).map(days =>
                  <option key={days} value={days}>{days} {days === 1 ? 'day' : 'days'} from saving</option>)}
              </select>
              <ChevronDown aria-hidden="true" size={18} className="placement-chevron pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-scarf" />
            </span>
          </label>
          {placement === 'custom' && <Field label="Days from saving" name="placement_days" type="number" min="1" step="1" required />}
          {featured && <div className="flex flex-wrap items-center gap-x-3 text-note text-muted">
            <span>{book.featured_until ? `Ends ${new Date(book.featured_until).toLocaleString()}` : 'Featured forever'}</span>
            <button type="button" className="text-button disabled:opacity-60" onClick={endNow} disabled={busy}>End now</button>
          </div>}
          {book?.is_featured && !featured && <p className="text-note text-muted">Featured placement ended.</p>}
        </div>
      </fieldset>
      {error && <p role="alert" className="admin-error">{error}</p>}
      <button className="primary justify-self-start disabled:opacity-60" disabled={busy}>
        {busy ? 'Saving…' : 'Save book'}
      </button>
    </form>
    {book && <dialog ref={confirmDelete} className="admin-confirm" aria-labelledby="delete-title"
      onCancel={event => { if (busy) event.preventDefault() }}>
      <h2 id="delete-title" className="text-2xl">Delete this book?</h2>
      <p className="my-4 wrap-anywhere leading-relaxed">“{book.title}” by {book.author} will be permanently removed from your collection.</p>
      {deleteError && <p role="alert" className="admin-error mb-4">{deleteError}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button autoFocus className="admin-secondary" disabled={busy} onClick={() => confirmDelete.current.close()}>Cancel</button>
        <button className="primary bg-[#923c32] hover:bg-[#793128]" disabled={busy} onClick={deleteBook}>{busy ? 'Deleting…' : 'Delete permanently'}</button>
      </div>
    </dialog>}
  </>
}

function SeriesTotalsForm({ options, totals, onSaved }) {
  const [chosen, setChosen] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const selected = options.some(([key]) => key === chosen) ? chosen : options[0][0]

  async function submit(event) {
    event.preventDefault()
    const raw = new FormData(event.currentTarget).get('total_books').trim()
    const total = raw ? Number(raw) : null
    setMessage('')
    setError('')
    setBusy(true)
    try {
      const { error } = await client.from(seriesTable).upsert({ series_key: selected, total_books: total })
      if (error) throw error
      onSaved(selected, total)
      setMessage(total === null ? 'Series total cleared.' : 'Series total saved.')
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return <details className="mb-2 rounded-lg border border-line px-4 py-3">
    <summary className="cursor-pointer text-control font-semibold">Series totals</summary>
    <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={submit}>
      <label className="grid gap-1.5 text-control font-semibold">
        Series
        <select className="admin-input" value={selected} disabled={busy} onChange={event => {
          setChosen(event.target.value)
          setMessage('')
          setError('')
        }}>{options.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select>
      </label>
      <Field key={`${selected}-${totals.get(selected)}`} label="Total books" name="total_books" value={totals.get(selected)}
        type="number" min="1" max="2147483647" step="1" disabled={busy} placeholder="Optional" />
      <button className="admin-secondary min-h-11" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save total'}</button>
      {message && <p className="w-full text-note text-muted" role="status">{message}</p>}
      {error && <p className="admin-error w-full" role="alert">{error}</p>}
    </form>
  </details>
}

function Catalog() {
  const [books, setBooks] = useState(null)
  const [seriesTotals, setSeriesTotals] = useState(() => new Map())
  const [bookId, setBookId] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      const books = []
      const pageSize = 200
      while (!controller.signal.aborted) {
        const { data, error } = await client.from(booksTable).select(adminBookColumns)
          .order('created_at', { ascending: false }).order('id').range(books.length, books.length + pageSize - 1).abortSignal(controller.signal)
        if (error) throw error
        books.push(...data)
        if (data.length < pageSize) break
      }
      if (!controller.signal.aborted) setBooks(books)
    }
    load().catch(error => {
      if (!controller.signal.aborted) setError(error.message)
    })
    fetchSeriesTotals(controller.signal, client).then(totals => {
      if (!controller.signal.aborted) setSeriesTotals(totals)
    }).catch(() => { /* Books remain editable while series totals are unavailable. */ })
    return () => controller.abort()
  }, [attempt])

  const book = books?.find(book => book.id === bookId)

  async function persist(record, message) {
    setNotice('')
    const table = client.from(booksTable)
    const request = book ? table.update(record).eq('id', book.id) : table.insert(record)
    const { data, error } = await request.select(adminBookColumns).single()
    if (error) throw error
    setBooks(books => book ? books.map(item => item.id === data.id ? data : item) : [data, ...books])
    setNotice(message)
    return data
  }

  async function save(record) {
    const message = book ? 'Book updated.' : record.bookshelf_visibility ? 'Book added to the bookshelf.' : 'Hidden book saved.'
    const saved = await persist(record, message)
    setBookId(saved.id)
    setRevision(value => value + 1)
  }

  async function remove(book) {
    const { error } = await client.from(booksTable).delete().eq('id', book.id).select('id').single()
    if (error) throw new Error('Could not delete the book. ' + error.message)
    setBooks(items => items.filter(item => item.id !== book.id))
    setBookId(null)
    setNotice(`Deleted “${book.title}”.`)
  }

  function openEditor(id) {
    setNotice('')
    setBookId(id)
    window.scrollTo(0, 0)
  }

  if (error) return <div className="admin-panel">
    <p role="alert" className="admin-error">{error}</p>
    <button className="text-button" onClick={() => { setError(''); setAttempt(attempt + 1) }}>Try again</button>
  </div>
  if (!books) return <p role="status">Loading books…</p>
  const seriesList = seriesOptions(books)

  return <>
    <p role="status" className="mb-4 rounded-lg bg-[#e6eee7] px-4 py-3 text-control font-semibold text-[#32503b] empty:hidden">{notice}</p>
    <div hidden={bookId !== null}>
      {seriesList.length > 0 && <SeriesTotalsForm options={seriesList} totals={seriesTotals}
        onSaved={(key, total) => setSeriesTotals(current => new Map(current).set(key, total))} />}
      <ShelfCollection books={books} seriesTotals={seriesTotals} status="ready" edit={book => openEditor(book.id)} add={() => openEditor('')} />
    </div>
    {bookId !== null && <div className="mx-auto max-w-4xl pb-12">
      <BookForm key={`${bookId}-${revision}`} book={book} save={save} remove={remove} back={() => openEditor(null)}
        endPlacement={() => persist({ is_featured: false, featured_until: null }, 'Featured placement ended.')} />
    </div>}
  </>
}

export default function Admin() {
  const [session, setSession] = useState(undefined)
  const [access, setAccess] = useState(null)
  const [logoutError, setLogoutError] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const userId = session?.user.id

  useEffect(() => {
    if (!client) return
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    client.from('stickylore67_admins').select('user_id').eq('user_id', userId)
      .abortSignal(controller.signal).maybeSingle().then(({ data, error }) => {
        if (!controller.signal.aborted) setAccess({ userId, allowed: Boolean(data), error })
      })
    return () => controller.abort()
  }, [userId])

  async function signOut() {
    const { error } = await client.auth.signOut({ scope: 'local' })
    setLogoutError(error?.message ?? '')
    if (!error) {
      setAccess(null)
      setShowAnalytics(false)
    }
  }

  return <>
    <Header>
      <nav className="flex items-center gap-3 phone:gap-1" aria-label="Admin navigation">
        <a href="/" className="admin-nav" aria-label="View public bookshelf"><ArrowUpRight size={18} /><span>View bookshelf</span></a>
        {userId && access?.userId === userId && access.allowed && <button type="button" className="admin-nav aria-pressed:bg-[#e6edf2] aria-pressed:text-scarf"
          aria-label="Analytics" aria-pressed={showAnalytics} onClick={() => setShowAnalytics(value => !value)}><ChartNoAxesColumn size={17} /><span>Analytics</span></button>}
        {userId && <button className="admin-nav" aria-label="Sign out" onClick={signOut}><LogOut size={17} /><span>Sign out</span></button>}
      </nav>
    </Header>
    <main className="wrap pb-8">
      <ShelfHeading subtitle="Bookshelf admin" />
      {logoutError && <p role="alert" className="admin-error">{logoutError}</p>}
      {!client ? <p role="alert">Supabase settings are missing.</p>
        : session === undefined ? <p role="status">Checking sign-in…</p>
        : !userId ? <SignIn />
        : access?.userId !== userId ? <p role="status">Checking admin access…</p>
        : access.error ? <p role="alert" className="admin-error">{access.error.message}</p>
        : !access.allowed ? <p role="alert">This account does not have bookshelf admin access.</p>
        : <div key={userId}>
          <div hidden={showAnalytics}><Catalog /></div>
          {showAnalytics && <VisitorAnalytics client={client} back={() => setShowAnalytics(false)} />}
        </div>}
    </main>
  </>
}
