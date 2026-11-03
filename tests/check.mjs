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
const isW = (v) => v === WET || v === FLANKED;
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

// 5. Plans (docs/design/levers-and-drains.md). A plan only raises ground, so it never wets a cell
//    that no plan leaves dry; above every crest it changes nothing; tide gates close every drain link.
{
  const { planFrom } = await import('../tools/report.mjs');
  for (const [spec, lv] of [['walls2050', 10.7], ['walls2100', 13], ['roads', 10.7]]) {
    const plan = planFrom(D, spec), a = analyze(D, lv, null), b = analyze(D, lv, plan);
    let extra = 0; for (let i = 0; i < a.state.length; i++) if (isW(b.state[i]) && !isW(a.state[i])) extra++;
    ok(extra === 0, `${spec} at ${lv} ft wets no cell that no plan leaves dry (${extra})`);
    const hi = analyze(D, 15.5, plan), hi0 = analyze(D, 15.5, null);
    let diff = 0; for (let i = 0; i < hi.state.length; i++) if (isW(hi.state[i]) !== isW(hi0.state[i])) diff++;
    ok(diff === 0, `${spec} above its crest (15.5 ft) changes nothing (${diff} cells differ)`);
  }
  const g = analyze(D, 12, planFrom(D, 'gates'));
  ok(g.drainLandHa === 0, `tide gates on every outfall: no ground fills through drains at 12 ft (${g.drainLandHa.toFixed(1)} ha)`);
  const r = analyze(D, 10.7, planFrom(D, 'roads'));
  ok(!r.streets.some(s => s.berkeley && s.cls === 'wet'), 'Spinnaker Way and University Ave raised to 12.7 ft: no Berkeley street under water at 10.7 ft');
}

// 6. Rain on a high tide (js/rain.js). No runoff held back means no pools; more held back never pools
//    less; pools never sit on ground already under Bay water; the Gilman and Codornices pools reach
//    Second St beside the transfer station, where the Draft EIR documents flooding in a 10-year storm (F8).
{
  const { planFrom } = await import('../tools/report.mjs');
  const gates = planFrom(D, 'gates');
  const none = analyze(D, 7.4, gates, { ari: '10', duration: '6-hr', blocked: 0 });
  ok(none.rainLandHa === 0, `rain with nothing held back: no pools (${none.rainLandHa.toFixed(1)} ha)`);
  let prevHa = 0;
  for (const b of [0.1, 0.25, 0.5, 1]) {
    const r = analyze(D, 7.4, gates, { ari: '10', duration: '6-hr', blocked: b });
    ok(r.rainLandHa >= prevHa - 1e-9, `rain held back ${b}: ${r.rainLandHa.toFixed(1)} ha pooled, not less than with less held back`);
    prevHa = r.rainLandHa;
  }
  const bay = analyze(D, 9.73, gates), wr = analyze(D, 9.73, gates, { ari: '10', duration: '6-hr', blocked: 1 });
  let onBay = 0; for (let i = 0; i < bay.state.length; i++) if (isW(bay.state[i]) && wr.state[i] === 5) onBay++;
  ok(onBay === 0, `rain pools never cover ground already under Bay water (${onBay} cells)`);
  // Runoff is conserved: each pool holds no more than its watershed's runoff (to within the 1 cm
  // the stored surface is rounded down to).
  const rc = analyze(D, 7.4, gates, { ari: '10', duration: '6-hr', blocked: 0.1 });
  for (const p of rc.rain.pools) ok(p.heldM3 <= p.volumeM3 * 1.001 + 1, `${p.watershed} pool holds ${Math.round(p.heldM3)} of ${Math.round(p.volumeM3)} m3 of runoff`);
  // A plan's walls count for rain: a 20 ft wall ringed close around the Schoolhouse pool's first inlet
  // keeps that pool inside it.
  const sp = rc.rain.pools.find(p => p.watershed === 'Schoolhouse');
  const [sx, sy] = sp.seed, ring = [[sx - 40, sy - 40], [sx + 40, sy - 40], [sx + 40, sy + 40], [sx - 40, sy + 40], [sx - 40, sy - 40]];
  const walled = analyze(D, 7.4, { ...gates, walls: [{ label: 'test ring', crestFt: 20, lines: [ring] }] }, { ari: '10', duration: '6-hr', blocked: 0.1 });
  const wp = walled.rain.pools.find(p => p.watershed === 'Schoolhouse');
  ok(wp.areaHa < sp.areaHa && wp.levelFt > sp.levelFt, `a ringed wall confines the Schoolhouse pool (${sp.areaHa.toFixed(1)} -> ${wp.areaHa.toFixed(1)} ha, surface ${sp.levelFt.toFixed(1)} -> ${wp.levelFt.toFixed(1)} ft NAVD88)`);
  const r10 = analyze(D, 7.4, gates, { ari: '10', duration: '6-hr', blocked: 0.1 });
  ok(r10.streets.some(s => s.name === '2ND ST' && s.cls === 'rain'), '10-year 6-hour storm, 10% held back: Second St under pooled rain (Draft EIR F8)');
}

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
