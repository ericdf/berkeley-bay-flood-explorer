// Compare USGS CoSMoS-GW groundwater (SOURCE_NOTES H7; tools/build-cosmos-gw.mjs) with the explorer.
//   node tools/compare-cosmos-gw.mjs [--json out.json]
// All results are derived. Three parts:
// 1. Berkeley land in each CoSMoS-GW class at each sea level rise (area as js/analyze.js counts it:
//    inside the Census place, not open Bay, ground at or above mean sea level, 3.31 ft NAVD88; the
//    Aquatic Park lagoon and other ground below mean sea level are reported apart, SOURCE_NOTES C9).
// 2. Named places: the share of each place's cells in each class.
// 3. The explorer's "low, not connected" ground (LOW or DRAIN before the drain rule, as
//    tools/compare-art-dc.mjs) and its Bay water (WET or FLANKED) at a matched still water level.
//    Matching rule (a derived choice, ours): CoSMoS-GW's marine boundary is MHHW plus the rise, so the
//    explorer runs at MHHW 6.20 ft NAVD88 at point 518 (SOURCE_NOTES W11; as tools/build-art.mjs)
//    plus the rise converted to feet. CoSMoS-GW takes MHHW from NOAA VDatum, which may differ from
//    point 518 by a few hundredths of a foot; not checked.
// Groundwater classes are depths from the ground down to the modeled water table, not flood depths.
import fs from 'fs';
import { load } from './report.mjs';
import { analyze } from '../js/analyze.js';
import { MSL_FT } from '../js/fill.js';
import { siteCells } from './site-cells.mjs';

const D = load();
const { dem, z } = D, W = dem.width, H = dem.height, N = W * H, cellHa = dem.resolution ** 2 / 1e4;
const MSL_CM = MSL_FT * 30.48, MHHW = 6.20, FT = 1 / 0.3048;
const bit = (m, i) => (m[i >> 3] >> (i & 7)) & 1;
const inB = (i) => bit(D.berkeley, i);
const gw = JSON.parse(fs.readFileSync('data/hazard/cosmos-gw.json'));
const KEYS = gw.classes.map(c => c.key);

function lineCells(re) {
  const set = new Set();
  for (const e of D.streets.edges) {
    if (!e.berkeley || !re.test(e.name)) continue;
    for (let k = 1; k < e.geom.length; k++) {
      const [x0, y0] = e.geom[k - 1], [x1, y1] = e.geom[k], m = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4));
      for (let t = 0; t <= m; t++) {
        const c = Math.floor((x0 + (x1 - x0) * t / m) / dem.resolution), r = Math.floor((dem.ymax - dem.ymin - (y0 + (y1 - y0) * t / m)) / dem.resolution);
        if (c >= 0 && r >= 0 && c < W && r < H) set.add(r * W + c);
      }
    }
  }
  return [...set];
}
const fac = (label) => D.facilityCells[D.facilities.findIndex(f => f.label.startsWith(label))].cells;
const sites = JSON.parse(fs.readFileSync('data/sites-checked.json')).sites;
const site = (id) => siteCells(dem, sites.find(s => s.id === id));
export const PLACES = [
  ['Transfer station', fac('Transfer station')],
  ['Second St', lineCells(/^2ND ST$/)],
  ['Bolivar Dr', lineCells(/^BOLIVAR DR$/)],
  ['Eastshore Hwy (frontage road)', lineCells(/^EASTSHORE (HW|HWY|BL)$/)],
  ['Pacific Steel Casting, 1333 Second St (30 m)', site('pacific-steel-1333')],
  ['Berkeley Forge & Tool, 1331 Eastshore Hwy (30 m)', site('berkeley-forge')],
  ['Aquatic Park (whole outline)', fac('Aquatic Park')],
  ['DoubleTree hotel grounds', fac('DoubleTree')],
];

export function compare() {
  const out = [];
  for (const s of gw.scenarios) {
    const m = Object.fromEntries(KEYS.map(k => [k, new Uint8Array(fs.readFileSync(`data/hazard/${s.files[k]}`))]));
    const cls = (i) => { for (const k of KEYS) if (bit(m[k], i)) return k; return 'deeper'; };
    const levelFt = Math.round((MHHW + s.slrM * FT) * 100) / 100;
    const r = analyze(D, levelFt);
    const low = (i) => r.state[i] === 2 || r.state[i] === 4, wet = (i) => r.state[i] === 1 || r.state[i] === 3;
    const c = { land: 0, emergent: 0, '0to1m': 0, '1to2m': 0, marine: 0, deeper: 0, low: 0, wet: 0,
      lowBy: { marine: 0, emergent: 0, '0to1m': 0, '1to2m': 0, deeper: 0 }, wetBy: { marine: 0, emergent: 0, '0to1m': 0, '1to2m': 0, deeper: 0 },
      dryBy: { marine: 0, emergent: 0, '0to1m': 0, '1to2m': 0, deeper: 0 }, marineOrWet: 0, lagoon: { cells: 0, marine: 0, emergent: 0 } };
    for (let i = 0; i < N; i++) {
      if (!inB(i) || D.water0[i] || z[i] === -32768) continue;
      const k = cls(i);
      if (z[i] < MSL_CM) { c.lagoon.cells++; if (k === 'marine' || k === 'emergent') c.lagoon[k]++; continue; }
      c.land++; c[k]++;
      if (low(i)) { c.low++; c.lowBy[k]++; } else if (wet(i)) { c.wet++; c.wetBy[k]++; } else c.dryBy[k]++;
      if (k === 'marine' || wet(i)) c.marineOrWet++;
    }
    const places = PLACES.map(([name, cells]) => {
      const n = { cells: 0, marine: 0, emergent: 0, '0to1m': 0, '1to2m': 0, deeper: 0, oursLow: 0, oursWet: 0 };
      for (const i of cells) { if (D.water0[i]) continue; n.cells++; n[cls(i)]++; if (low(i)) n.oursLow++; if (wet(i)) n.oursWet++; }
      return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, k === 'cells' ? v : v / n.cells]));
    });
    const ha = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * cellHa * 10) / 10 : ha(v)]));
    // Agreement of CoSMoS-GW's marine inundation with the explorer's Bay water: both / either.
    const agreeMarine = c.marineOrWet ? c.wetBy.marine / c.marineOrWet : 1;
    out.push({ id: s.id, slrM: s.slrM, levelFt, ha: ha(c), agreeMarine: Math.round(agreeMarine * 1000) / 1000, places });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = compare();
  const f = (x) => x.toFixed(1).padStart(7);
  console.log(`CoSMoS-GW (MHHW, Kh 1.0 m/day, full model) on Berkeley land in the explorer grid, ha (ground at or above ${MSL_FT} ft NAVD88, not open Bay). Groundwater depth below the ground, not a flood depth.`);
  console.log(' rise m | land   marine emergent  0-1 m  within 1 m  1-2 m  deeper | matched still water level (derived)');
  for (const o of out) { const h = o.ha; console.log(`${o.slrM.toFixed(2).padStart(6)}  |${f(h.land)}${f(h.marine)}${f(h.emergent)}${f(h['0to1m'])}${f(h.emergent + h['0to1m']).padStart(10)}  ${f(h['1to2m'])}${f(h.deeper)} | ${o.levelFt.toFixed(2)} ft NAVD88`); }
  console.log('\nBerkeley ground below mean sea level (Aquatic Park lagoon and the rest), ha: cells / CoSMoS-GW marine / emergent');
  for (const o of out) console.log(`${o.slrM.toFixed(2).padStart(6)}: ${f(o.ha.lagoon.cells)} ${f(o.ha.lagoon.marine)} ${f(o.ha.lagoon.emergent)}`);
  console.log('\nExplorer at the matched level against CoSMoS-GW, ha. Low = "low, not connected" (incl. can fill through drains).');
  console.log(' rise m  level ft | ours low: marine emergent 0-1 m 1-2 m deeper | ours Bay water: marine emergent 0-1 m 1-2 m deeper | ours dry: marine emergent | marine vs Bay water, both/either');
  for (const o of out) { const h = o.ha; console.log(`${o.slrM.toFixed(2).padStart(6)}  ${o.levelFt.toFixed(2).padStart(6)}  |${f(h.low)}:${f(h.lowBy.marine)}${f(h.lowBy.emergent)}${f(h.lowBy['0to1m'])}${f(h.lowBy['1to2m'])}${f(h.lowBy.deeper)} |${f(h.wet)}:${f(h.wetBy.marine)}${f(h.wetBy.emergent)}${f(h.wetBy['0to1m'])}${f(h.wetBy['1to2m'])}${f(h.wetBy.deeper)} | ${f(h.dryBy.marine)}${f(h.dryBy.emergent)} | ${(100 * o.agreeMarine).toFixed(0).padStart(4)}%`); }
  console.log('\nNamed places: share of cells marine / emergent / 0-1 m / 1-2 m / deeper than 2 m | explorer low / Bay water at the matched level');
  for (const [k, [name]] of PLACES.entries()) {
    console.log(`${name} (${out[0].places[k].cells} cells)`);
    const p = (v) => `${(100 * v).toFixed(0)}%`.padStart(5);
    for (const o of out) { const q = o.places[k]; console.log(`  ${o.slrM.toFixed(2)} m (${o.levelFt.toFixed(2)} ft NAVD88): ${p(q.marine)}${p(q.emergent)}${p(q['0to1m'])}${p(q['1to2m'])}${p(q.deeper)} | ${p(q.oursLow)}${p(q.oursWet)}`); }
  }
  const ji = process.argv.indexOf('--json');
  if (ji > 0) fs.writeFileSync(process.argv[ji + 1], JSON.stringify(out, null, 1));
}
