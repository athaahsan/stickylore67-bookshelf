import { recordBookshelfVisit } from './books'

const storageKey = 'sticky-lore-daily-visit'
const jakartaDate = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta' })
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
    visit = { day, browserId: crypto.randomUUID(), recorded: false }
    localStorage.setItem(storageKey, JSON.stringify(visit))
  }
  if (visit.recorded) return

  await recordBookshelfVisit(visit.browserId)
  const current = JSON.parse(localStorage.getItem(storageKey))
  if (current?.browserId === visit.browserId) {
    localStorage.setItem(storageKey, JSON.stringify({ ...visit, recorded: true }))
  }
}
