// /shared/engine.js
// Sterling & Vale — the generic Practice engine.
// "One engine, many content shapes" (Section 2). New weeks write a content
// JSON file matching one of the 6 shapes below; they never touch this file.
//
// USAGE (from any game page):
//   import { runRound } from './shared/engine.js'
//   runRound(document.getElementById('game-root'), roundSchema, {
//     onComplete: (result) => { ... save result, e.g. via saveRoundResult() ... }
//   })
//
// roundSchema.mechanic must be one of:
//   'gate_check' | 'dual_pick' | 'continuum_dial' |
//   'sort_categorize' | 'diagnostic_trace' | 'resource_allocation'
//
// CONTRACT: every mechanic's onComplete result is { score: 0.0–1.0, ...detail }.
// This matches the practice_round_records.result contract locked in Week 1's
// instructor-view scaffolding (002_instructor_view_scaffolding.sql) — do not
// change this shape without updating that SQL too.

const STYLE_ID = 'engine-styles'

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  // Functional pass only. Uses CSS custom properties with sensible defaults
  // so Week 3's design-tokens.css can override colors/fonts globally later
  // without touching this file.
  style.textContent = `
    .engine-root {
      --engine-rust: #B84E28;
      --engine-mustard: #D79A2C;
      --engine-teal: #2F6B67;
      --engine-walnut: #5C4230;
      --engine-bg: #2B2620;
      --engine-border: var(--engine-walnut);
      --engine-text: #F4EFE3;
      --engine-muted: #C9BFA8;
      --engine-accent: var(--engine-mustard);
      --engine-correct: #4C8C5B;
      --engine-incorrect: var(--engine-rust);
      --engine-action: var(--engine-teal);
      font-family: 'Barlow', Georgia, serif;
      color: var(--engine-text);
      max-width: 640px;
      margin: 0 auto;
    }
    .engine-card {
      background:
        repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px),
        var(--engine-bg);
      border: 1px solid var(--engine-border);
      border-radius: 4px;
      padding: 28px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.25);
      position: relative;
    }
    .engine-progress {
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--engine-accent);
      margin-bottom: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .engine-prompt {
      font-family: 'Barlow', Georgia, serif;
      font-size: 1.15rem;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .engine-scenario {
      font-family: 'Special Elite', monospace;
      font-size: 0.85rem;
      color: var(--engine-muted);
      line-height: 1.6;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px dashed var(--engine-border);
    }
    .engine-options {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .engine-option {
      text-align: left;
      padding: 12px 16px;
      background: #1D1A15;
      border: 1px solid var(--engine-border);
      border-radius: 3px;
      color: var(--engine-text);
      cursor: pointer;
      font-size: 0.95rem;
      font-family: 'Barlow', sans-serif;
      transition: border-color 0.15s ease;
    }
    .engine-option:hover { border-color: var(--engine-accent); }
    .engine-option.selected { border-color: var(--engine-accent); background: #332B1E; }
    .engine-option.correct { border-color: var(--engine-correct); background: #24352A; }
    .engine-option.incorrect { border-color: var(--engine-incorrect); background: #3A2620; }
    .engine-btn {
      margin-top: 20px;
      padding: 12px 22px;
      background: var(--engine-action);
      border: none;
      border-radius: 3px;
      color: #fff;
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .engine-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .engine-btn.secondary { background: transparent; border: 1px solid var(--engine-border); }
    .engine-feedback {
      margin-top: 16px;
      font-size: 0.9rem;
      line-height: 1.5;
      padding: 12px 14px;
      border-radius: 3px;
      background: #1D1A15;
      border: 1px solid var(--engine-border);
    }
    .engine-result-score {
      font-family: 'Yeseva One', serif;
      font-size: 2.6rem;
      color: var(--engine-accent);
      text-align: center;
      margin: 8px 0 4px;
      text-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .engine-result-label {
      font-family: 'Special Elite', monospace;
      text-align: center;
      color: var(--engine-muted);
      font-size: 0.8rem;
      margin-bottom: 20px;
      position: relative;
      display: inline-block;
      width: 100%;
    }
    .engine-sort-buckets {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .engine-bucket {
      border: 1px dashed var(--engine-border);
      border-radius: 3px;
      padding: 10px;
      min-height: 90px;
    }
    .engine-bucket-label {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
      color: var(--engine-muted);
      margin-bottom: 8px;
    }
    .engine-item-pool {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    .engine-item {
      padding: 6px 12px;
      background: #1D1A15;
      border: 1px solid var(--engine-border);
      border-radius: 3px;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .engine-item.placed { opacity: 0.35; cursor: default; }
    .engine-item.selected-for-place { border-color: var(--engine-accent); }
    .engine-bucket-item {
      padding: 4px 8px;
      background: #332B1E;
      border-radius: 3px;
      font-size: 0.8rem;
      margin-bottom: 4px;
    }
    .engine-dial-row {
      display: flex;
      justify-content: space-between;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--engine-muted);
      margin-bottom: 6px;
    }
    .engine-dial-value {
      font-family: 'Yeseva One', serif;
      text-align: center;
      font-size: 1.8rem;
      color: var(--engine-accent);
      margin: 12px 0;
    }
    .engine-alloc-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }
    .engine-alloc-label { flex: 1; font-size: 0.9rem; }
    .engine-alloc-value { width: 52px; text-align: right; color: var(--engine-accent); font-family: 'Barlow Condensed', sans-serif; }
    .engine-alloc-total {
      text-align: right;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 0.85rem;
      color: var(--engine-muted);
      margin-top: 4px;
    }
  `
  document.head.appendChild(style)

  // Load the 1960s-era type system if it isn't already on the page.
  if (!document.getElementById('engine-fonts')) {
    const fontLink = document.createElement('link')
    fontLink.id = 'engine-fonts'
    fontLink.rel = 'stylesheet'
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Yeseva+One&family=Barlow+Condensed:wght@600&family=Special+Elite&family=Barlow:wght@400;500&display=swap'
    document.head.appendChild(fontLink)
  }
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n))
}

function renderResultScreen(root, roundData, result, onComplete) {
  root.innerHTML = ''
  const card = document.createElement('div')
  card.className = 'engine-card'
  const pct = Math.round(result.score * 100)
  card.innerHTML = `
    <div class="engine-progress">Result</div>
    <div class="engine-result-score">${pct}%</div>
    <div class="engine-result-label">${roundData.title || 'Round complete'}</div>
    <button class="engine-btn">Continue</button>
  `
  card.querySelector('.engine-btn').addEventListener('click', () => onComplete(result))
  root.appendChild(card)
}

// ============================================================
// 1. Gate-Check Inspection — answer several criteria, then a final verdict.
// Schema: { candidate, criteria: [{id,label,question,correctAnswer:bool}],
//           verdictPrompt, verdictOptions: [{id,label}], correctVerdictId }
// ============================================================
function renderGateCheck(root, data, onComplete) {
  let index = 0
  const answers = []

  function renderCriterion() {
    root.innerHTML = ''
    const card = document.createElement('div')
    card.className = 'engine-card'
    const c = data.criteria[index]
    card.innerHTML = `
      <div class="engine-progress">Criterion ${index + 1} of ${data.criteria.length}</div>
      <div class="engine-scenario">${data.candidate}</div>
      <div class="engine-prompt">${c.question}</div>
      <div class="engine-options">
        <button class="engine-option" data-answer="true">Yes</button>
        <button class="engine-option" data-answer="false">No</button>
      </div>
    `
    card.querySelectorAll('.engine-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const answer = btn.dataset.answer === 'true'
        answers.push(answer === c.correctAnswer)
        index += 1
        if (index < data.criteria.length) renderCriterion()
        else renderVerdict()
      })
    })
    root.appendChild(card)
  }

  function renderVerdict() {
    root.innerHTML = ''
    const card = document.createElement('div')
    card.className = 'engine-card'
    card.innerHTML = `
      <div class="engine-progress">Final Verdict</div>
      <div class="engine-prompt">${data.verdictPrompt}</div>
      <div class="engine-options">
        ${data.verdictOptions.map((v) => `<button class="engine-option" data-id="${v.id}">${v.label}</button>`).join('')}
      </div>
    `
    card.querySelectorAll('.engine-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const verdictCorrect = btn.dataset.id === data.correctVerdictId
        const totalCorrect = answers.filter(Boolean).length + (verdictCorrect ? 1 : 0)
        const score = clamp01(totalCorrect / (data.criteria.length + 1))
        renderResultScreen(root, data, {
          score,
          criteriaCorrect: answers.filter(Boolean).length,
          criteriaTotal: data.criteria.length,
          verdictCorrect,
        }, onComplete)
      })
    })
    root.appendChild(card)
  }

  renderCriterion()
}

// ============================================================
// 2. Dual/Multi-Pick Brief — select 2+ correct calls from a list.
// Schema: { scenario, prompt, picks: [{id,label}], correctPickIds: [id,...],
//           minSelect, maxSelect }
// ============================================================
function renderDualPick(root, data, onComplete) {
  const selected = new Set()

  function render() {
    root.innerHTML = ''
    const card = document.createElement('div')
    card.className = 'engine-card'
    card.innerHTML = `
      <div class="engine-progress">Select ${data.minSelect}${data.maxSelect > data.minSelect ? `–${data.maxSelect}` : ''}</div>
      <div class="engine-scenario">${data.scenario}</div>
      <div class="engine-prompt">${data.prompt}</div>
      <div class="engine-options">
        ${data.picks.map((p) => `<button class="engine-option" data-id="${p.id}">${p.label}</button>`).join('')}
      </div>
      <button class="engine-btn" disabled>Submit</button>
    `
    const submitBtn = card.querySelector('.engine-btn')
    card.querySelectorAll('.engine-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id
        if (selected.has(id)) {
          selected.delete(id)
          btn.classList.remove('selected')
        } else if (selected.size < data.maxSelect) {
          selected.add(id)
          btn.classList.add('selected')
        }
        submitBtn.disabled = selected.size < data.minSelect
      })
    })
    submitBtn.addEventListener('click', () => {
      const correctSet = new Set(data.correctPickIds)
      const correctHits = [...selected].filter((id) => correctSet.has(id)).length
      const wrongHits = [...selected].filter((id) => !correctSet.has(id)).length
      const score = clamp01((correctHits - wrongHits) / correctSet.size)
      renderResultScreen(root, data, {
        score,
        correctHits,
        wrongHits,
        totalCorrect: correctSet.size,
      }, onComplete)
    })
    root.appendChild(card)
  }

  render()
}

// ============================================================
// 3. Continuum Dial — slider judgment scored by distance from a target zone.
// Schema: { prompt, leftLabel, rightLabel, min, max, step, targetMin, targetMax }
// ============================================================
function renderContinuumDial(root, data, onComplete) {
  root.innerHTML = ''
  const card = document.createElement('div')
  card.className = 'engine-card'
  const mid = Math.round((data.min + data.max) / 2)
  card.innerHTML = `
    <div class="engine-progress">Continuum Judgment</div>
    <div class="engine-prompt">${data.prompt}</div>
    <div class="engine-dial-value">${mid}</div>
    <input type="range" id="engine-dial" min="${data.min}" max="${data.max}" step="${data.step || 1}" value="${mid}" style="width:100%;">
    <div class="engine-dial-row"><span>${data.leftLabel}</span><span>${data.rightLabel}</span></div>
    <button class="engine-btn">Lock In</button>
  `
  const slider = card.querySelector('#engine-dial')
  const valueDisplay = card.querySelector('.engine-dial-value')
  slider.addEventListener('input', () => { valueDisplay.textContent = slider.value })
  card.querySelector('.engine-btn').addEventListener('click', () => {
    const value = Number(slider.value)
    const range = data.max - data.min
    let distance = 0
    if (value < data.targetMin) distance = data.targetMin - value
    else if (value > data.targetMax) distance = value - data.targetMax
    const score = clamp01(1 - distance / (range / 2))
    renderResultScreen(root, data, { score, value, targetMin: data.targetMin, targetMax: data.targetMax }, onComplete)
  })
  root.appendChild(card)
}

// ============================================================
// 4. Sort/Categorize — click an item, then click the bucket it belongs in.
// Schema: { items: [{id,label}], buckets: [{id,label}], correctMap: {itemId: bucketId} }
// ============================================================
function renderSortCategorize(root, data, onComplete) {
  let selectedItemId = null
  const placements = {}

  function render() {
    root.innerHTML = ''
    const card = document.createElement('div')
    card.className = 'engine-card'
    const remaining = data.items.filter((i) => !(i.id in placements))
    card.innerHTML = `
      <div class="engine-progress">Sort each item — click an item, then its bucket</div>
      <div class="engine-item-pool">
        ${remaining.map((i) => `<div class="engine-item" data-id="${i.id}">${i.label}</div>`).join('')}
      </div>
      <div class="engine-sort-buckets">
        ${data.buckets.map((b) => `
          <div class="engine-bucket" data-bucket="${b.id}">
            <div class="engine-bucket-label">${b.label}</div>
            ${data.items.filter((i) => placements[i.id] === b.id)
              .map((i) => `<div class="engine-bucket-item">${i.label}</div>`).join('')}
          </div>
        `).join('')}
      </div>
      <button class="engine-btn" ${remaining.length ? 'disabled' : ''}>Submit</button>
    `
    card.querySelectorAll('.engine-item').forEach((el) => {
      el.addEventListener('click', () => {
        card.querySelectorAll('.engine-item').forEach((x) => x.classList.remove('selected-for-place'))
        selectedItemId = el.dataset.id
        el.classList.add('selected-for-place')
      })
    })
    card.querySelectorAll('.engine-bucket').forEach((el) => {
      el.addEventListener('click', () => {
        if (!selectedItemId) return
        placements[selectedItemId] = el.dataset.bucket
        selectedItemId = null
        render()
      })
    })
    const submitBtn = card.querySelector('.engine-btn')
    submitBtn.addEventListener('click', () => {
      const total = data.items.length
      const correct = data.items.filter((i) => placements[i.id] === data.correctMap[i.id]).length
      const score = clamp01(correct / total)
      renderResultScreen(root, data, { score, correct, total }, onComplete)
    })
    root.appendChild(card)
  }

  render()
}

// ============================================================
// 5. Diagnostic Trace — walk multi-stage case to a final diagnosis.
// Schema: { stages: [{id,prompt,options:[{id,label}],correctOptionId}],
//           finalPrompt, finalOptions:[{id,label}], correctFinalId }
// ============================================================
function renderDiagnosticTrace(root, data, onComplete) {
  let index = 0
  const correctness = []

  function renderStage() {
    root.innerHTML = ''
    const card = document.createElement('div')
    card.className = 'engine-card'
    const isFinal = index === data.stages.length
    const stage = isFinal
      ? { prompt: data.finalPrompt, options: data.finalOptions, correctOptionId: data.correctFinalId }
      : data.stages[index]
    card.innerHTML = `
      <div class="engine-progress">${isFinal ? 'Final Diagnosis' : `Stage ${index + 1} of ${data.stages.length}`}</div>
      <div class="engine-prompt">${stage.prompt}</div>
      <div class="engine-options">
        ${stage.options.map((o) => `<button class="engine-option" data-id="${o.id}">${o.label}</button>`).join('')}
      </div>
    `
    card.querySelectorAll('.engine-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        correctness.push(btn.dataset.id === stage.correctOptionId)
        index += 1
        if (index <= data.stages.length) renderStage()
        else {
          const score = clamp01(correctness.filter(Boolean).length / correctness.length)
          renderResultScreen(root, data, {
            score,
            stagesCorrect: correctness.filter(Boolean).length,
            stagesTotal: correctness.length,
          }, onComplete)
        }
      })
    })
    root.appendChild(card)
  }

  renderStage()
}

// ============================================================
// 6. Resource Allocation — split a fixed budget across categories, scored
//    by closeness to an ideal mix.
// Schema: { scenario, totalBudget, categories: [{id,label}], idealSplit: {id: pct} }
// ============================================================
function renderResourceAllocation(root, data, onComplete) {
  const values = {}
  data.categories.forEach((c) => { values[c.id] = Math.round(100 / data.categories.length) })

  function total() {
    return Object.values(values).reduce((a, b) => a + b, 0)
  }

  function render() {
    root.innerHTML = ''
    const card = document.createElement('div')
    card.className = 'engine-card'
    card.innerHTML = `
      <div class="engine-progress">Allocate ${data.totalBudget} across categories (% must total 100)</div>
      <div class="engine-scenario">${data.scenario}</div>
      ${data.categories.map((c) => `
        <div class="engine-alloc-row">
          <div class="engine-alloc-label">${c.label}</div>
          <input type="range" min="0" max="100" value="${values[c.id]}" data-id="${c.id}" style="flex:2;">
          <div class="engine-alloc-value" data-display="${c.id}">${values[c.id]}%</div>
        </div>
      `).join('')}
      <div class="engine-alloc-total" data-total>Total: ${total()}%</div>
      <button class="engine-btn" ${total() === 100 ? '' : 'disabled'}>Submit</button>
    `
    card.querySelectorAll('input[type=range]').forEach((slider) => {
      slider.addEventListener('input', () => {
        values[slider.dataset.id] = Number(slider.value)
        card.querySelector(`[data-display="${slider.dataset.id}"]`).textContent = `${slider.value}%`
        card.querySelector('[data-total]').textContent = `Total: ${total()}%`
        card.querySelector('.engine-btn').disabled = total() !== 100
      })
    })
    card.querySelector('.engine-btn').addEventListener('click', () => {
      let totalDiff = 0
      data.categories.forEach((c) => {
        totalDiff += Math.abs(values[c.id] - (data.idealSplit[c.id] || 0))
      })
      // max possible totalDiff is 200 (completely inverted allocation)
      const score = clamp01(1 - totalDiff / 200)
      renderResultScreen(root, data, { score, allocation: { ...values }, idealSplit: data.idealSplit }, onComplete)
    })
    root.appendChild(card)
  }

  render()
}

const RENDERERS = {
  gate_check: renderGateCheck,
  dual_pick: renderDualPick,
  continuum_dial: renderContinuumDial,
  sort_categorize: renderSortCategorize,
  diagnostic_trace: renderDiagnosticTrace,
  resource_allocation: renderResourceAllocation,
}

// ============================================================
// Public entry point.
// ============================================================
export function runRound(container, roundData, { onComplete } = {}) {
  ensureStyles()
  container.classList.add('engine-root')
  const renderer = RENDERERS[roundData.mechanic]
  if (!renderer) {
    container.innerHTML = `<div class="engine-card">Unknown mechanic: "${roundData.mechanic}"</div>`
    return
  }
  renderer(container, roundData, (result) => {
    if (typeof onComplete === 'function') onComplete(result)
  })
}
