import { persistReplayBookmark } from '../shared/replay-progress.js'
import { markLearnComplete } from '../shared/supabase-client.js'

window.__saveReplayPositionWeek4 = function () {
  const st = window.Replay?.getState?.()
  if (!st?.lo) return
  persistReplayBookmark({
    weekNumber: 4,
    lo: st.lo,
    page: st.page,
    sectionTitle: st.sectionTitle,
    screenTitle: st.screenTitle,
  })
}

let learnMarked = false
window.__markLearnCompleteWeek4 = function () {
  if (learnMarked) return
  learnMarked = true
  markLearnComplete(4, { replay_complete: true }).catch(function (err) {
    console.error('Learn progress save failed:', err && err.message)
    learnMarked = false
  })
}
