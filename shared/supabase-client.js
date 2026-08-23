// /shared/supabase-client.js
// Supabase init + the codename/PIN/recovery-phrase auth flow described
// in Section 8a of the design roadmap. No real name or email is ever
// collected, transmitted, or stored anywhere in this file or the schema
// it talks to (see /sql/001_init_schema.sql).
//
// HOW THE "NO EMAIL" TRICK WORKS:
// Supabase Auth is built around email/password. We give it a synthetic,
// non-identifying "email" derived deterministically from the student's
// codename (e.g. "maverick@svale.local") — it's never real, never used
// to send mail, and never seen by the student. The PIN is padded to a
// fixed-format password so it satisfies Supabase's minimum length.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm'

// ── FILL THESE IN FROM THE SUPABASE DASHBOARD (Settings → API) ──
// The anon key is *meant* to be public in client-side code — real
// protection comes from the RLS policies in 001_init_schema.sql, not
// from hiding this key. Never put the service_role key here or in any
// client-side file. See Section 7's credentials note.
const SUPABASE_URL = 'https://bdraobzoppsguqvtlsdq.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_nZGHNYT-PGn_0ekon5_rCg_Fj1K56SK'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

const EMAIL_DOMAIN = 'svale.local'
const PASSWORD_PREFIX = 'svale-'

// ---- internal helpers ----------------------------------------------------

function slugifyCodename(codename) {
  return codename.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function codenameToEmail(codename) {
  return `${slugifyCodename(codename)}@${EMAIL_DOMAIN}`
}

function pinToPassword(pin) {
  return `${PASSWORD_PREFIX}${pin}`
}

async function sha256Hex(text) {
  // Normalize so recall is forgiving of case/whitespace when a student
  // re-enters their recovery phrase weeks later.
  const normalized = text.trim().toLowerCase()
  const bytes = new TextEncoder().encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ---- public auth API used by index.html -----------------------------------

export async function isCodenameAvailable(codename) {
  const { data, error } = await supabase.rpc('codename_available', {
    check_codename: codename,
  })
  if (error) throw error
  return data
}

export async function signUpCodename(codename, pin, recoveryPhrase) {
  const available = await isCodenameAvailable(codename)
  if (!available) {
    throw new Error('That codename is already on file at Sterling & Vale. Try another.')
  }

  const recovery_phrase_hash = await sha256Hex(recoveryPhrase)

  const { data, error } = await supabase.auth.signUp({
    email: codenameToEmail(codename),
    password: pinToPassword(pin),
    options: {
      data: { codename, recovery_phrase_hash },
    },
  })
  if (error) throw error
  return data
}

export async function signInCodename(codename, pin) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: codenameToEmail(codename),
    password: pinToPassword(pin),
  })
  if (error) throw new Error('Codename or PIN did not match.')
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Fires on sign-in, sign-out, token refresh, AND on page load with an
// existing session — this is what makes "log back in with session intact"
// work without any extra code.
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => callback(session, event))
}

// Persists one completed engine.js round to practice_round_records.
// `result` must be the object engine.js's onComplete callback receives —
// it already matches the { score, ...detail } contract this table expects.
// Requires the student to be logged in (RLS ties every row to auth.uid()).
function withScore(result) {
  const payload = result && typeof result === 'object' ? { ...result } : { score: 0 }
  if (typeof payload.score !== 'number') {
    const total = Number(payload.total) || 0
    const hits = Number(payload.firstTry ?? payload.correct) || 0
    payload.score = total ? hits / total : 0
  }
  return payload
}

export async function saveRoundResult(weekNumber, mechanic, gameId, result) {
  const session = await getSession()
  if (!session) throw new Error('Not logged in — cannot save round result.')

  const { error } = await supabase.from('practice_round_records').insert({
    user_id: session.user.id,
    week_number: weekNumber,
    mechanic,
    game_id: gameId,
    result: withScore(result),
  })
  if (error) throw error
}

function mergeKpis(existing, incoming) {
  const a = existing && typeof existing === 'object' ? existing : {}
  const b = incoming && typeof incoming === 'object' ? incoming : {}
  const desks = { ...(a.desks || {}), ...(b.desks || {}) }
  const out = { ...a, ...b }
  if (Object.keys(desks).length) out.desks = desks
  return out
}

async function upsertChapterFlags(weekNumber, flags, kpis = {}) {
  const session = await getSession()
  if (!session) throw new Error('Not logged in — cannot save progress.')

  let existing = null
  try {
    existing = await getChapterProgress(weekNumber)
  } catch (_) {
    existing = null
  }

  const row = {
    user_id: session.user.id,
    week_number: weekNumber,
    kpis: mergeKpis(existing && existing.kpis, kpis),
  }
  if (flags.learn_complete) row.learn_complete = true
  if (flags.practice_complete) row.practice_complete = true
  if (flags.apply_complete) row.apply_complete = true

  const { error } = await supabase.from('chapter_progress').upsert(row, {
    onConflict: 'user_id,week_number',
  })
  if (error) throw error
}

// Marks the Learn phase complete for a given week and stores any KPIs
// (e.g. how many knowledge checks were answered correctly on the first
// try). Upserts because a student could theoretically replay Learn later.
export async function markLearnComplete(weekNumber, kpis = {}) {
  await upsertChapterFlags(weekNumber, { learn_complete: true }, kpis)
}

export async function markPracticeComplete(weekNumber, kpis = {}) {
  await upsertChapterFlags(weekNumber, { practice_complete: true }, kpis)
}

export async function markApplyComplete(weekNumber, kpis = {}) {
  await upsertChapterFlags(weekNumber, { apply_complete: true }, kpis)
}

// Reads back a student's progress row for a given week — this is what
// makes a page "backend-aware": it can check what's already been seen
// before deciding what to show.
export async function getChapterProgress(weekNumber) {
  const session = await getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('chapter_progress')
    .select('learn_complete, practice_complete, apply_complete, kpis')
    .eq('user_id', session.user.id)
    .eq('week_number', weekNumber)
    .maybeSingle()
  if (error) throw error
  return data
}

// Requires the reset-pin Edge Function (supabase/functions/reset-pin) to be
// deployed — see SETUP-NOTES.md. Until then this will fail with a fetch error,
// which is expected: recovery isn't part of today's exit check.
export async function resetPinWithRecovery(codename, recoveryPhrase, newPin) {
  const recoveryPhraseHash = await sha256Hex(recoveryPhrase)
  const res = await fetch(`${SUPABASE_URL}/functions/v1/reset-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codename, recoveryPhraseHash, newPin }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Could not reset PIN.')
  return json
}

// Last replay screen (week.section.page) for the resume prompt on index.html.
// Stored in auth user_metadata.last_replay and mirrored in localStorage.
export async function saveReplayBookmark(bookmark) {
  const session = await getSession()
  const uid = session?.user?.id
  const storageKey = uid ? `sv-last-replay-${uid}` : 'sv-last-replay-guest'
  try {
    localStorage.setItem(storageKey, JSON.stringify(bookmark))
  } catch (_) {
    /* storage disabled */
  }
  if (!session) return

  const { error } = await supabase.auth.updateUser({
    data: { last_replay: bookmark },
  })
  if (error) console.warn('saveReplayBookmark:', error.message)
}

export async function loadReplayBookmark() {
  const session = await getSession()
  const uid = session?.user?.id
  const storageKey = uid ? `sv-last-replay-${uid}` : 'sv-last-replay-guest'

  const meta = session?.user?.user_metadata?.last_replay
  if (meta && meta.pageCode && meta.resumePath) return meta

  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && parsed.pageCode ? parsed : null
  } catch {
    return null
  }
}