// Check the points in data/sites-checked.json against the connected fill (SOURCE_NOTES C14, C15, F16).
//   node tools/site-check.mjs
// For each site: ground range and median (ft NAVD88) over the cells within 30 m of the point (or the
// bounding box); the lowest scenario level at which at least 25% of that ground is under Bay water,
// and at which it can fill through the drains with every outfall open (model rules, js/analyze.js);
// and the share under the rain pool in the rain experiment: 10-year 6-hour storm, 10% of the runoff
// held back, tide gates on every outfall, Bay at 7.4 ft NAVD88 (js/rain.js).
import fs from 'fs';
import { load, planFrom } from './report.mjs';
import { analyze } from '../js/analyze.js';
import { toUTM } from './utm.mjs';

const LEVELS = [7.4, 9.73, 11.03, 12, 12.83, 13.4, 14.53, 16.23]; // ft NAVD88 (data/scenarios.json)
const D = load(), dem = D.dem, W = dem.width;
const cellOf = (lat, lon) => { const [x, y] = toUTM(lon, lat); return [Math.floor((x - dem.xmin) / dem.resolution), Math.floor((dem.ymax - y) / dem.resolution)]; };
function cells(s) {
  const out = [];
  if (s.bbox) {
    const [c0, r1] = cellOf(s.bbox[0], s.bbox[1]), [c1, r0] = cellOf(s.bbox[2], s.bbox[3]);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push(r * W + c);
  } else {
    const [c, r] = cellOf(s.lat, s.lon);
    for (let dr = -7; dr <= 7; dr++) for (let dc = -7; dc <= 7; dc++) if (dr * dr + dc * dc <= 56) out.push((r + dr) * W + c + dc); // within about 30 m
  }
  return out;
}
const runs = LEVELS.map(l => [l, analyze(D, l)]);
const rain = analyze(D, 7.4, planFrom(D, 'gates'), { ari: '10', duration: '6-hr', blocked: 0.1 });
for (const s of JSON.parse(fs.readFileSync('data/sites-checked.json')).sites) {
  const cs = cells(s), z = cs.map(i => D.z[i] / 30.48).sort((a, b) => a - b);
  const pct = (st, f) => Math.round(cs.filter(i => f(st[i])).length / cs.length * 100);
  const first = (f) => { const k = runs.find(([, a]) => pct(a.state, f) >= 25); return k ? k[0] : 'none'; };
  console.log(`${s.notes} ${s.name}: ground ${z[0].toFixed(1)}-${z.at(-1).toFixed(1)}, median ${z[z.length >> 1].toFixed(1)} ft NAVD88; Bay from ${first(v => v === 1 || v === 3)}; drains from ${first(v => v === 4)}; rain pool ${pct(rain.state, v => v === 5)}%`);
}
