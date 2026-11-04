// Compare the explorer's "low, not connected" ground with ART's disconnected low-lying areas.
//   node tools/compare-art-dc.mjs [--json out.json]
// At each ART level (MHHW + N in, taken as MHHW 6.20 ft NAVD88 at point 518 + N/12, as in
// tools/build-art.mjs) the explorer's fill runs at that level with no plan (js/analyze.js, as
// tools/report.mjs runs it). "Low, not connected" is the fill's LOW state before the drain rule
// (LOW or DRAIN: js/analyze.js marks some LOW cells DRAIN, D6); "under water" is WET or FLANKED.
// Area counted: Berkeley land as in js/analyze.js (inside the Census place, not open Bay, ground at
// or above mean sea level, 3.31 ft NAVD88); the Aquatic Park lagoon and other ground below mean sea
// level is reported separately (SOURCE_NOTES C9).
// ART maps disconnected areas larger than one acre only, and joins cells diagonally (eight-side
// rule, ART report §3.5); the explorer keeps every patch and joins cells by edges only (js/fill.js).
// "Ours >= 1 acre" keeps only explorer low patches of at least one acre (253 cells of 16 m², patches
// joined eight ways), a model rule added here to match ART's threshold.
import fs from 'fs';
import { load } from './report.mjs';
import { analyze } from '../js/analyze.js';
import { MSL_FT } from '../js/fill.js';
const D = load();
const { dem, z } = D, W = dem.width, H = dem.height, N = W * H, cellHa = dem.resolution ** 2 / 1e4;
const ACRE_CELLS = Math.ceil(4046.86 / dem.resolution ** 2);
const MSL_CM = MSL_FT * 30.48;
const bit = (m, i) => (m[i >> 3] >> (i & 7)) & 1;
const inB = (i) => bit(D.berkeley, i);
const dc = JSON.parse(fs.readFileSync('data/hazard/art-dc.json'));
const art = JSON.parse(fs.readFileSync('data/hazard/art.json'));
const connected = Object.fromEntries(art.levels.map(l => [l.inches, new Uint8Array(fs.readFileSync(`data/hazard/${l.file}`))]));

// Named places: Berkeley street segments by name (cells along each line every 4 m) and facility outlines.
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
const places = [
  ['Bolivar Dr', lineCells(/^BOLIVAR DR$/)],
  ['Second St', lineCells(/^2ND ST$/)],
  ['Eastshore Hwy (frontage road)', lineCells(/^EASTSHORE (HW|HWY|BL)$/)],
  ['Potter St', lineCells(/^POTTER ST$/)],
  ['I-80 (main lanes, Berkeley)', lineCells(/^I80 [EW]B$/)],
  ['Transfer station', fac('Transfer station')],
  ['Aquatic Park (whole outline)', fac('Aquatic Park')],
];

// Explorer low patches of at least one acre, patches joined eight ways, counted over the whole grid.
function bigPatches(low) {
  const keep = new Uint8Array(N), seen = new Uint8Array(N), q = new Int32Array(N);
  for (let s = 0; s < N; s++) {
    if (!low[s] || seen[s]) continue;
    let h = 0, t = 0; q[t++] = s; seen[s] = 1;
    while (h < t) {
      const i = q[h++], r = (i / W) | 0, c = i - r * W;
      for (let dr = -1; dr <= 1; dr++) for (let dc2 = -1; dc2 <= 1; dc2++) {
        const rr = r + dr, cc = c + dc2; if (rr < 0 || cc < 0 || rr >= H || cc >= W) continue;
        const j = rr * W + cc; if (low[j] && !seen[j]) { seen[j] = 1; q[t++] = j; }
      }
    }
    if (t >= ACRE_CELLS) for (let k = 0; k < t; k++) keep[q[k]] = 1;
  }
  return keep;
}

const out = [];
for (const l of dc.levels) {
  const A = new Uint8Array(fs.readFileSync(`data/hazard/${l.file}`));
  const C = connected[l.inches] || null;
  const r = analyze(D, l.levelFt);
  const low = new Uint8Array(N), wet = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const v = r.state[i]; low[i] = v === 2 || v === 4 ? 1 : 0; wet[i] = v === 1 || v === 3 ? 1 : 0; }
  const big = bigPatches(low);
  const c = { art: 0, ours: 0, both: 0, ours1: 0, both1: 0, artWetOurs: 0, artDryOurs: 0, artConnOursLow: 0, artConnOursLow1: 0, artConn: 0, artConnAndDc: 0, oursLowArtDry: 0, lagoon: { cells: 0, art: 0, ours: 0 } };
  for (let i = 0; i < N; i++) {
    if (!inB(i) || D.water0[i] || z[i] === -32768) continue;
    const a = bit(A, i), cn = C ? bit(C, i) : 0;
    if (z[i] < MSL_CM) { c.lagoon.cells++; if (a) c.lagoon.art++; if (low[i]) c.lagoon.ours++; continue; }
    if (a) c.art++; if (low[i]) c.ours++; if (a && low[i]) c.both++;
    if (big[i]) c.ours1++; if (a && big[i]) c.both1++;
    if (a && wet[i]) c.artWetOurs++;
    if (a && !wet[i] && !low[i]) c.artDryOurs++;
    if (C) { if (cn) c.artConn++; if (cn && low[i]) c.artConnOursLow++; if (cn && big[i]) c.artConnOursLow1++; if (cn && a) c.artConnAndDc++; if (low[i] && !cn && !a) c.oursLowArtDry++; }
  }
  const pl = places.map(([name, cells]) => {
    let n = 0, a = 0, lo = 0, we = 0, cn = 0;
    for (const i of cells) { if (D.water0[i]) continue; n++; if (bit(A, i)) a++; if (low[i]) lo++; if (wet[i]) we++; if (C && bit(C, i)) cn++; }
    return { name, cells: n, artDc: a / n, artConnected: C ? cn / n : null, oursLow: lo / n, oursWet: we / n };
  });
  out.push({ inches: l.inches, levelFt: l.levelFt, connectedLayer: !!C, ha: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, typeof v === 'number' ? v * cellHa : Object.fromEntries(Object.entries(v).map(([k2, v2]) => [k2, v2 * cellHa]))])), places: pl });
}

const f = (x) => x.toFixed(1).padStart(6);
const pct = (b, a, o) => (a + o - b > 0 ? (100 * b / (a + o - b)).toFixed(0) + '%' : '-').padStart(5);
console.log(`Berkeley land, ha (ground at or above ${MSL_FT} ft NAVD88, not open Bay). ART DC = ART disconnected low-lying; ours = explorer low, not connected.`);
console.log('  in  ft NAVD88 | ART DC  ours  both ART-only ours-only agree | ours>=1ac both agree | ART DC & ours wet | ART DC & ours dry | ART conn & ours low (>=1ac) | ours low & ART dry');
for (const o of out) {
  const h = o.ha;
  console.log(`${String(o.inches).padStart(4)}  ${o.levelFt.toFixed(2).padStart(6)}    |${f(h.art)}${f(h.ours)}${f(h.both)}${f(h.art - h.both)}  ${f(h.ours - h.both)}  ${pct(h.both, h.art, h.ours)} |  ${f(h.ours1)}${f(h.both1)} ${pct(h.both1, h.art, h.ours1)} |     ${f(h.artWetOurs)}        |     ${f(h.artDryOurs)}        |   ${o.connectedLayer ? `${f(h.artConnOursLow)} (${f(h.artConnOursLow1).trim()})` : '   no ART layer'}        | ${o.connectedLayer ? f(h.oursLowArtDry) : '   -'}`);
}
console.log('\nAquatic Park lagoon and other Berkeley ground below mean sea level, not open Bay (ha): cells / ART DC / ours low');
for (const o of out) console.log(`${String(o.inches).padStart(4)}: ${f(o.ha.lagoon.cells)} ${f(o.ha.lagoon.art)} ${f(o.ha.lagoon.ours)}`);
console.log('\nNamed places: share of cells ART DC / ART connected / ours low / ours wet');
for (const [k, [name]] of places.entries()) {
  console.log(`${name} (${out[0].places[k].cells} cells)`);
  for (const o of out) { const p = o.places[k]; const s = (v) => (v == null ? '  -' : `${(100 * v).toFixed(0)}%`).padStart(5); console.log(`  +${o.inches} in (${o.levelFt.toFixed(2)} ft NAVD88): ${s(p.artDc)} ${s(p.artConnected)} ${s(p.oursLow)} ${s(p.oursWet)}`); }
}
const ji = process.argv.indexOf('--json');
if (ji > 0) fs.writeFileSync(process.argv[ji + 1], JSON.stringify(out, null, 1));
