// Checks on the data and the fill.   node tests/check.mjs
// 1. Every scenario names a level and a provenance category, and every SOURCE_NOTES row it cites exists.
// 2. The fill is monotonic: a higher level never leaves a cell dry that a lower level wet.
// 3. City 2019 Marina study (SOURCE_NOTES W7, W8): at 10.7 ft NAVD88 Marina Blvd is mostly under
//    water and part of the DoubleTree grounds are wet.
// 4. Comparison with the published ART map at each ART level, on Berkeley land (reported, not asserted).
import fs from 'fs';
import { load } from '../tools/report.mjs';
import { analyze, FLANKED } from '../js/analyze.js';
import { WET } from '../js/fill.js';

let fail = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`); if (!cond) fail++; };

const notes = fs.readFileSync('SOURCE_NOTES.md', 'utf8');
const rows = new Set([...notes.matchAll(/\*\*([A-Z]\d+)[.*\s]|\| ([A-Z]\d+) \|/g)].map(m => m[1] || m[2]));
const sc = JSON.parse(fs.readFileSync('data/scenarios.json')).scenarios;
for (const s of sc) {
  ok(typeof s.levelFt === 'number' && ['sourced', 'derived', 'inference'].includes(s.category), `${s.id}: level ${s.levelFt} ft NAVD88, ${s.category}`);
  for (const r of (s.source.match(/\b[WMFHEC]\d+\b/g) || [])) ok(rows.has(r), `${s.id}: cites ${r}, which SOURCE_NOTES.md has`);
}

const D = load();
let prev = null;
for (const lv of [6.2, 7.4, 8.47, 9.73, 10.7, 12, 13]) {
  const r = analyze(D, lv);
  if (prev) { let back = 0; for (let i = 0; i < r.state.length; i++) if ((prev[i] === WET || prev[i] === FLANKED) && !(r.state[i] === WET || r.state[i] === FLANKED)) back++; ok(back === 0, `monotonic up to ${lv} ft (${back} cells lost)`); }
  prev = r.state.slice();
}

const r107 = analyze(D, 10.7);
const marina = r107.streets.find(s => s.name === 'MARINA BL' && s.wet);
const marinaAll = D.streets.edges.filter(e => e.name === 'MARINA BL').reduce((t, e) => t + e.len, 0);
ok(marina && marina.m / marinaAll >= 0.5, `10.7 ft: Marina Blvd under water for ${marina ? Math.round(marina.m) : 0} of ${marinaAll} m (City study W8: "most likely" impassable by 2050)`);
const dt = r107.facilities.find(f => /DoubleTree/.test(f.label));
ok(dt.wetShare > 0, `10.7 ft: DoubleTree grounds ${Math.round(100 * dt.wetShare)}% under water (City study W7: two buildings' floors below the water)`);

if (fs.existsSync('data/hazard/art.json')) {
  const art = JSON.parse(fs.readFileSync('data/hazard/art.json'));
  const inB = (i) => (D.berkeley[i >> 3] >> (i & 7)) & 1;
  console.log('\nART comparison on Berkeley land (cells not open Bay): ours = connected fill at the same level');
  console.log('inches  level  ART ha  ours ha  both ha  ART only  ours only  agreement (both / either)');
  for (const l of art.levels) {
    const m = new Uint8Array(fs.readFileSync(`data/hazard/${l.file}`));
    const r = analyze(D, l.levelFt);
    let a = 0, o = 0, b = 0;
    for (let i = 0; i < r.state.length; i++) {
      if (!inB(i) || D.water0[i]) continue;
      const A = (m[i >> 3] >> (i & 7)) & 1, O = r.state[i] === WET || r.state[i] === FLANKED;
      if (A) a++; if (O) o++; if (A && O) b++;
    }
    const ha = (n) => (n * 16 / 1e4).toFixed(1).padStart(7);
    console.log(`${String(l.inches).padStart(6)}  ${l.levelFt.toFixed(2).padStart(5)} ${ha(a)}  ${ha(o)}  ${ha(b)}  ${ha(a - b)}  ${ha(o - b)}    ${(a + o - b ? 100 * b / (a + o - b) : 100).toFixed(0)}%`);
  }
}
console.log(fail ? `\n${fail} check(s) failed` : '\nall checks passed');
process.exit(fail ? 1 : 0);
