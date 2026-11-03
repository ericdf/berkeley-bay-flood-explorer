// Rasterize the USGS CoSMoS-GW depth-to-water-table polygons (SOURCE_NOTES H7; from
// tools/fetch-cosmos-gw.py) onto the terrain grid.
//   node tools/build-cosmos-gw.mjs
// Reads data/raw/cosmos-gw/wtbins_slr<cm>.json.gz. Writes, for each sea level rise, one bit per cell
// (row-major, bit (i & 7) of byte (i >> 3)):
//   data/hazard/cosmos-gw-slr<cm>-marine.bits    fbin_m -1: marine inundation (below MHHW + the rise)
//   data/hazard/cosmos-gw-slr<cm>-emergent.bits  fbin_m 0: water table at or above the ground surface
//   data/hazard/cosmos-gw-slr<cm>-0to1m.bits     fbin_m 1: water table 0-1 m below the ground surface
//   data/hazard/cosmos-gw-slr<cm>-1to2m.bits     fbin_m 2: water table 1-2 m below the ground surface
// and data/hazard/cosmos-gw.json (the scenarios, files and Berkeley land area in each class).
// A cell takes the class of the polygon its center is in (even-odd rule over each polygon's rings, as
// tools/build-art-dc.mjs does). Polygon coordinates are NAD83(NSRS2007) UTM zone 10N; they are used
// as the grid's WGS 84 UTM zone 10N without a datum shift (about 1 to 1.5 m, under half a cell;
// assumption, as tools/build-art-dc.mjs). The classes are depths to groundwater below the ground in
// CoSMoS-GW's own terrain (a 2 m lidar DEM, smoothed by USGS), not flood depths and not water levels.
import fs from 'fs';
import zlib from 'zlib';
import { openWater, MSL_FT } from '../js/fill.js';

const RAW = 'data/raw/cosmos-gw';
const clips = JSON.parse(fs.readFileSync(`${RAW}/clips.json`));
const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const zb = fs.readFileSync('data/terrain/dem.i16'), z = new Int16Array(zb.buffer, zb.byteOffset, zb.length / 2);
const berkeley = new Uint8Array(fs.readFileSync('data/terrain/berkeley.bits'));
const W = dem.width, H = dem.height, R = dem.resolution, N = W * H, Hm = dem.ymax - dem.ymin, cellHa = R * R / 1e4;
const MSL_CM = MSL_FT * 30.48;
const inB = (i) => (berkeley[i >> 3] >> (i & 7)) & 1;
const water0 = openWater(z, W, H);
const GW_CLASSES = [
  { key: 'marine', fbin: -1, label: 'marine inundation (below MHHW plus the rise)' },
  { key: 'emergent', fbin: 0, label: 'emergent: water table at or above the ground surface' },
  { key: '0to1m', fbin: 1, label: 'water table 0-1 m below the ground surface' },
  { key: '1to2m', fbin: 2, label: 'water table 1-2 m below the ground surface' },
];
const ALL = { '-1': 'marine', 0: 'emergent', 1: '0to1m', 2: '1to2m', 5: '2to5m', 6: 'over5m' };
const NONE = 127;

function rasterize(features) {
  const cls = new Int8Array(N).fill(NONE);
  for (const f of features) {
    const rings = f.rings.map(r => r.map(([x, y]) => [x - dem.xmin, y - dem.ymin]));
    let ymin = Infinity, ymax = -Infinity; for (const r of rings) for (const [, y] of r) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
    if (ymax < 0 || ymin > Hm) continue;
    for (let row = Math.max(0, Math.floor((Hm - ymax) / R)); row <= Math.min(H - 1, Math.ceil((Hm - ymin) / R)); row++) {
      const y = Hm - (row + 0.5) * R, xs = [];
      for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [x1, y1] = r[i], [x2, y2] = r[j]; if ((y1 > y) !== (y2 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let c = Math.max(0, Math.ceil(xs[k] / R - 0.5)); c < W && (c + 0.5) * R <= xs[k + 1]; c++) cls[row * W + c] = f.fbin;
    }
  }
  return cls;
}

const out = [];
for (const [key, sc] of Object.entries(clips.scenarios).sort(([, a], [, b]) => a.slrM - b.slrM)) {
  const src = JSON.parse(zlib.gunzipSync(fs.readFileSync(`${RAW}/${sc.file}`)));
  const cls = rasterize(src.features);
  const files = {};
  for (const c of GW_CLASSES) {
    const bits = new Uint8Array(Math.ceil(N / 8));
    for (let i = 0; i < N; i++) if (cls[i] === c.fbin) bits[i >> 3] |= 1 << (i & 7);
    const file = `cosmos-gw-${key}-${c.key}.bits`;
    fs.writeFileSync(`data/hazard/${file}`, bits);
    files[c.key] = file;
  }
  // Berkeley land as js/analyze.js counts it (inside the Census place, not open Bay, ground at or
  // above mean sea level, 3.31 ft NAVD88), and the Berkeley ground below mean sea level apart.
  const land = Object.fromEntries([...Object.values(ALL), 'none'].map(k => [k, 0])), below = { ...land };
  for (let i = 0; i < N; i++) {
    if (!inB(i) || water0[i] || z[i] === -32768) continue;
    const k = cls[i] === NONE ? 'none' : ALL[cls[i]];
    (z[i] < MSL_CM ? below : land)[k] += cellHa;
  }
  const r1 = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 10) / 10]));
  out.push({ id: key, slrM: sc.slrM, label: `${sc.slrM} m of sea level rise, MHHW, Kh 1.0 m/day`, source: sc.source, files, berkeleyLandHa: r1(land), belowMslHa: r1(below) });
  console.log(`${key}: Berkeley land (ha) ${Object.entries(r1(land)).map(([k, v]) => `${k} ${v}`).join(', ')}`);
}
fs.writeFileSync('data/hazard/cosmos-gw.json', JSON.stringify({
  note: 'USGS CoSMoS-GW (Befus and others 2020, https://doi.org/10.5066/P9H5PBXP): modeled depth from the ground surface down to the water table, in classes, for 0 to 5 m of sea level rise, Alameda County package, MHHW marine boundary condition, full model (groundwater reaching the surface removed, "simulating loss via natural drainage"), horizontal hydraulic conductivity 1.0 m/day, the middle of the three cases (0.1, 1.0, 10 m/day; the release names no best estimate). Rasterized to this grid by polygon center. A depth to groundwater, not a flood depth and not a water level; steady state; the model has no pumping, storm drains or sewers ("only natural conditions (i.e., no man-made activities or terrain alteration)", water table depth methods). Areas the model calls marine are below MHHW plus the rise in its terrain. SOURCE_NOTES H7, C22.',
  provenance: { category: 'sourced', retrieved: clips.retrieved, item: clips.item, conductivity: clips.conductivity, model: clips.model, marineBoundary: clips.marineBoundary },
  classes: GW_CLASSES,
  scenarios: out,
}, null, 1) + '\n');
