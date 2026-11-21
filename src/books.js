import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const db = url && key ? createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}) : null

const columns = [
  'id', 'title', 'author', 'description', 'cover_url', 'genres',
  'series_name', 'series_number', 'trailer_url', 'is_featured',
  'physical_book_affiliate_url', 'ebook_affiliate_url', 'audiobook_affiliate_url',
  'box_set_affiliate_url',
]

export const booksTable = 'stickylore67_books'
export const seriesTable = 'stickylore67_series'
const publicBookColumns = [...columns, 'featured_until'].join(',')
export const adminBookColumns = `${publicBookColumns},bookshelf_visibility`

export function createAdminClient() {
  return url && key ? createClient(url, key, {
    auth: { storageKey: 'sticky-lore-admin', detectSessionInUrl: false },
  }) : null
}

export function isBookFeatured(book, now) {
  return book.is_featured && (!book.featured_until || Date.parse(book.featured_until) > now)
}

export async function fetchBooks(signal) {
  if (!db) throw new Error('Missing Supabase configuration')
  const books = []
  const pageSize = 200
  let selection = publicBookColumns
  while (!signal.aborted) {
    const { data, error } = await db.from(booksTable).select(selection)
      .order('created_at', { ascending: false }).order('id')
      .range(books.length, books.length + pageSize - 1).abortSignal(signal)
    if (error?.code === '42703' && selection.includes('featured_until') && error.message.includes('featured_until')) {
      selection = columns.join(',')
      continue
    }
    if (error) throw error
    books.push(...data)
    if (data.length < pageSize) break
  }
  return books
}

export async function fetchSeriesTotals(signal, client = db) {
  if (!client) return new Map()
  const { data, error } = await client.from(seriesTable).select('series_key,total_books').abortSignal(signal)
  if (error) throw error
  return new Map(data.map(({ series_key, total_books }) => [series_key, total_books]))
}

export function webUrl(value) {
  try {
    const parsed = new URL(value)
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}

export function youtubeId(value) {
  const href = webUrl(value)
  if (!href) return null
  const { hostname, pathname, searchParams } = new URL(href)
  const [, type, part] = pathname.split('/')
  let id
  if (hostname === 'youtu.be') id = type
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(hostname)) {
    id = type === 'watch' ? searchParams.get('v') : ['shorts', 'embed', 'live'].includes(type) && part
  }
  return typeof id === 'string' && /^[\w-]{11}$/.test(id) ? id : null
}

function normalize(value) {
  return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

export function seriesKey(name) {
  return normalize(name).replace(/\s+/g, ' ')
}

export function seriesOptions(books) {
  const names = new Map()
  for (const { series_name } of books) {
    const key = seriesKey(series_name)
    if (key && !names.has(key)) names.set(key, series_name.trim())
  }
  return [...names].sort((a, b) => a[1].localeCompare(b[1]))
}

export function bookPosition(book, total) {
  if (book.series_number == null) return ''
  return `Book ${book.series_number}${total > 0 && total >= book.series_number ? ` of ${total}` : ''}`
}

export function filterBooks(books, query, filters) {
  const phrase = normalize(query)
  const words = phrase.split(/\s+/).filter(Boolean)
  const genres = new Set(filters.genres.map(normalize))
  const matches = []
  for (const book of books) {
    if (filters.series && seriesKey(book.series_name) !== filters.series) continue
    if (genres.size && !book.genres?.some(item => genres.has(normalize(item)))) continue
    if (filters.formats.length && !filters.formats.some(key => webUrl(book[key]))) continue
    const fields = [book.title, book.author, book.series_name, book.genres?.join(' '), book.description].map(normalize)
    const weights = [10, 8, 6, 3, 1]
    const scores = words.map(word => weights[fields.findIndex(field => field.includes(word))] ?? 0)
    if (scores.includes(0)) continue
    const score = scores.reduce((sum, weight) => sum + weight, 0)
    matches.push({ book, score, exactTitle: phrase !== '' && fields[0] === phrase })
  }
  return matches.sort((a, b) => {
    if (filters.series) {
      const first = a.book.series_number ?? Infinity
      const second = b.book.series_number ?? Infinity
      if (first !== second) return first - second
    }
    return Number(b.exactTitle) - Number(a.exactTitle) || b.score - a.score
  })
    .map(match => match.book)
}
