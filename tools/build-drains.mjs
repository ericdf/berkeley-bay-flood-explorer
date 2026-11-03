// Drain data for the "Bay water up the drains" rule (docs/design/levers-and-drains.md, part 2).
//   node tools/build-drains.mjs
// Reads the City watersheds (data/raw/city/watersheds.geojson) and storm drain inlets
// (data/raw/city/inlets.json). Writes data/hazard/watersheds.u8 (one byte per cell: 0 = none,
// k = the k-th watershed in data/drains.json) and data/drains.json: per watershed, whether it meets
// open water inside the map (then it has a drain link), the link's outfall point (the centroid of
// the watershed cells that touch open water, grid meters), and the grid cells holding an inlet.
import fs from 'fs';
import { toUTM } from './utm.mjs';
import { openWater } from '../js/fill.js';
const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const b = fs.readFileSync('data/terrain/dem.i16'); const z = new Int16Array(b.buffer, b.byteOffset, b.length / 2);
const W = dem.width, H = dem.height, R = dem.resolution, Hm = dem.ymax - dem.ymin;
const water0 = openWater(z, W, H);
const ws = JSON.parse(fs.readFileSync('data/raw/city/watersheds.geojson')).features;
const local = ([lo, la]) => { const [x, y] = toUTM(lo, la); return [x - dem.xmin, y - dem.ymin]; };
const ids = new Uint8Array(W * H);
const out = [];
ws.forEach((f, k) => {
  const id = k + 1; const g = f.geometry;
  const rings = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).flat().map(r => r.map(local));
  for (let r = 0; r < H; r++) {
    const y = Hm - (r + 0.5) * R, xs = [];
    for (const ring of rings) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [x1, y1] = ring[i], [x2, y2] = ring[j]; if ((y1 > y) !== (y2 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1)); }
    xs.sort((a, c) => a - c);
    for (let q = 0; q + 1 < xs.length; q += 2) for (let c = Math.max(0, Math.ceil(xs[q] / R - 0.5)); c < W && (c + 0.5) * R <= xs[q + 1]; c++) ids[r * W + c] = id;
  }
  // Full watershed area (m2, UTM), including any part outside the map: runoff from the hills reaches
  // the flats through the same drains (rain on a high tide, js/rain.js).
  let area = 0; for (const ring of rings) { let a2 = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a2 += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]); area += a2 / 2; }
  out.push({ name: f.properties.NAME, id, areaM2: Math.round(Math.abs(area)) });
});
// Outfall point (derived): the watershed's cell nearest to open water, by a breadth-first distance
// over the grid (4-neighbor steps of 4 m). Watersheds that end at I-80 or the city line still drain
// to the Bay through culverts and outfalls (SOURCE_NOTES F7, F8), so a watershed gets a link when its
// nearest point is within MAX_LINK_M of open water.
const MAX_LINK_M = 500;
const dist = new Int32Array(W * H).fill(-1); const q = new Int32Array(W * H); let h = 0, t = 0;
for (let i = 0; i < W * H; i++) if (water0[i]) { dist[i] = 0; q[t++] = i; }
while (h < t) { const i = q[h++]; const r = (i / W) | 0, c = i - r * W; for (const j of [c > 0 ? i - 1 : -1, c < W - 1 ? i + 1 : -1, r > 0 ? i - W : -1, r < H - 1 ? i + W : -1]) if (j >= 0 && dist[j] < 0) { dist[j] = dist[i] + 1; q[t++] = j; } }
for (const w of out) {
  let cells = 0, best = -1;
  for (let i = 0; i < W * H; i++) { if (ids[i] !== w.id) continue; cells++; if (!water0[i] && dist[i] >= 0 && (best < 0 || dist[i] < dist[best])) best = i; }
  w.cellsInMap = cells;
  if (best >= 0) { const r = (best / W) | 0, c = best - r * W; w.distanceToWaterM = dist[best] * R; w.link = w.distanceToWaterM <= MAX_LINK_M; w.outfall = [(c + 0.5) * R, Hm - (r + 0.5) * R]; } else w.link = false;
}
const inl = JSON.parse(fs.readFileSync('data/raw/city/inlets.json')).points;
const inletCells = new Set();
for (const p of inl) { const [x, y] = local(p); const c = Math.floor(x / R), r = Math.floor((Hm - y) / R); if (c >= 0 && r >= 0 && c < W && r < H) inletCells.add(r * W + c); }
fs.writeFileSync('data/hazard/watersheds.u8', ids);
fs.writeFileSync('data/drains.json', JSON.stringify({
  note: 'Drain links for the "Bay water up the drains" rule (model rule, docs/design/levers-and-drains.md). Watersheds and inlets: City of Berkeley open data (SOURCE_NOTES D1, D2). A watershed has a link when it meets open water inside the map; the outfall point is where it meets it, not a surveyed outfall.',
  watersheds: out, inletCells: [...inletCells].sort((a, b) => a - b),
}) + '\n');
console.log(out.map(w => `${w.name}: ${w.cellsInMap} cells, ${w.distanceToWaterM ?? '-'} m to open water${w.link ? ', link' : ''}`).join('\n'), `\n${inletCells.size} inlet cells in the map`);
