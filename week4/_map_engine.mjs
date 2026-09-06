import fs from 'fs';
const html = fs.readFileSync('D:/sterling-vale/week3/replay.html', 'utf8');
const styleStart = html.indexOf('<style>') + 7;
const styleEnd = html.indexOf('</style>');
const scriptMarker = '<script>\n/* =====================================================================\n   REPLAY ENGINE';
const scriptStart = html.indexOf(scriptMarker);
const scriptEnd = html.lastIndexOf('</script>');
console.log('style len', styleEnd - styleStart);
console.log('script start', scriptStart, 'end', scriptEnd, 'len', scriptEnd - scriptStart);
console.log('total', html.length);
const markers = [
  '/* ---------- stamp decision ---------- */',
  '/* ---------- single choice ---------- */',
  '/* ---------- 3.8 dispatch roster ---------- */',
  '/* ---------- multi-round quizzes ---------- */',
  '/* ---------- 2.5 six weeks at the helm ---------- */',
  '/* ---------- 2.5 knowledge check: mark the brief ---------- */',
  '/* ---------- 2.5 image-or-equity ladder ---------- */',
  '/* ---------- 3.6.1 photoreal pinboard ---------- */',
  '/* ---------- 2.6 path-walk ---------- */',
  '/* ---------- 2.6 tray-file: batch Then/Now ---------- */',
  '/* ---------- 2.6 pair-read: flip figures, then conclude ---------- */',
  '/* ---------- Michelin claim cards ---------- */',
  '/* Teach-only flips',
  '/* ---------- 3.5.1 rebuy room doors ---------- */',
  '/* ---------- stamp desk (hotline',
  '/* ---------- Ridgeway cast table',
  '/* ---------- name origin cards ---------- */',
  '/* ---------- light table sorter ---------- */',
  '/* ---------- filing desk ---------- */',
  '/* ---------- hotspot scene ---------- */',
  '/* ---------- newspaper clippings ---------- */',
  '/* ---------- inline video ---------- */',
  '/* ---------- 2.3 one-second test ---------- */',
  'Replay.start();'
];
for (const m of markers) {
  console.log(html.indexOf(m), m.slice(0, 55));
}
