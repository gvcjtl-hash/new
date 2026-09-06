// Week 4 Replay — progress save via shared bookmark + learn-complete APIs.
// Same pattern as Week 1 (persistReplayBookmark + markLearnComplete).

import { persistReplayBookmark } from '../shared/replay-progress.js'
import { markLearnComplete } from '../shared/sv-auth.js'

window.__saveReplayPositionWeek4 = function saveReplayPositionWeek4() {
  const replay = window.Replay
  if (!replay || typeof replay.getState !== 'function') return
  const state = replay.getState()
  if (!state || !state.lo) return
  persistReplayBookmark({
    week: 4,
    lo: state.lo,
    page: state.page,
    sectionTitle: state.sectionTitle || '',
    screenTitle: state.screenTitle || '',
  })
}

window.__markLearnCompleteWeek4 = function markLearnCompleteWeek4() {
  markLearnComplete(4).catch(function (err) {
    console.warn('markLearnComplete(4):', err && err.message)
  })
}

// start() already rendered once before this module loaded — save now that hooks exist.
if (window.__saveReplayPositionWeek4) window.__saveReplayPositionWeek4()
