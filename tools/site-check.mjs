// Check the points in data/sites-checked.json against the connected fill (SOURCE_NOTES C14, C15, F16).
//   node tools/site-check.mjs
// For each site: ground range and median (ft NAVD88) over the cells within 30 m of the point (or the
// bounding box); the lowest scenario level at which at least 25% of that ground is under Bay water,
// and at which it can fill through the drains with every outfall open (model rules, js/analyze.js);
// and the share under the rain pool in the rain experiment: 10-year 6-hour storm, 10% of the runoff
// held back, tide gates on every outfall, Bay at 7.4 ft NAVD88 (js/rain.js); and the share inside
// the State's Tsunami Hazard Area (data/hazard/tsunami.bits, SOURCE_NOTES H6).
import fs from 'fs';
import { load, planFrom } from './report.mjs';
import { analyze } from '../js/analyze.js';
import { siteCells } from './site-cells.mjs';

// ft NAVD88: scenario levels from data/scenarios.json, plus 12 and the 2100 Intermediate level 12.83
// (C13), which the page's list leaves out (E5).
const LEVELS = [7.4, 9.73, 11.03, 12, 12.83, 13.4, 14.53, 16.23];
const D = load(), dem = D.dem, W = dem.width;
const cells = (s) => siteCells(dem, s);
const runs = LEVELS.map(l => [l, analyze(D, l)]);
const rain = analyze(D, 7.4, planFrom(D, 'gates'), { ari: '10', duration: '6-hr', blocked: 0.1 });
const tsu = new Uint8Array(fs.readFileSync('data/hazard/tsunami.bits')), inTsu = (i) => (tsu[i >> 3] >> (i & 7)) & 1;
for (const s of JSON.parse(fs.readFileSync('data/sites-checked.json')).sites) {
  const cs = cells(s), z = cs.map(i => D.z[i] / 30.48).sort((a, b) => a - b);
  const pct = (st, f) => Math.round(cs.filter(i => f(st[i])).length / cs.length * 100);
  const first = (f) => { const k = runs.find(([, a]) => pct(a.state, f) >= 25); return k ? k[0] : 'none'; };
  console.log(`${s.notes} ${s.name}: ground ${z[0].toFixed(1)}-${z.at(-1).toFixed(1)}, median ${z[z.length >> 1].toFixed(1)} ft NAVD88; Bay from ${first(v => v === 1 || v === 3)}; drains from ${first(v => v === 4)}; rain pool ${pct(rain.state, v => v === 5)}%; tsunami hazard area ${Math.round(cs.filter(inTsu).length / cs.length * 100)}%`);
}
