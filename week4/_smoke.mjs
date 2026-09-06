import fs from 'fs';
const h = fs.readFileSync('D:/sterling-vale/week4/replay.html', 'utf8');
const m = (s) => (h.match(new RegExp(s, 'g')) || []).length;
console.log({
  bytes: h.length,
  gates: m('data-gate'),
  stampDesk: m('data-activity="stamp-desk"'),
  rounds: m('data-activity="rounds"'),
  flipset: m('data-activity="flipset"'),
  order: m('data-activity="order"'),
  steps: m('class="step'),
  lessons: m('class="lesson'),
});
