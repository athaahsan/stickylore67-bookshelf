import { useEffect, useRef, useState } from 'react'
import { BookOpen, Headphones, LibraryBig, Pencil, Plus, Search, SlidersHorizontal, Sparkle, Star, Tablet, X } from 'lucide-react'
import avatar from './assets/sticky-avatar.webp'
import banner from './assets/sticky-characters.webp'
import { filterBooks, isBookFeatured, webUrl, youtubeId } from './books'

export function Header({ children }) {
  return <header className="border-b border-line">
    <div className="wrap flex min-h-[72px] items-center justify-between phone:min-h-[58px]">
      <a className="flex items-center gap-2.5 font-serif text-[1.5rem] tracking-[-.045em] phone:text-[1.3rem]" href="/">
    <img className="size-[38px] rounded-full border border-[#e3cd99] phone:size-[33px]" src={avatar} alt="" />
    Sticky Lore
  </a>
      {children ?? <nav className="social-links flex items-center gap-6 phone:gap-px" aria-label="Social profiles">
        <a href="https://www.instagram.com/stickylore67/" aria-label="Sticky Lore on Instagram">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.6" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg><span>Instagram</span>
        </a>
        <a href="https://www.youtube.com/@stickylore67" aria-label="Sticky Lore on YouTube">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" /></svg><span>YouTube</span>
        </a>
      </nav>}
    </div>
  </header>
}

function Cover({ book, lazy = false }) {
  const [failed, setFailed] = useState(null)
  const src = webUrl(book.cover_url)
  return src && failed !== src
    ? <img className="cover h-full w-auto rounded-xs object-contain" src={src} alt="" loading={lazy ? 'lazy' : 'eager'} onError={() => setFailed(src)} />
    : <span className="cover grid aspect-2/3 h-full place-content-center justify-items-center gap-4 overflow-hidden rounded-xs bg-[#365367] p-[12%] text-center font-serif text-[1.3rem] leading-[1.15] text-[#fff9e6]"><BookOpen aria-hidden="true" />{book.title}</span>
}

function Genres({ genres, loop = false }) {
  const viewport = useRef(null)
  const row = useRef(null)
  const [loopDuration, setLoopDuration] = useState(0)
  const hasGenres = Boolean(genres?.length)

  useEffect(() => {
    if (!loop || !hasGenres) return
    const container = viewport.current
    const chips = row.current
    const measure = () => {
      const width = chips.getBoundingClientRect().width
      setLoopDuration(width > container.getBoundingClientRect().width ? (width + 6) / 32 : 0)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(chips)
    return () => observer.disconnect()
  }, [loop, hasGenres])

  if (!hasGenres) return null
  const chips = genres.map((genre, index) => <span className="genre-chip" key={index}>{genre}</span>)
  if (!loop) return <div className="genres mt-[13px] flex flex-wrap gap-1.5 phone:mt-[9px]">{chips}</div>

  return <div className="featured-genres mt-[13px] overflow-hidden phone:mt-[9px]" ref={viewport}>
    <div className="genre-track flex w-max gap-1.5 motion-reduce:w-auto motion-reduce:flex-wrap" style={loopDuration ? { '--genre-loop-duration': `${loopDuration}s` } : undefined}>
      <div className="genre-row flex w-max gap-1.5 motion-reduce:w-auto motion-reduce:flex-wrap" ref={row}>{chips}</div>
      {loopDuration > 0 && <div className="genre-row genre-copy flex w-max gap-1.5 motion-reduce:hidden" aria-hidden="true">{chips}</div>}
    </div>
  </div>
}

function FeaturedBook({ book, open, active }) {
  return <article className="featured relative grid min-w-0 snap-start snap-always grid-cols-[43%_1fr] overflow-hidden rounded-2xl border border-[#d8ceb5] bg-[#f8f4e9] phone:grid-cols-1 phone:rounded-xl" aria-hidden={!active} aria-label={book.title}>
    <div className="feature-art relative isolate grid min-h-[315px] place-items-center overflow-hidden phone:h-[clamp(160px,47vw,210px)] phone:min-h-0 phone:grid-rows-[minmax(0,1fr)]" aria-hidden="true">
      <div className="orbits absolute inset-0 -z-1"><i /><i /><i /><i /></div>
      <Sparkle className="absolute top-[20%] right-[15%] size-[26px] stroke-[1.25] text-[#795a2b] phone:right-[22%]" /><Sparkle className="absolute bottom-[20%] left-[16%] size-4 stroke-[1.25] text-[#795a2b] phone:left-[22%]" />
      <div className="feature-cover relative grid h-60 max-w-[60%] -rotate-7 drop-shadow-[9px_13px_8px_#50381d55] compact:h-[210px] phone:h-[81%]"><Cover book={book} lazy={!active} /></div>
    </div>
    <div className="min-w-0 self-center px-[clamp(24px,3.1vw,48px)] py-8 phone:px-[19px] phone:pt-[17px] phone:pb-[19px]">
      <div className="flex items-center gap-[7px] text-[.75rem] font-[750] tracking-[.13em] text-[#765122] uppercase"><Star size={15} fill="currentColor" />Featured book</div>
      <h2 className="mt-2.5 mb-[5px] wrap-anywhere text-[clamp(2.1rem,3.3vw,3.25rem)] tracking-[-.045em] phone:mt-1.5 phone:mb-0.5 phone:text-[2rem]">{book.title}</h2>
      <p className="text-[#57584f]">by {book.author}</p>
      <p className="mt-3 line-clamp-2 text-[.98rem] leading-[1.55] text-[#4e5049] phone:mt-2 phone:text-[.9375rem]">{book.description}</p>
      <Genres genres={book.genres} loop />
      <button className="primary mt-[18px] after:absolute after:inset-0 phone:mt-3" tabIndex={active ? 0 : -1} onClick={() => open(book)}><BookOpen size={17} />View book</button>
    </div>
  </article>
}

const rotationDelay = 7000

function FeaturedShelf({ books, open, detailsOpen }) {
  const track = useRef(null)
  const [index, setIndex] = useState(0)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [touching, setTouching] = useState(false)
  const count = books.length

  function moveTo(position) {
    const el = track.current
    const next = (position + el.children.length) % el.children.length
    const left = el.children[next].offsetLeft
    const distance = Math.abs(left - el.scrollLeft)
    // Skip intervening slides when jumping to a distant book.
    el.scrollTo({ left, behavior: distance > el.children[1].offsetLeft * 1.5 ? 'instant' : 'auto' })
  }

  useEffect(() => {
    if (count < 2 || keyboardFocus || hovered || touching || detailsOpen) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const timer = window.setInterval(() => {
      if (!document.hidden && !reducedMotion.matches) moveTo(index + 1)
    }, rotationDelay)
    return () => window.clearInterval(timer)
  }, [count, index, keyboardFocus, hovered, touching, detailsOpen])

  return <section className="featured-shelf" aria-label="Featured books"
    aria-roledescription={count > 1 ? 'carousel' : undefined}
    onFocusCapture={event => setKeyboardFocus(event.target.matches(':focus-visible'))}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false) }}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true) }}
    onPointerLeave={() => setHovered(false)}>
    <div ref={track} className="featured-track relative grid auto-cols-[100%] grid-flow-col gap-x-2.5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth rounded-2xl scrollbar-none motion-reduce:scroll-auto"
      onTouchStart={() => setTouching(true)} onTouchEnd={() => setTouching(false)} onTouchCancel={() => setTouching(false)}
      onScroll={event => {
        if (count < 2) return
        const el = event.currentTarget
        const slideStep = el.children[1].offsetLeft
        setIndex(Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / slideStep))))
      }}>
      {books.map((book, i) => <FeaturedBook key={book.id} book={book} active={i === index} open={open} />)}
    </div>
    {count > 1 && <div className="featured-dots mt-1 flex flex-wrap justify-center" role="group" aria-label="Choose a featured book">
      {books.map((book, i) => <button key={book.id}
        aria-label={`Show ${book.title}, ${i + 1} of ${count}`}
        aria-current={i === index ? 'true' : undefined}
        onClick={() => moveTo(i)} />)}
    </div>}
  </section>
}

const formats = [
  ['physical_book_affiliate_url', 'Physical book', BookOpen],
  ['ebook_affiliate_url', 'Ebook', Tablet],
  ['audiobook_affiliate_url', 'Audiobook', Headphones],
  ['box_set_affiliate_url', 'Box set', LibraryBig],
]

const emptyFilters = { genres: [], formats: [] }

function FilterOptions({ label, options, selected, onChange }) {
  return <fieldset className="m-0 min-w-0 border-0 p-0">
    <legend className="mb-2 p-0 font-[650]">{label}</legend>
    <div className="flex flex-wrap gap-2">{options.map(([value, text]) => {
      const active = selected.includes(value)
      return <button className="filter-option" key={value} type="button" aria-pressed={active} onClick={() => onChange(value, !active)}>
        {text}
      </button>
    })}</div>
  </fieldset>
}

function BookFilters({ filters, onApply, genres, availableFormats }) {
  const dialog = useRef(null)
  const [draft, setDraft] = useState(emptyFilters)
  const count = filters.genres.length + filters.formats.length

  function openFilters() {
    setDraft(filters)
    dialog.current.showModal()
  }

  function change(group, value, checked) {
    setDraft(current => ({
      ...current,
      [group]: checked ? [...current[group], value] : current[group].filter(item => item !== value),
    }))
  }

  return <>
    <button className="filter-trigger control shrink-0 gap-[7px] px-3 font-semibold hover:border-scarf hover:text-scarf has-[span]:border-scarf has-[span]:text-scarf" type="button" aria-haspopup="dialog"
      aria-label={count ? `Filters, ${count} active` : 'Filters'} onClick={openFilters}>
      <SlidersHorizontal size={17} />Filters{count > 0 && <span className="min-w-[21px] rounded-full bg-scarf px-[5px] py-0.5 text-[.75rem] text-white" aria-hidden="true">{count}</span>}
    </button>
    <dialog className="filter-dialog" ref={dialog} aria-labelledby="filter-title"
      onClick={event => { if (event.target === dialog.current) dialog.current.close() }}>
      <form onSubmit={event => { event.preventDefault(); onApply(draft); dialog.current.close() }}>
        <header className="detail-bar">
          <h3 className="text-[1.55rem]" id="filter-title">Filter books</h3>
          <button type="button" aria-label="Close filters" onClick={() => dialog.current.close()}><X size={21} /></button>
        </header>
        <div className="grid gap-5 px-[25px] py-5 phone:px-[18px]">
          {genres.length > 0 && <FilterOptions label="Genres" options={genres.map(genre => [genre, genre])}
            selected={draft.genres} onChange={(value, checked) => change('genres', value, checked)} />}
          {availableFormats.length > 0 && <FilterOptions label="Available formats" options={availableFormats}
            selected={draft.formats} onChange={(value, checked) => change('formats', value, checked)} />}
        </div>
        <div className="sticky bottom-0 flex justify-between gap-2.5 border-t border-line bg-paper px-[25px] py-3 phone:px-[18px] phone:pb-[calc(12px+env(safe-area-inset-bottom))]">
          <button className="min-h-11 rounded-[7px] border border-line px-3.5 py-2.5 text-control font-semibold text-muted hover:border-scarf hover:bg-surface hover:text-scarf" type="button" onClick={() => setDraft(emptyFilters)}>Clear filters</button>
          <button className="primary" type="submit">Apply filters</button>
        </div>
      </form>
    </dialog>
  </>
}

function BookDetails({ book, close, edit }) {
  const ref = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const video = youtubeId(book.trailer_url)
  const links = formats.filter(([key]) => webUrl(book[key]))
  const description = book.description.trim()
  const shortened = description.length > 440
  useEffect(() => {
    const el = ref.current
    el.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { el.close(); document.body.style.overflow = previous }
  }, [])

  return <dialog className="book-dialog overflow-hidden open:flex" ref={ref} aria-labelledby="detail-title" onCancel={e => { e.preventDefault(); close() }}
    onClick={e => { if (e.target === ref.current) close() }}>
    <div className="flex min-h-0 w-full flex-col">
      <header className="detail-bar"><span><BookOpen size={17} /> Book details</span>
        <button onClick={close} aria-label="Close book details" autoFocus><X size={21} /></button></header>
      <div className="detail-content min-h-0 overflow-y-auto overscroll-y-contain p-[25px] scrollbar-thin phone:p-[18px] phone:pb-[calc(28px+env(safe-area-inset-bottom))]" tabIndex={0}>
        <div className="grid grid-cols-[112px_1fr] items-center gap-[22px] phone:grid-cols-[82px_minmax(0,1fr)] phone:gap-[13px]">
          <div className="detail-cover"><Cover book={book} /></div>
          <div>
            {book.series_name && <p className="mb-[7px] text-[.86rem] text-scarf">{book.series_name}{book.series_number != null && ` · Book ${book.series_number}`}</p>}
            <h2 className="wrap-anywhere text-[clamp(1.9rem,4vw,2.8rem)] tracking-[-.04em]" id="detail-title">{book.title}</h2><p className="mt-1.5 text-[#57584f]">by {book.author}</p>
            <Genres genres={book.genres} />
          </div>
        </div>
        {edit && <button className="admin-secondary mt-4" onClick={() => { close(); edit(book) }}><Pencil size={15} />Edit book</button>}
        <section><h3>Description</h3><p className="wrap-anywhere leading-[1.6] whitespace-pre-line">{shortened && !expanded
          ? description.slice(0, 440).replace(/\s+\S*$/, '') + '…' : description}</p>
          {shortened && <button className="text-button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Read less' : 'Read more'}</button>}
        </section>
        {links.length > 0 && <section><h3>Get the book</h3>
          <div className="format-links flex flex-wrap gap-2">{links.map(([key, label, Icon]) => <a key={key} href={webUrl(book[key])} rel="sponsored"><Icon size={17} />{label}</a>)}</div>
          <p className="mt-[9px] text-note leading-[1.5] text-muted">As an Amazon Associate I earn from qualifying purchases.</p>
        </section>}
        {video && <section><h3>Book trailer <small className="ms-[.3rem] font-sans text-[.875rem] leading-[1.4] font-normal whitespace-nowrap text-muted">by Sticky Lore</small></h3>
          <iframe
            className="block aspect-9/16 w-full max-w-[280px] rounded-lg border-0 bg-[#161717]"
            title={`${book.title} trailer`}
            loading="lazy"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=0&playsinline=1`}
          />
        </section>}
      </div>
    </div>
  </dialog>
}

export function ShelfHeading({ subtitle }) {
  return <section className="flex items-center justify-between gap-[22px] pt-[46px] pb-[38px] phone:block phone:pt-[26px] phone:pb-[23px]">
    <div><h1 className="text-[clamp(2.6rem,4.7vw,4.4rem)] tracking-[-.055em] phone:text-[clamp(2rem,8.75vw,3rem)]">Sticky Lore’s <em className="text-scarf">Bookshelf</em></h1><p className="mt-2.5 text-[1.05rem] text-muted phone:mt-[7px] phone:text-[.95rem]">{subtitle ?? 'Stick around. I’ve got a story for you.'}</p></div>
    <img src={banner} alt="" className="banner w-[min(35%,360px)] mix-blend-multiply phone:hidden" />
  </section>
}

export function ShelfCollection({ books, status, retry, edit, add }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(emptyFilters)
  const currentBook = () => new URL(window.location.href).searchParams.get('book')
  const [bookId, setBookId] = useState(currentBook)
  useEffect(() => {
    const sync = () => setBookId(currentBook())
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])
  function open(book) {
    const url = new URL(window.location.href)
    url.searchParams.set('book', book.id)
    window.history.pushState({ shelfDialog: true }, '', url)
    setBookId(book.id)
  }
  function close() {
    if (window.history.state?.shelfDialog) return window.history.back()
    const url = new URL(window.location.href)
    url.searchParams.delete('book')
    window.history.replaceState(window.history.state, '', url)
    setBookId(null)
  }
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    let nextEnd = Infinity
    for (const book of books) {
      const end = Date.parse(book.featured_until)
      if (book.is_featured && end > now) nextEnd = Math.min(end, nextEnd)
    }
    if (!Number.isFinite(nextEnd)) return
    const timeout = window.setTimeout(() => setNow(Date.now()), Math.min(nextEnd - Date.now(), 2_147_483_647))
    return () => window.clearTimeout(timeout)
  }, [books, now])
  const selected = books.find(book => book.id === bookId)
  const featured = books.filter(book => isBookFeatured(book, now))
  const genres = [...new Set(books.flatMap(book => book.genres ?? []).map(item => item.trim().toLowerCase()).filter(Boolean))].sort()
  const availableFormats = formats.filter(([key]) => books.some(book => webUrl(book[key])))
  const results = filterBooks(books, query, filters)
  const filtered = Boolean(query.trim() || filters.genres.length || filters.formats.length)
  function clear() { setQuery(''); setFilters(emptyFilters) }

  return <>
    {featured.length > 0 && <FeaturedShelf key={featured.map(book => book.id).join(',')} books={featured} open={open} detailsOpen={Boolean(selected)} />}
    <section className="pt-[38px] pb-14 phone:pt-[26px] phone:pb-[38px]" aria-labelledby="collection-title">
      <div className="mb-4 flex items-center gap-3 phone:mb-[13px]"><h2 className="text-[clamp(2rem,3vw,2.65rem)] tracking-[-.045em]" id="collection-title">All books</h2>
        {status === 'ready' && <span className="rounded-full bg-[#eae9e2] px-[9px] py-[3px] text-note text-[#55584d]" role="status">{results.length} {results.length === 1 ? 'book' : 'books'}</span>}
        {add && <button className="primary ml-auto" onClick={add}><Plus size={16} />Add book</button>}
      </div>
      {status === 'ready' && books.length > 0 && <div className="mb-[23px] flex gap-2.5 phone:mb-4 phone:gap-2">
        <label className="control min-w-0 flex-1 gap-2.5 px-3.5 text-muted focus-within:outline-2 focus-within:outline-solid focus-within:outline-scarf focus-within:outline-offset-2"><Search size={19} /><input className="h-[43px] w-full min-w-0 border-0 bg-transparent text-[1rem] text-ink outline-none" type="search" value={query} aria-label="Search books" placeholder="Search books…" onChange={e => setQuery(e.target.value)} /></label>
        {(genres.length > 0 || availableFormats.length > 0) &&
          <BookFilters filters={filters} onApply={setFilters} genres={genres} availableFormats={availableFormats} />}
      </div>}
      {status === 'loading' && <p className="status" role="status">Loading books…</p>}
      {status === 'error' && <div className="status" role="alert"><p>The bookshelf couldn’t load.</p><button className="text-button" onClick={retry}>Try again</button></div>}
      {status === 'ready' && !results.length && <div className="status"><p>{filtered ? 'No books match your search.' : 'The bookshelf is empty for now.'}</p>{filtered && <button className="text-button" onClick={clear}>Clear search and filters</button>}</div>}
      <div className="grid grid-cols-4 gap-x-[22px] gap-y-7 compact:grid-cols-3 phone:grid-cols-2 phone:gap-x-[13px] phone:gap-y-5">{results.map(book => <div className="book-card min-w-0" key={book.id}><button className="group w-full flex flex-col items-stretch rounded-[9px] border-0 p-0 text-left" onClick={() => open(book)}>
        <span className="card-art grid aspect-[1.15] place-items-center rounded-[10px] border border-[#d9ded6] bg-[#e6e9e4] phone:aspect-[.87]"><span className="grid h-[81%] max-w-[80%] min-h-0 drop-shadow-[3px_5px_4px_#3334] transition-transform duration-[180ms] ease-[ease] group-hover:-translate-y-[3px] motion-reduce:transition-none"><Cover book={book} lazy /></span></span>
        <span className="card-title mt-[11px] font-serif text-[1.3rem] leading-[1.2] tracking-[-.025em] phone:text-[1.15rem]">{book.title}</span><span className="mt-1 text-control text-muted">{book.author}</span>
      </button>
        {edit && <button className="admin-secondary mt-2" aria-label={`Edit ${book.title} by ${book.author}`} onClick={() => edit(book)}><Pencil size={14} />Edit</button>}
      </div>)}</div>
    </section>
    {selected && <BookDetails key={selected.id} book={selected} close={close} edit={edit} />}
  </>
}
