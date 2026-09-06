/**
 * Assemble week4/replay.html + replay-bookmark.js from extracted engine + LO content.
 */
import fs from 'fs';
import lo41 from './_content_lo41.mjs';
import lo42 from './_content_lo42.mjs';
import lo43 from './_content_lo43.mjs';
import lo44 from './_content_lo44.mjs';
import lo45 from './_content_lo45.mjs';
import lo46 from './_content_lo46.mjs';
import lo47 from './_content_lo47.mjs';
import end from './_content_end.mjs';

const css = fs.readFileSync('D:/sterling-vale/week4/_parts/engine.css', 'utf8');
const js = fs.readFileSync('D:/sterling-vale/week4/_parts/engine.js', 'utf8');

const shell = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chapter 4: Replay — Sterling &amp; Vale</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>
<a href="#main" class="skip-link">Skip to content</a>

<header class="topbar">
  <div class="header-card">
    <span class="to-label">To:</span>
    <span class="mark">MKT 150 · CH.4 Replay</span>
  </div>
  <span class="score-chip" title="Practice points only. These are not part of your course grade.">Practice <span id="scoreVal">0</span> pts</span>
  <div class="chapter-meter" title="Seven segments = objectives 4.1–4.7. Position code = week.section.page (e.g. 4.2.3).">
    <span class="cm-count" id="cmCount">01 / 07</span>
    <div class="cm-segs" id="cmSegs" aria-hidden="true" title="One segment per objective (4.1–4.7)"></div>
  </div>
  <button class="toc-btn" id="tocBtn" type="button" aria-expanded="false" aria-controls="sideNav">
    <span class="toc-ico" aria-hidden="true"></span>Sections
  </button>
  <a class="back-link" href="index.html">&larr; Week 4 files</a>
</header>

<div class="nav-scrim" id="navScrim" hidden></div>

<div class="shell">

  <aside class="sidenav" id="sideNav" aria-label="Chapter contents">
    <div class="sn-head">Chapter 4 · IMC Planning</div>
    <p class="sn-practice-note" role="note">Practice only — these points are not part of your course grade. Graded work is in Canvas.</p>
    <ul class="sn-list" id="snList"></ul>
  </aside>

  <div class="wrap" id="main">

  <div class="lede-card">
    <div class="station-chip" id="stationChip" hidden></div>
    <div class="head-row">
      <span class="pad" id="loBadge" aria-hidden="true"><span id="loBadgeNum"></span></span>
      <h1 id="headTitle"></h1>
    </div>
    <p class="lo" id="headLo"></p>
    <h2 class="screen-title" id="screenTitle"></h2>
  </div>

  <p aria-live="polite" class="sr-only" id="live"></p>

${lo41}
${lo42}
${lo43}
${lo44}
${lo45}
${lo46}
${lo47}
${end}

  </div>

</div>

<footer class="navbar">
  <button class="btn ghost" id="btnBack" type="button">&larr; Back</button>
  <span class="nav-where" id="navWhere"></span>
  <button class="btn" id="btnNext" type="button">Next &rarr;</button>
  <span class="gate-note" id="gateNote" hidden>Finish the desk activity to continue</span>
</footer>

<script>
${js}
</script>
<script type="module" src="replay-bookmark.js"></script>
</body>
</html>
`;

fs.writeFileSync('D:/sterling-vale/week4/replay.html', shell);

const bookmark = `import { persistReplayBookmark } from '../shared/replay-progress.js'
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
`;
fs.writeFileSync('D:/sterling-vale/week4/replay-bookmark.js', bookmark);

const html = fs.readFileSync('D:/sterling-vale/week4/replay.html', 'utf8');
const checks = {
  'data-lo="4.1"': html.includes('data-lo="4.1"'),
  'data-lo="4.2"': html.includes('data-lo="4.2"'),
  'data-lo="4.3"': html.includes('data-lo="4.3"'),
  'data-lo="4.4"': html.includes('data-lo="4.4"'),
  'data-lo="4.5"': html.includes('data-lo="4.5"'),
  'data-lo="4.6"': html.includes('data-lo="4.6"'),
  'data-lo="4.7"': html.includes('data-lo="4.7"'),
  'Replay.start': html.includes('Replay.start'),
  'ch4-replay': html.includes('ch4-replay'),
  'no ch3-replay': !html.includes('ch3-replay'),
  'no Week 3': !html.includes('Week 3'),
  'no Ridgeway': !html.includes('Ridgeway'),
  'Sam': html.includes('Sam'),
  'oxblood token': html.includes('#7A2E2E'),
  'no classic supabase script': !html.includes('script src="../shared/supabase-client.js"'),
  'replay-bookmark module': html.includes('type="module" src="replay-bookmark.js"'),
  'PRIZM 66': html.includes('66'),
};
console.log('bytes', html.length);
console.log(checks);
const bad = Object.entries(checks).filter(([, v]) => !v);
if (bad.length) {
  console.error('FAILED', bad);
  process.exit(1);
}
console.log('OK');
