// Login chip + progress saves for static pages hosted on Netlify.
// Session is localStorage on this origin (the Netlify URL). file:// will not work.

import {
  getSession,
  saveRoundResult,
  markPracticeComplete,
  markLearnComplete,
  markApplyComplete,
} from './supabase-client.js'

function loginHref() {
  return '../index.html'
}

export async function paintAuthLine(el) {
  if (!el) return { session: null }
  try {
    const session = await getSession()
    if (!session) {
      el.innerHTML =
        'Not signed in — progress won\u2019t be saved. <a href="' + loginHref() + '">Log in</a>'
      el.classList.add('bad')
      return { session: null }
    }
    const codename = session.user.user_metadata?.codename || 'Agent'
    el.textContent = 'Welcome back, ' + codename + '.'
    el.classList.remove('bad')
    return { session }
  } catch {
    el.textContent = 'Playing offline — progress won\u2019t be saved.'
    el.classList.add('bad')
    return { session: null }
  }
}

export function scoreResult(firstTry, total, extra) {
  const t = Number(total) || 0
  const first = Number(firstTry) || 0
  return Object.assign(
    {
      score: t ? first / t : 0,
      correct: first,
      total: t,
      firstTry: first,
    },
    extra || {}
  )
}

export async function connectDesk(opts) {
  const auth = await paintAuthLine(opts.authEl)
  return {
    session: auth.session,
    save: async function (firstTry, total, extra) {
      const result = scoreResult(firstTry, total, extra)
      try {
        await saveRoundResult(opts.week, opts.mechanic, opts.gameId, result)
      } catch (err) {
        console.error('Save failed:', err && err.message)
      }
      const deskKey = opts.deskKey || opts.gameId
      try {
        await markPracticeComplete(opts.week, { desks: { [deskKey]: true } })
      } catch (err) {
        console.error('Practice flag failed:', err && err.message)
      }
    },
  }
}

export { getSession, saveRoundResult, markLearnComplete, markApplyComplete, markPracticeComplete }
