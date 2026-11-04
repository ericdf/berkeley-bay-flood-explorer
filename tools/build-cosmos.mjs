// Rasterize the USGS CoSMoS v2.1 San Francisco Bay flood extent clips (SOURCE_NOTES H1; from
// tools/fetch-cosmos.py) onto the terrain grid, and find for each scenario the still water level at
// which the explorer's connected fill best matches it on Berkeley land.
//   node tools/build-cosmos.mjs                      the two storms the page offers: background tide
//                                                    (w000) and 100-year storm (w100), all ten rises
//   node tools/build-cosmos.mjs --all --out DIR      every storm in data/raw/cosmos/clips.json (also
//                                                    annual w001, 20-year w020, king tide wkt), to DIR
// Writes <out>/cosmos-slr<cm>-<storm>.bits (one bit per cell, row-major, 1 = CoSMoS gives a
// flood depth there, any depth) and <out>/cosmos.json; <out> is data/hazard unless --out is given.
// A 4 m cell is flooded when at least two of the four 2 m CoSMoS cells under its quarter points
// carry a depth. CoSMoS cells are NAD83 UTM 10N, the grid UTM 10N (dem.json); the two are taken as
// the same coordinates (difference about 1.5 m, under half a cell: 1.44 m west and 0.28 m north by
// tools/nad83.mjs, which tools/build-art-dc.mjs applies to ART; not applied here, assumption).
import fs from 'fs';
import zlib from 'zlib';
import { connectedFill, openWater, WET } from '../js/fill.js';

const RAW = 'data/raw/cosmos';
const clips = JSON.parse(fs.readFileSync(`${RAW}/clips.json`));
const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const zb = fs.readFileSync('data/terrain/dem.i16'), z = new Int16Array(zb.buffer, zb.byteOffset, zb.length / 2);
const berkeley = new Uint8Array(fs.readFileSync('data/terrain/berkeley.bits'));
const W = dem.width, H = dem.height, R = dem.resolution, N = W * H;
const inB = (i) => (berkeley[i >> 3] >> (i & 7)) & 1;
const water0 = openWater(z, W, H);
const STORM = { w000: 'background tide, no storm', w001: 'annual storm', w020: '20-year storm', w100: '100-year storm', wkt: 'king tide' };
const PAGE_STORMS = ['w000', 'w100']; // the storms the explorer offers (decided 2026-11-04)
const argv = process.argv.slice(2), ALL = argv.includes('--all');
const OUT = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : 'data/hazard';
fs.mkdirSync(OUT, { recursive: true });

// Berkeley land, not open Bay: the cells every comparison counts (as SOURCE_NOTES C1).
const land = []; for (let i = 0; i < N; i++) if (inB(i) && !water0[i]) land.push(i);

// Connected fill at every level from 6.0 to 30.0 ft NAVD88 in 0.05 ft steps, Berkeley land only.
// The range must contain every scenario's best match; a best match at either end is an error.
const FROM = 6, TO = 30, STEP = 0.05, LEVELS = []; for (let k = 0; k <= Math.round((TO - FROM) / STEP); k++) LEVELS.push(Math.round((FROM + k * STEP) * 100) / 100);
const fills = LEVELS.map(lv => { const s = connectedFill(z, W, H, lv); const m = new Uint8Array(land.length); land.forEach((i, k) => { m[k] = s[i] === WET ? 1 : 0; }); return m; });

const out = [];
for (const [key, sc] of Object.entries(clips.scenarios).filter(([, sc]) => ALL || PAGE_STORMS.includes(sc.storm)).sort(([, a], [, b]) => a.slrM - b.slrM || Object.keys(STORM).indexOf(a.storm) - Object.keys(STORM).indexOf(b.storm))) {
  const g = sc.depth, ext = new Uint8Array(zlib.gunzipSync(fs.readFileSync(`${RAW}/${sc.extentFile}`)));
  const at = (x, y) => { const c = Math.floor((x - g.xmin) / g.resolution), r = Math.floor((g.ymax - y) / g.resolution); if (c < 0 || r < 0 || c >= g.width || r >= g.height) return 0; const k = r * g.width + c; return (ext[k >> 3] >> (k & 7)) & 1; };
  const bits = new Uint8Array(Math.ceil(N / 8));
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const x = dem.xmin + (c + 0.5) * R, y = dem.ymax - (r + 0.5) * R;
    let n = 0; for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) n += at(x + dx, y + dy);
    if (n >= 2) { const i = r * W + c; bits[i >> 3] |= 1 << (i & 7); }
  }
  const file = `cosmos-slr${key.slice(3, 6)}-${sc.storm}.bits`;
  fs.writeFileSync(`${OUT}/${file}`, bits);
  // CoSMoS's modeled water surface over the open Bay inside the City limits (sourced values,
  // ft NAVD88): every 20 m wse sample on an open-water cell of the grid inside the Census place.
  let wse = null;
  if (sc.wseFile) {
    const w = sc.wse, v = new Int16Array(zlib.gunzipSync(fs.readFileSync(`${RAW}/${sc.wseFile}`)).buffer.slice(0)), vals = [];
    for (let r = 0; r < w.height; r++) for (let c = 0; c < w.width; c++) {
      const s = v[r * w.width + c]; if (s === -32768) continue;
      const x = w.xmin + (c + 0.5) * w.resolution, y = w.ymax - (r + 0.5) * w.resolution;
      const gc = Math.floor((x - dem.xmin) / R), gr = Math.floor((dem.ymax - y) / R);
      if (gc < 0 || gr < 0 || gc >= W || gr >= H) continue;
      const i = gr * W + gc; if (water0[i] && inB(i)) vals.push(s / 304.8);
    }
    vals.sort((a, b) => a - b);
    const q = (p) => Math.round(vals[Math.min(vals.length - 1, Math.floor(p * vals.length))] * 100) / 100;
    if (vals.length) wse = { medianFt: q(0.5), p5Ft: q(0.05), p95Ft: q(0.95), samples: vals.length };
  }
  // Best-matching still water level: highest agreement (both / either) on Berkeley land.
  const cm = new Uint8Array(land.length); let cosmosHa = 0;
  land.forEach((i, k) => { cm[k] = (bits[i >> 3] >> (i & 7)) & 1; cosmosHa += cm[k]; });
  let best = null;
  fills.forEach((f, k) => {
    let both = 0, either = 0, ours = 0;
    for (let j = 0; j < f.length; j++) { if (f[j] || cm[j]) either++; if (f[j] && cm[j]) both++; ours += f[j]; }
    const agree = either ? both / either : 1;
    if (!best || agree > best.agreement + 1e-12) best = { levelFt: LEVELS[k], agreement: Math.round(agree * 1000) / 1000, oursHa: ours * R * R / 1e4, bothHa: both * R * R / 1e4 };
  });
  const ha = (x) => Math.round(x * 10) / 10;
  out.push({ id: key, slrM: sc.slrM, storm: sc.storm, label: `${sc.slrM} m of sea level rise, ${STORM[sc.storm]}`, file, source: sc.depthSource,
    cosmosHa: ha(cosmosHa * R * R / 1e4), waterSurface: wse,
    ...(best.levelFt === LEVELS[0] || best.levelFt === LEVELS[LEVELS.length - 1] ? (() => { throw new Error(`${key}: best match at the search edge (${best.levelFt} ft NAVD88)`); })() : {}),
    bestMatch: { levelFt: best.levelFt, agreement: best.agreement, oursHa: ha(best.oursHa), cosmosOnlyHa: ha(cosmosHa * R * R / 1e4 - best.bothHa), oursOnlyHa: ha(best.oursHa - best.bothHa) } });
  console.log(`${key}: ${ha(cosmosHa * R * R / 1e4)} ha of Berkeley land; water surface off Berkeley ${wse ? wse.medianFt.toFixed(2) + ' ft NAVD88' : 'n/a'}; best fill match ${best.levelFt} ft NAVD88, agreement ${(100 * best.agreement).toFixed(0)}%`);
}
fs.writeFileSync(`${OUT}/cosmos.json`, JSON.stringify({
  note: 'USGS Coastal Storm Modeling System (CoSMoS) v2.1, San Francisco Bay, Alameda County flood depth rasters (Our Coast, Our Future download, 2 m, NAVD88), rasterized to this grid: a cell is flooded where CoSMoS gives a depth (any depth). CoSMoS models total water levels with tides, storms (in-Bay wind waves and ocean swell), river discharge and sea level rise: not still water (SOURCE_NOTES H1). waterSurface: CoSMoS water surface elevation, ft NAVD88, over the open Bay inside the City limits (sourced values, our summary). bestMatch: the still water level, ft NAVD88, at which the explorer\'s connected fill best matches the CoSMoS extent on Berkeley land (agreement = both / either, 0.05 ft steps from 6.0 to 30.0 ft NAVD88; derived).',
  provenance: { category: 'sourced', retrieved: clips.retrieved, page: clips.page },
  storms: ALL ? 'every storm in the download' : 'background tide (w000) and 100-year storm (w100); node tools/build-cosmos.mjs --all --out DIR builds the annual, 20-year and king tide storms too',
  search: { fromFt: FROM, toFt: TO, stepFt: STEP },
  scenarios: out,
}, null, 1) + '\n');
