// Where the USGS CoSMoS flood extent (data/hazard/cosmos.json, SOURCE_NOTES H1) and the explorer's
// connected fill disagree, at each scenario's best-matching still water level.
//   node tools/cosmos-report.mjs [scenario id ...]     e.g. slr100_w100 slr150_w100
//   node tools/cosmos-report.mjs --dir DIR [id ...]    scenarios built with tools/build-cosmos.mjs --all --out DIR
// Prints, on Berkeley land (not open Bay): named places (share of each under water in CoSMoS and in
// the fill), the largest patches where only one of the two floods, and the ART level (H5) whose
// extent agrees best with the CoSMoS extent.
import fs from 'fs';
import { connectedFill, openWater, WET } from '../js/fill.js';
import { toUTM, fromUTM } from './utm.mjs';

const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const zb = fs.readFileSync('data/terrain/dem.i16'), z = new Int16Array(zb.buffer, zb.byteOffset, zb.length / 2);
const W = dem.width, H = dem.height, R = dem.resolution, N = W * H, Hm = dem.ymax - dem.ymin;
const berkeley = new Uint8Array(fs.readFileSync('data/terrain/berkeley.bits'));
const inB = (i) => (berkeley[i >> 3] >> (i & 7)) & 1;
const water0 = openWater(z, W, H);
const land = (i) => inB(i) && !water0[i];
const bit = (m, i) => (m[i >> 3] >> (i & 7)) & 1;
const argv = process.argv.slice(2), DIR = argv.includes('--dir') ? argv.splice(argv.indexOf('--dir'), 2)[1] : 'data/hazard';
const cosmos = JSON.parse(fs.readFileSync(`${DIR}/cosmos.json`));
const art = fs.existsSync('data/hazard/art.json') ? JSON.parse(fs.readFileSync('data/hazard/art.json')) : null;
const streets = JSON.parse(fs.readFileSync('data/streets.json')).edges;
const fac = JSON.parse(fs.readFileSync('data/facilities.json')).facilities, facCells = JSON.parse(fs.readFileSync('data/facility-cells.json'));

const cellAt = ([x, y]) => { const c = Math.floor(x / R), r = Math.floor((Hm - y) / R); return c >= 0 && r >= 0 && c < W && r < H ? r * W + c : -1; };
const streetCells = (names) => { const s = new Set(); for (const e of streets) if (names.split('|').includes(e.name) && e.berkeley) for (let k = 1; k < e.geom.length; k++) {
  const [x0, y0] = e.geom[k - 1], [x1, y1] = e.geom[k], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
  for (let t = 0; t <= n; t++) { const i = cellAt([x0 + (x1 - x0) * t / n, y0 + (y1 - y0) * t / n]); if (i >= 0) s.add(i); } } return [...s]; };
// The I-80 crossing named in SOURCE_NOTES C6, cells within 60 m of 37.8812 N, 122.3073 W.
const [cx, cy] = toUTM(-122.3073, 37.8812), crossing = [];
for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) { const x = dem.xmin + (c + 0.5) * R, y = dem.ymax - (r + 0.5) * R; if (Math.hypot(x - cx, y - cy) <= 60) crossing.push(r * W + c); }
const places = [
  ...fac.map((f, k) => [f.label.split(' (')[0], facCells[k].cells]),
  ...[['Marina Blvd', 'MARINA BL'], ['Second St', '2ND ST'], ['Bolivar Dr', 'BOLIVAR DR'], ['Eastshore Hwy (frontage road)', 'EASTSHORE HWY|EASTSHORE HW'], ['University Ave', 'UNIVERSITY AV'], ['Spinnaker Way', 'SPINNAKER WY']].map(([l, n]) => [l, streetCells(n)]),
  ['I-80 corridor at 37.8812 N, 122.3073 W (60 m radius; C6)', crossing],
];

const ids = argv;
for (const sc of cosmos.scenarios.filter(s => !ids.length || ids.includes(s.id))) {
  const m = new Uint8Array(fs.readFileSync(`${DIR}/${sc.file}`));
  const lv = sc.bestMatch.levelFt, f = connectedFill(z, W, H, lv);
  console.log(`\n${sc.id} (${sc.label}): CoSMoS ${sc.cosmosHa} ha of Berkeley land; fill at ${lv.toFixed(2)} ft NAVD88 still water ${sc.bestMatch.oursHa} ha; agreement ${(100 * sc.bestMatch.agreement).toFixed(0)}%; CoSMoS water surface off Berkeley ${sc.waterSurface ? sc.waterSurface.medianFt.toFixed(2) + ' ft NAVD88 (median)' : 'not published for this storm'}`);
  for (const [label, cells] of places) {
    if (!cells.length) continue;
    const a = cells.filter(i => bit(m, i)).length / cells.length, o = cells.filter(i => f[i] === WET).length / cells.length;
    const zs = cells.map(i => z[i] / 30.48).sort((p, q) => p - q);
    console.log(`  ${label}: CoSMoS ${(100 * a).toFixed(0)}%, fill ${(100 * o).toFixed(0)}% (lowest ground ${zs[0].toFixed(1)} ft NAVD88)`);
  }
  // Patches where only one floods (4-connected, Berkeley land), largest first.
  const seen = new Uint8Array(N), q = new Int32Array(N), patches = [];
  for (let s = 0; s < N; s++) {
    if (seen[s] || !land(s)) continue;
    const kind = (i) => land(i) ? (bit(m, i) && f[i] !== WET ? 1 : !bit(m, i) && f[i] === WET ? 2 : 0) : 0, k0 = kind(s);
    if (!k0) continue;
    let h = 0, t = 0, sx = 0, sy = 0; const zs = []; q[t++] = s; seen[s] = 1;
    while (h < t) {
      const i = q[h++], r = (i / W) | 0, c = i - r * W; sx += c; sy += r; zs.push(z[i]);
      for (const j of [c > 0 ? i - 1 : -1, c < W - 1 ? i + 1 : -1, r > 0 ? i - W : -1, r < H - 1 ? i + W : -1]) if (j >= 0 && !seen[j] && kind(j) === k0) { seen[j] = 1; q[t++] = j; }
    }
    zs.sort((p, r) => p - r);
    const [lon, lat] = fromUTM(dem.xmin + (sx / t + 0.5) * R, dem.ymax - (sy / t + 0.5) * R);
    patches.push({ who: k0 === 1 ? 'CoSMoS only' : 'fill only', ha: t * R * R / 1e4, lat, lon, ground: zs[zs.length >> 1] / 30.48 });
  }
  for (const p of patches.sort((a, b) => b.ha - a.ha).slice(0, 6)) console.log(`  ${p.who}: ${p.ha.toFixed(1)} ha around ${p.lat.toFixed(4)} N, ${(-p.lon).toFixed(4)} W, median ground ${p.ground.toFixed(1)} ft NAVD88`);
  if (art) {
    let best = null;
    for (const l of art.levels) {
      const am = new Uint8Array(fs.readFileSync(`data/hazard/${l.file}`)); let b = 0, e = 0;
      for (let i = 0; i < N; i++) { if (!land(i)) continue; const A = bit(am, i), C = bit(m, i); if (A || C) e++; if (A && C) b++; }
      const ag = e ? b / e : 1; if (!best || ag > best.ag) best = { l, ag };
    }
    console.log(`  closest ART map: MHHW + ${best.l.inches} in (about ${best.l.levelFt.toFixed(1)} ft NAVD88), agreement ${(100 * best.ag).toFixed(0)}%`);
  }
}
