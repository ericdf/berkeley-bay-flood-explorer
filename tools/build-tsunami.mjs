// Rasterize the State's Tsunami Hazard Area (SOURCE_NOTES H6) onto the terrain grid.
//   node tools/build-tsunami.mjs
// Reads data/raw/cgs/tsunami-hazard-area.geojson; writes data/hazard/tsunami.bits (one bit per cell,
// row-major, 1 = inside the hazard area) and data/hazard/tsunami.json. A cell is inside when its
// center is (even-odd rule over every ring, as tools/build-art.mjs does).
import fs from 'fs';
import { toUTM } from './utm.mjs';
const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const R = dem.resolution, W = dem.width, H = dem.height, Hm = dem.ymax - dem.ymin;
const fc = JSON.parse(fs.readFileSync('data/raw/cgs/tsunami-hazard-area.geojson'));
const bits = new Uint8Array(Math.ceil(W * H / 8));
let n = 0;
for (const feat of fc.features) {
  const polys = feat.geometry.type === 'Polygon' ? [feat.geometry.coordinates] : feat.geometry.coordinates;
  for (const poly of polys) {
    const rings = poly.map(r => r.map(([lo, la]) => { const [x, y] = toUTM(lo, la); return [x - dem.xmin, y - dem.ymin]; }));
    let ymin = Infinity, ymax = -Infinity; for (const r of rings) for (const [, y] of r) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
    if (ymax < 0 || ymin > Hm) continue;
    for (let row = Math.max(0, Math.floor((Hm - ymax) / R)); row <= Math.min(H - 1, Math.ceil((Hm - ymin) / R)); row++) {
      const y = Hm - (row + 0.5) * R, xs = [];
      for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [x1, y1] = r[i], [x2, y2] = r[j]; if ((y1 > y) !== (y2 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let c = Math.max(0, Math.ceil(xs[k] / R - 0.5)); c < W && (c + 0.5) * R <= xs[k + 1]; c++) { const i = row * W + c; if (!((bits[i >> 3] >> (i & 7)) & 1)) n++; bits[i >> 3] |= 1 << (i & 7); }
    }
  }
}
fs.writeFileSync('data/hazard/tsunami.bits', bits);
fs.writeFileSync('data/hazard/tsunami.json', JSON.stringify({
  note: "California Tsunami Hazard Area (California Geological Survey, Cal OES, USC Tsunami Research Center, AECOM), rasterized to this grid. In the layer's words it represents \"a combination of the maximum considered tsunamis for each area\" and is drawn for \"evacuation planning at the community level\": an area to leave, not a flood depth or a forecast. Source: data/raw/cgs/tsunami-hazard-area.geojson (SOURCE_NOTES H6).",
  provenance: { category: 'sourced', retrieved: '2026-11-03' },
  file: 'tsunami.bits', cells: n,
}, null, 2) + '\n');
console.log(`tsunami hazard area: ${n} cells (${(n * R * R / 1e4).toFixed(0)} ha) inside the grid`);
