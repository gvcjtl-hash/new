// Replay position: week.section.page (e.g. 2.2.1 = Week 2, section 2.2, screen 1).

import { saveReplayBookmark } from './supabase-client.js'

/** @param {string} lo  e.g. "1.1", "2.2" */
export function pageCode(lo, pageOneBased) {
  const p = Math.max(1, parseInt(String(pageOneBased), 10) || 1)
  const loNorm = String(lo || '').trim()
  if (!loNorm || loNorm === 'end') return ''
  return `${loNorm}.${p}`
}

export function parsePageCode(code) {
  const m = String(code || '')
    .trim()
    .match(/^(\d+\.\d+)\.(\d+)$/)
  if (!m) return null
  return { lo: m[1], page: parseInt(m[2], 10) }
}

export function weekFromLo(lo) {
  const m = String(lo || '').match(/^(\d+)\./)
  return m ? parseInt(m[1], 10) : null
}

export function replayHref(weekNumber, lo, page) {
  const w = parseInt(String(weekNumber), 10)
  const code = pageCode(lo, page)
  return `week${w}/replay.html?at=${encodeURIComponent(code)}`
}

export function humanResumeLine(bookmark) {
  if (!bookmark) return ''
  const code = bookmark.pageCode || pageCode(bookmark.lo, bookmark.page)
  const w = bookmark.weekNumber || weekFromLo(bookmark.lo)
  return `Week ${w}, section ${bookmark.lo}, page ${bookmark.page} (${code})`
}

/** Called from replay decks when the learner moves to a new screen. */
export async function persistReplayBookmark(opts) {
  const lo = opts.lo
  const page = opts.page
  const w = opts.weekNumber || opts.week || weekFromLo(lo)
  if (!lo || !page || !w) return
  const code = pageCode(lo, page)
  await saveReplayBookmark({
    weekNumber: w,
    lo,
    page,
    pageCode: code,
    resumePath: replayHref(w, lo, page),
    section: lo,
    sectionTitle: opts.sectionTitle || opts.label || '',
    screenTitle: opts.screenTitle || '',
  })
}
