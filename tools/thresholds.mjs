// The lowest water level at which each place is first reached, for guided mode.
//   node tools/thresholds.mjs        writes data/thresholds.json and data/hazard/first-*.u8
//
// The explorer answers "pick a level, see what is wet". Guided mode asks the reverse: "at which
// level does the water first reach this site, road or block?". The connected fill only adds ground
// as the level rises (tests/check.mjs, check 2), so the answer is found by running js/analyze.js,
// with no plan and no rain, at every level from 6.00 to 16.50 ft NAVD88 in 0.05 ft steps and
// keeping the first level at which each place is reached. Every threshold is derived: it is the
// same model rule, read the other way, and it is reproducible by running the explorer at that level.
//
// Places:
//   sites    the "What's exposed" sites (data/exposure.json): first level with any water on the
//            ground ("touched") and first level counted in the summary (25% or more, js/exposure.js).
//            Bay water over the ground only, and Bay water over the ground or up the drains.
//   roads    named groups: I-80 mainline, each interchange's ramps, the Marina access roads, the
//            frontage roads; each Berkeley street by name. First level at which any segment of the
//            group has 25% or more of its length flooded (js/analyze.js STREET_WET_SHARE).
// Rasters, one byte per terrain cell, value = index into `levels` (255 = not reached by 16.50):
//   data/hazard/first-bay.u8     first level at which the cell is under Bay water (connected fill)
//   data/hazard/first-drain.u8   first level at which it is under Bay water or can fill through drains
import fs from 'fs';
import { load } from './report.mjs';
import { analyze } from '../js/analyze.js';
import { exposure } from '../js/exposure.js';

const STEP = 0.05, LO = 6.0, HI = 16.5;
const levels = []; for (let k = 0; LO + k * STEP <= HI + 1e-9; k++) levels.push(Math.round((LO + k * STEP) * 100) / 100);

const D = load();
D.exposure = JSON.parse(fs.readFileSync('data/exposure.json'));
D.siteCells = JSON.parse(fs.readFileSync('data/site-cells.json'));
D.tsunami = { mask: new Uint8Array(fs.readFileSync('data/hazard/tsunami.bits')) };
const X = D.exposure;

const groups = {
  'I-80 mainline': (e) => e.freeway && /^(I80 [EW]B|JOHN T\. KNOX FREEWAY)$/.test(e.name),
  'Gilman St ramps': (e) => e.freeway && /^GILMAN /.test(e.name),
  'University Ave ramps': (e) => e.freeway && /^UNIVERSITY /.test(e.name),
  'Ashby Ave ramps': (e) => e.freeway && /^ASHBY /.test(e.name),
  'Frontage road ramps': (e) => e.freeway && /^(FRONTAGE|EASTSHORE) /.test(e.name),
  'Frontage roads (Eastshore Hwy)': (e) => e.berkeley && X.frontageRoads.includes(e.name),
  'Marina access roads': (e) => e.berkeley && X.marinaRoutes.includes(e.name)
    && !(e.name === 'UNIVERSITY AV' && !e.geom.every(([x]) => x <= X.marinaMaxX)),
};

const N = D.dem.width * D.dem.height;
const firstBay = new Uint8Array(N).fill(255), firstDrain = new Uint8Array(N).fill(255);
const sites = {}, roads = {}, streets = {};
const set = (o, k, f, k2) => { o[k] ??= {}; if (o[k][f] == null) o[k][f] = levels[k2]; };

levels.forEach((lv, k) => {
  const r = analyze(D, lv);
  for (let i = 0; i < N; i++) {
    const v = r.state[i];
    if ((v === 1 || v === 3) && firstBay[i] === 255) firstBay[i] = k;
    if ((v === 1 || v === 3 || v === 4) && firstDrain[i] === 255) firstDrain[i] = k;
  }
  for (const s of exposure(D, r).sites) {
    const id = s.site.id; sites[id] ??= { name: s.site.name || s.site.facility };
    if (s.site.stillWaterNotApplicable) { sites[id].stillWaterNotApplicable = true; continue; }
    if (s.sh.wet > 0) set(sites, id, 'bayTouchFt', k);
    if (s.sh.wet >= 0.25) set(sites, id, 'bayCountedFt', k);
    if (s.sh.wet + s.sh.drain > 0) set(sites, id, 'drainTouchFt', k);
    if (s.sh.wet + s.sh.drain >= 0.25) set(sites, id, 'drainCountedFt', k);
  }
  for (const s of r.segs) {
    const bay = s.cls === 'wet', drain = s.cls === 'wet' || s.cls === 'drain';
    for (const [g, f] of Object.entries(groups)) if (f(s.e)) {
      if (bay) set(roads, g, 'bayFt', k); if (drain) set(roads, g, 'drainFt', k);
      if (bay || drain) { roads[g].first ??= s.e.name; }
    }
    if (s.e.berkeley && !s.e.freeway) { if (bay) set(streets, s.e.name, 'bayFt', k); if (drain) set(streets, s.e.name, 'drainFt', k); }
  }
  if (k % 20 === 0) process.stderr.write(`${lv} `);
});
process.stderr.write('\n');

const out = {
  note: 'Derived (tools/thresholds.mjs): the lowest level, ft NAVD88 still water, at which the explorer\'s connected fill (model rule) first reaches each place, with no plan and no rain, swept from 6.00 to 16.50 in 0.05 ft steps. "bay" = Bay water over the ground; "drain" = Bay water over the ground or up the storm drains with every outfall open (docs/design/levers-and-drains.md). Sites: "touch" = any of its ground, "counted" = 25% or more (js/exposure.js). Roads and streets: any segment with 25% or more of its length flooded (js/analyze.js). A place missing a field is not reached by 16.50.',
  step: STEP, levels: [LO, HI],
  sites, roads, streets,
  rasters: { 'first-bay': 'data/hazard/first-bay.u8', 'first-drain': 'data/hazard/first-drain.u8', encoding: `one byte per terrain cell (data/terrain/dem.json grid), value k = level ${LO} + ${STEP} * k ft NAVD88; 255 = not reached by ${HI}` },
};
fs.writeFileSync('data/thresholds.json', JSON.stringify(out, null, 1) + '\n');
fs.writeFileSync('data/hazard/first-bay.u8', firstBay);
fs.writeFileSync('data/hazard/first-drain.u8', firstDrain);
console.log(JSON.stringify({ sites, roads }, null, 1));
