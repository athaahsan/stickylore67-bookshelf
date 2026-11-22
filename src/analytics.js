import { recordBookshelfVisit } from './books'

const storageKey = 'sticky-lore-daily-visit'
const jakartaDate = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta' })
const sources = [
  { name: 'instagram', tags: ['instagram', 'ig'], domains: ['instagram.com'] },
  { name: 'youtube', tags: ['youtube', 'yt'], domains: ['youtube.com', 'youtu.be'] },
  { name: 'tiktok', tags: ['tiktok', 'tt'], domains: ['tiktok.com'] },
  { name: 'facebook', tags: ['facebook', 'fb'], domains: ['facebook.com', 'fb.com'] },
  { name: 'reddit', tags: ['reddit'], domains: ['reddit.com', 'redd.it'] },
  { name: 'google', tags: ['google'], domains: ['google.com'] },
]
let pendingVisit

export function trackBookshelfVisit() {
  pendingVisit ??= recordDailyVisit().catch(() => {
    // Analytics must stay out of the way when storage or the network is unavailable.
  }).finally(() => {
    pendingVisit = undefined
  })
  return pendingVisit
}

async function recordDailyVisit() {
  const day = jakartaDate.format(new Date())
  let visit = JSON.parse(localStorage.getItem(storageKey))
  if (visit?.day !== day) {
    visit = { day, browserId: crypto.randomUUID(), trafficSource: detectTrafficSource(), recorded: false }
    localStorage.setItem(storageKey, JSON.stringify(visit))
  }
  if (visit.recorded) return

  const countryCode = await fetchVisitorCountry()
  await recordBookshelfVisit(visit.browserId, countryCode, visit.trafficSource ?? detectTrafficSource())
  const current = JSON.parse(localStorage.getItem(storageKey))
  if (current?.browserId === visit.browserId) {
    localStorage.setItem(storageKey, JSON.stringify({ ...visit, recorded: true }))
  }
}

function detectTrafficSource() {
  const tag = new URLSearchParams(window.location.search).get('utm_source')?.trim().toLowerCase()
  const campaign = sources.find(source => source.tags.includes(tag))
  if (campaign) return campaign.name

  try {
    const referrer = new URL(document.referrer)
    if (referrer.origin === window.location.origin) return 'direct'
    const host = referrer.hostname
    const referral = sources.find(source => source.domains.some(domain => host === domain || host.endsWith(`.${domain}`)))
    if (referral) return referral.name
  } catch {
    return 'direct'
  }
  return 'other'
}

async function fetchVisitorCountry() {
  try {
    const response = await fetch('/api/visitor-country', {
      signal: AbortSignal.timeout(1500),
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    })
    if (!response.ok) return null
    const { countryCode } = await response.json()
    return /^[A-Z]{2}$/.test(countryCode ?? '') ? countryCode : null
  } catch {
    return null
  }
}
