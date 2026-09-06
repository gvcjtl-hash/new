/**
 * Extract cleaned CSS + JS engine from week3/replay.html for week4.
 */
import fs from 'fs';

const src = fs.readFileSync('D:/sterling-vale/week3/replay.html', 'utf8');
const styleRaw = src.slice(src.indexOf('<style>') + 7, src.indexOf('</style>'));
const scriptRaw = src.slice(
  src.indexOf('/* =====================================================================\n   REPLAY ENGINE'),
  src.lastIndexOf('</script>')
);

/** Remove CSS blocks whose header comment matches any of these prefixes. */
const cssDropPrefixes = [
  '/* ---------- brief markup ---------- */',
  '/* ---------- brand sim ---------- */',
  '/* ---------- self reflection ---------- */',
  '/* ---------- brand tree ---------- */',
  '/* ---------- 3.5.1 rebuy room doors ---------- */',
  '/* ---------- 3.4.1 The Roles infographic ---------- */',
  '/* ---------- 3.4.1 conference nameplate deal ---------- */',
  '/* ---------- 3.4.2 Ridgeway cast table ---------- */',
  '/* ---------- 3.8 dispatch roster ---------- */',
  '/* ---------- 3.6.1 photoreal pinboard (under process graphic) ---------- */',
  '/* ---------- trademark desk ---------- */',
  '/* ---------- dossier ---------- */',
  '/* ---------- tray-file: batch Then/Now, feedback after all ---------- */',
  '/* ---------- path-walk: build the new trip one step at a time ---------- */',
  '/* ---------- pair-read: flip two figures, then conclude ---------- */',
  '/* ---------- newspaper clippings ---------- */',
  '/* ---------- weighted tiers ---------- */',
  '/* ---------- flash-test ---------- */',
  '/* ---------- logo game ---------- */',
  '/* ---------- calc ---------- */',
  '/* ---------- timeline ---------- */',
  '/* ---------- case-pair ---------- */',
  '/* ---------- touchpoint tokens ---------- */',
  '/* ---------- role tokens (buying-center strip) ---------- */',
  '/* ---------- origin cards ---------- */',
  '/* ---------- info-flow process chips ---------- */',
  '/* ---------- film-still (static cold-open poster) ---------- */',
];

function dropCssBlocks(css, prefixes) {
  const parts = css.split(/(?=\/\* ---------- )/);
  return parts
    .filter((block) => {
      const head = block.slice(0, 120);
      return !prefixes.some((p) => head.startsWith(p) || head.includes(p.slice(0, 40)));
    })
    .join('');
}

let css = dropCssBlocks(styleRaw, cssDropPrefixes);

// Theme tokens + fonts
css = css
  .replace(/'Yeseva One'/g, "'Libre Baskerville'")
  .replace(/'Special Elite'/g, "'Oswald'")
  .replace(/'Barlow Condensed'/g, "'Oswald'")
  .replace(/Courier,monospace/g, 'sans-serif');

const rootNew = `:root{
  --smoke:#0E1012;--smoke-2:#171A1E;--navy:#1A2433;--paper:#EDE6D6;
  --oxblood:#7A2E2E;--oxblood-deep:#4A1A1A;--rust:#B85A32;
  --camel:#C6A46A;--camel-dim:#8E7344;--chrome:#C5CBD0;--chrome-dim:#7A848C;
  --red:#7A2E2E;--red-dark:#4A1A1A;--red-bright:#B85A32;--red-glow:rgba(122,46,46,.28);
  --gold:#C6A46A;--gold-dark:#8E7344;
  --teal:#3D5A6C;--teal-dark:#1A2433;
  --avocado:#C6A46A;--avocado-dark:#8E7344;
  --ink:#2A2218;--ink-2:#3A3228;--gray:#2A3038;--gray-soft:#EDE6D6;--gray-line:rgba(42,34,24,.22);
  --muted:#6B5D4A;--white:#F3EEE3;--good:#3D6B5A;--good-bg:#E1EDEA;--bad:#A32B2B;--bad-bg:#F4E3DE;
  --wood-light:#2A3038;--wood-dark:#0E1012;--ease:cubic-bezier(.22,1,.36,1);
  --panel:radial-gradient(130% 110% at 28% -12%,rgba(198,164,106,.12),transparent 58%),
          radial-gradient(90% 80% at 100% 100%,rgba(0,0,0,.45),transparent 62%),
          linear-gradient(163deg,#1A2433,#0E1012 58%,#171A1E);
  --panel-shadow:inset 0 0 34px rgba(0,0,0,.48),inset 0 1px 0 rgba(198,164,106,.12);
}`;

css = css.replace(/:root\{[\s\S]*?\n\}/, rootNew);

// Body: 1978 smoke floor
css = css.replace(
  /body\{font-family:'Barlow'[\s\S]*?background-attachment:fixed\}/,
  `body{font-family:'Barlow',system-ui,sans-serif;color:var(--ink);line-height:1.55;min-height:100vh;padding-bottom:84px;
  background:
    radial-gradient(1100px 760px at 50% -8%,rgba(198,164,106,.08),transparent 60%),
    radial-gradient(880px 660px at 90% 106%,rgba(122,46,46,.22),transparent 58%),
    radial-gradient(720px 600px at 2% 94%,rgba(26,36,51,.5),transparent 55%),
    linear-gradient(163deg,#171A1E,#0E1012 52%,#0A0C0E);
  background-attachment:fixed}`
);

css = css.replace(
  /h1,h2,h3,h4\{font-family:'Libre Baskerville',Georgia,serif;font-weight:400\}/,
  `h1,h2,h3,h4{font-family:'Libre Baskerville',Georgia,serif;font-weight:400}
.sam-line .av,.dana-line .av{border-color:var(--camel)}
.rounds-studio .round-why::before{content:"Sam's note";background:var(--oxblood)}`
);

// Topbar → chrome rail
css = css.replace(
  /\.topbar\{height:60px[\s\S]*?margin-bottom:24px\}/,
  `.topbar{height:56px;display:flex;align-items:center;gap:14px;padding:0 22px;border-bottom:1px solid rgba(197,203,208,.22);position:relative;z-index:1;
  background:linear-gradient(180deg,rgba(197,203,208,.14),transparent 70%),rgba(14,16,18,.92);
  backdrop-filter:blur(10px);box-shadow:0 8px 24px rgba(0,0,0,.35);margin-bottom:24px}`
);
css = css.replace(/\.topbar::before,\.topbar::after\{[\s\S]*?\.topbar::after\{right:8px\}/, '');

css = css.replace(
  new RegExp('\\.header-card\\{[\\s\\S]*?transform:rotate\\(-\\.4deg\\)\\}'),
  `.header-card{position:relative;display:flex;align-items:baseline;gap:9px;background:transparent;border:none;padding:0;box-shadow:none;transform:none}`
);
css = css.replace(/\.header-card::before\{[\s\S]*?box-shadow:0 1px 2px rgba\(0,0,0,\.5\)\}/, '');
css = css.replace(
  /\.header-card \.to-label\{[\s\S]*?text-transform:uppercase\}/,
  `.header-card .to-label{font-family:'Oswald',sans-serif;font-size:.62rem;letter-spacing:.16em;color:var(--camel);text-transform:uppercase}`
);
css = css.replace(
  /\.header-card \.mark\{[\s\S]*?white-space:nowrap\}/,
  `.header-card .mark{font-family:'Oswald',sans-serif;letter-spacing:.08em;color:#F3EEE3;font-size:.9rem;white-space:nowrap}`
);
css = css.replace(
  /\.score-chip\{[\s\S]*?white-space:nowrap\}/,
  `.score-chip{margin-left:auto;font-family:'Oswald',sans-serif;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-size:.72rem;
  background:linear-gradient(180deg,#C6A46A,#8E7344);color:#1A1208;padding:6px 12px;border:1px solid #5A4420;white-space:nowrap}`
);
css = css.replace(
  /\.topbar \.back-link\{[\s\S]*?transition:background \.15s,color \.15s\}/,
  `.topbar .back-link{margin-left:14px;font-family:'Oswald',sans-serif;font-weight:600;letter-spacing:.1em;
  font-size:.68rem;color:rgba(232,226,214,.72);text-decoration:none;white-space:nowrap;text-transform:uppercase;
  background:transparent;border:1px solid rgba(197,203,208,.28);border-radius:0;padding:8px 12px;
  transition:border-color .15s,color .15s}`
);
css = css.replace(
  /\.topbar \.back-link:hover\{[\s\S]*?\}/,
  `.topbar .back-link:hover{color:var(--camel);border-color:var(--camel)}`
);

// Sidenav dark chrome
css = css.replace(
  /\.sidenav\{position:sticky[\s\S]*?border-left:10px solid #5a3a18\}/,
  `.sidenav{position:sticky;top:72px;max-height:calc(100vh - 96px);overflow-y:auto;isolation:isolate;
  background:linear-gradient(180deg,#1A2433,#171A1E);border:1px solid rgba(197,203,208,.22);border-radius:0;
  box-shadow:0 16px 40px rgba(0,0,0,.45);border-left:4px solid var(--oxblood)}`
);
css = css.replace(
  /\.sn-head\{font-family:'Oswald'[\s\S]*?border-bottom:2px solid var\(--gold-dark\)\}/,
  `.sn-head{font-family:'Oswald',sans-serif;font-weight:600;letter-spacing:.12em;text-transform:uppercase;
  font-size:.7rem;color:var(--camel);background:rgba(14,16,18,.65);
  padding:12px 15px 10px;position:sticky;top:0;z-index:2;border-bottom:1px solid rgba(197,203,208,.22)}`
);
css = css.replace(
  /\.sn-head::after\{[\s\S]*?font-weight:400\}/,
  `.sn-head::after{content:"Floor stations · 1978";display:block;margin-top:4px;
  font-family:'Libre Baskerville',Georgia,serif;font-size:.58rem;letter-spacing:.04em;color:rgba(198,164,106,.65);
  text-transform:none;font-style:italic;font-weight:400}`
);
css = css.replace(
  /\.sn-practice-note\{[\s\S]*?border-bottom:1px dashed var\(--gray-line\)\}/,
  `.sn-practice-note{font-size:.72rem;line-height:1.4;color:rgba(232,226,214,.65);background:rgba(14,16,18,.4);
  padding:9px 15px;margin:0;border-bottom:1px solid rgba(197,203,208,.12)}`
);
css = css.replace(
  /\.sn-btn:hover\{background:rgba\(43,33,26,\.09\)\}/,
  `.sn-btn:hover{background:rgba(198,164,106,.1)}`
);
css = css.replace(
  /\.sn-n\{[\s\S]*?background:linear-gradient\(168deg,#3C8480,var\(--teal\) 55%,var\(--teal-dark\)\)\}/,
  `.sn-n{width:34px;height:26px;border-radius:2px;display:grid;place-items:center;color:#F3EEE3;
  font-family:'Oswald',sans-serif;font-weight:600;font-size:.76rem;
  background:linear-gradient(168deg,#7A2E2E,var(--oxblood-deep))}`
);
css = css.replace(
  /\.sn-sec\.done \.sn-n\{[\s\S]*?\}/,
  `.sn-sec.done .sn-n{background:linear-gradient(168deg,#C6A46A,#8E7344);color:#1A1208}`
);
css = css.replace(
  /\.sn-t\{[\s\S]*?line-height:1\.2\}/,
  `.sn-t{font-family:'Oswald',sans-serif;font-weight:600;letter-spacing:.02em;font-size:.86rem;
  color:#F3EEE3;line-height:1.2}`
);
css = css.replace(
  /\.sn-meta\{[\s\S]*?white-space:nowrap\}/,
  `.sn-meta{font-family:'Oswald',sans-serif;font-weight:600;font-size:.68rem;color:rgba(232,226,214,.5);white-space:nowrap}`
);
css = css.replace(
  /\.sn-sec\.open \.sn-btn\{background:rgba\(201,84,31,\.10\)\}/,
  `.sn-sec.open .sn-btn{background:rgba(122,46,46,.22)}`
);
css = css.replace(
  /\.sn-sec\.here \.sn-btn\{[\s\S]*?\}/,
  `.sn-sec.here .sn-btn{background:rgba(122,46,46,.3);box-shadow:inset 3px 0 0 var(--camel)}`
);
css = css.replace(
  /\.sn-screen\{[\s\S]*?transition:color \.12s,background \.12s\}/,
  `.sn-screen{width:100%;display:flex;align-items:flex-start;gap:8px;background:transparent;border:none;
  border-left:2px solid rgba(197,203,208,.18);border-radius:0;padding:6px 8px 6px 11px;cursor:pointer;text-align:left;
  font-size:.8rem;line-height:1.35;color:rgba(232,226,214,.55);font-family:inherit;transition:color .12s,background .12s}`
);
css = css.replace(
  /\.sn-screen:hover\{[\s\S]*?\}/,
  `.sn-screen:hover{background:rgba(198,164,106,.08);color:#F3EEE3}`
);
css = css.replace(
  /\.sn-screen\.seen\{color:var\(--ink-2\)\}/,
  `.sn-screen.seen{color:rgba(232,226,214,.85)}`
);
css = css.replace(
  /\.sn-screen\[aria-current="true"\]\{[\s\S]*?\}/,
  `.sn-screen[aria-current="true"]{color:var(--camel);font-weight:700;border-left-color:var(--camel);
  background:rgba(198,164,106,.1)}`
);

// Chapter meter on dark rail
css = css.replace(
  /\.cm-count\{[\s\S]*?white-space:nowrap\}/,
  `.cm-count{font-family:'Oswald',sans-serif;font-size:.78rem;letter-spacing:.12em;color:rgba(243,238,227,.75);white-space:nowrap}`
);
css = css.replace(
  /\.nav-where\{[\s\S]*?padding:0 10px\}/,
  `.nav-where{flex:1;text-align:center;font-family:'Oswald',sans-serif;font-size:.72rem;letter-spacing:.08em;
  color:rgba(232,226,214,.55);padding:0 10px;text-transform:uppercase}`
);

// Lede on dark
css = css.replace(
  /\.lede-card\{[\s\S]*?box-shadow:0 10px 24px rgba\(43,33,26,\.28\)\}/,
  `.lede-card{position:relative;background:linear-gradient(180deg,#EDE6D6,#E4DCC8);border-radius:4px;padding:26px 30px 24px;margin-bottom:20px;
  box-shadow:0 16px 40px rgba(0,0,0,.45);border:1px solid rgba(198,164,106,.35)}`
);

// Aliases for Sam (reuse Dana layout)
css += `
/* ---------- Sam aliases (Dana layout) ---------- */
.sam-line{display:flex;gap:18px;align-items:flex-start}
.sam-line .av{flex:0 0 auto;width:58px;height:58px;border-radius:50%;overflow:hidden;border:2px solid var(--camel);
  box-shadow:0 3px 9px rgba(0,0,0,.42);background:var(--navy)}
.sam-line .av img{width:100%;height:100%;object-fit:cover;display:block}
.sam-line p{font-family:'Libre Baskerville',Georgia,serif;font-size:.92rem;line-height:1.65;color:var(--ink-2);font-style:italic}
.sam-row{display:flex;gap:14px;align-items:flex-start;margin:0 0 14px}
.sam-frame{flex:0 0 auto;width:52px;height:52px;border-radius:50%;overflow:hidden;border:2px solid var(--camel);
  box-shadow:0 3px 8px rgba(0,0,0,.35);background:var(--navy)}
.sam-frame img{width:100%;height:100%;object-fit:cover;display:block}
.sam-quip{flex:1;background:var(--paper);border:1px solid rgba(42,34,24,.18);border-left:4px solid var(--oxblood);
  padding:12px 14px;box-shadow:0 6px 16px rgba(0,0,0,.22)}
.sam-quip p{margin:0;font-size:.92rem;line-height:1.5;color:var(--ink)}
.sam-quip b{color:var(--oxblood-deep)}
.gen-table{width:100%;border-collapse:collapse;margin:10px 0 14px;font-size:.88rem}
.gen-table th,.gen-table td{border:1px solid rgba(42,34,24,.18);padding:10px 12px;text-align:left;vertical-align:top}
.gen-table th{background:var(--navy);color:#F3EEE3;font-family:'Oswald',sans-serif;font-weight:600;letter-spacing:.06em;text-transform:uppercase;font-size:.72rem}
.gen-table tr:nth-child(even) td{background:rgba(198,164,106,.08)}
.cascade{width:100%;border-collapse:collapse;margin:10px 0 14px;font-size:.86rem}
.cascade th,.cascade td{border:1px solid rgba(42,34,24,.18);padding:10px 12px;text-align:left;vertical-align:top}
.cascade th{background:var(--oxblood);color:#F3EEE3;font-family:'Oswald',sans-serif;letter-spacing:.06em;text-transform:uppercase;font-size:.7rem}
.toc-btn{font-family:'Oswald',sans-serif;font-weight:600;letter-spacing:.1em;text-transform:uppercase;font-size:.68rem;
  color:rgba(232,226,214,.8);background:transparent;border:1px solid rgba(197,203,208,.28);padding:8px 12px;display:inline-flex;gap:8px;align-items:center}
.toc-btn:hover{border-color:var(--camel);color:var(--camel)}
.navbar{background:rgba(14,16,18,.92);border-top:1px solid rgba(197,203,208,.22);backdrop-filter:blur(10px)}
`;

// ---- JS extraction ----
function sliceBetween(srcText, startMark, endMark) {
  const a = srcText.indexOf(startMark);
  if (a < 0) throw new Error('missing start ' + startMark);
  const b = endMark ? srcText.indexOf(endMark, a + startMark.length) : srcText.length;
  if (endMark && b < 0) throw new Error('missing end ' + endMark);
  return srcText.slice(a, endMark ? b : undefined);
}

const engineCore = sliceBetween(
  scriptRaw,
  '/* =====================================================================\n   REPLAY ENGINE',
  '/* ---------- 3.8 dispatch roster ---------- */'
);

// After choice binder we hit dispatch — engineCore includes stamp+choice ending before dispatch.
// But multi-round comes AFTER dispatch in source. So rebuild carefully.

const replayIife = sliceBetween(
  scriptRaw,
  '/* =====================================================================\n   REPLAY ENGINE',
  '/* ---------- stamp decision ---------- */'
);

const stampBinder = sliceBetween(
  scriptRaw,
  '/* ---------- stamp decision ---------- */',
  '/* ---------- single choice ---------- */'
);

const choiceBinder = sliceBetween(
  scriptRaw,
  '/* ---------- single choice ---------- */',
  '/* ---------- 3.8 dispatch roster ---------- */'
);

const roundsBinder = sliceBetween(
  scriptRaw,
  '/* ---------- multi-round quizzes ---------- */',
  '/* ---------- 2.5 six weeks at the helm ---------- */'
);

const orderBinder = sliceBetween(
  scriptRaw,
  '/* ---------- 2.5 image-or-equity ladder ---------- */',
  '/* ---------- 3.6.1 photoreal pinboard ---------- */'
);

const flipsetBinder = sliceBetween(
  scriptRaw,
  '/* ---------- Michelin claim cards ---------- */',
  '/* ---------- 3.5.1 rebuy room doors ---------- */'
);

let stampDesk = sliceBetween(
  scriptRaw,
  '/* ---------- stamp desk (hotline',
  '/* ---------- Ridgeway cast table'
);
stampDesk = stampDesk
  .replace(/\[data-activity="rebuy-stamp"\]/g, '[data-activity="stamp-desk"]')
  .replace('/* ---------- stamp desk (hotline + search / attitude / passport / dispatch) ---------- */',
           '/* ---------- stamp desk (generic multi-item stamp) ---------- */');

let sorterBinder = sliceBetween(
  scriptRaw,
  '/* ---------- light table sorter ---------- */',
  '/* ---------- filing desk ---------- */'
);
// Make done message configurable
sorterBinder = sorterBinder.replace(
  `'The test never changes: can a customer see it, hold it, or walk into it? Everything else is what the company is, ' +
        'which the customer only ever meets second hand.'`,
  `(wrap.getAttribute('data-done-msg') || 'Sorting complete. Read the why notes — that is the learning.')`
);

const hotspotBinder = sliceBetween(
  scriptRaw,
  '/* ---------- hotspot scene ---------- */',
  '/* ---------- newspaper clippings ---------- */'
);

const clipBinder = sliceBetween(
  scriptRaw,
  '/* ---------- newspaper clippings ---------- */',
  '/* ---------- inline video ---------- */'
);

const videoBinder = sliceBetween(
  scriptRaw,
  '/* ---------- inline video ---------- */',
  '/* ---------- 2.3 one-second test ---------- */'
);

let js =
  replayIife +
  stampBinder +
  choiceBinder +
  roundsBinder +
  orderBinder +
  flipsetBinder +
  stampDesk +
  sorterBinder +
  hotspotBinder +
  clipBinder +
  videoBinder +
  '\nReplay.start();\n';

// Week 3 → Week 4 wiring inside engine
js = js
  .replace(/var SCOPE  = 'ch3-replay';/, "var SCOPE  = 'ch4-replay';")
  .replace(/__saveReplayPositionWeek3/g, '__saveReplayPositionWeek4')
  .replace(/Week 3 files/g, 'Week 4 files')
  .replace(/← Week 3 files/g, '← Week 4 files')
  .replace(/\\u2190 Week 3 files/g, '\\u2190 Week 4 files');

fs.mkdirSync('D:/sterling-vale/week4/_parts', { recursive: true });
fs.writeFileSync('D:/sterling-vale/week4/_parts/engine.css', css);
fs.writeFileSync('D:/sterling-vale/week4/_parts/engine.js', js);
console.log('CSS bytes', css.length, 'JS bytes', js.length);
console.log('SCOPE ok', js.includes("ch4-replay"));
console.log('stamp-desk ok', js.includes('stamp-desk'));
console.log('no rebuy-stamp activity', !js.includes('rebuy-stamp'));
console.log('no cast-table', !js.includes('cast-table'));
console.log('no Ridgeway in js', !js.includes('Ridgeway'));
