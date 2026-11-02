// Rasterize the City of Berkeley boundary (Census TIGERweb place 0606000) onto the terrain grid.
// Writes data/terrain/berkeley.bits: one bit per cell, row-major, 1 = cell center inside Berkeley.
//   node tools/build-mask.mjs
import fs from 'fs';
import { toUTM } from './utm.mjs';
const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const g = JSON.parse(fs.readFileSync('data/raw/census/berkeley-place.geojson')).features[0].geometry;
const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
const R = dem.resolution, Hm = dem.ymax - dem.ymin;
const rings = polys.flat().map(r => r.map(([lo, la]) => { const [x, y] = toUTM(lo, la); return [x - dem.xmin, y - dem.ymin]; }));
const bits = new Uint8Array(Math.ceil(dem.width * dem.height / 8));
let n = 0;
for (let r = 0; r < dem.height; r++) {
  const y = Hm - (r + 0.5) * R; const xs = [];
  for (const ring of rings) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[i], [x2, y2] = ring[j];
    if ((y1 > y) !== (y2 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1));
  }
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2)
    for (let c = Math.max(0, Math.ceil(xs[k] / R - 0.5)); c < dem.width && (c + 0.5) * R <= xs[k + 1]; c++) { const i = r * dem.width + c; bits[i >> 3] |= 1 << (i & 7); n++; }
}
fs.writeFileSync('data/terrain/berkeley.bits', bits);
console.log(n, 'cells inside Berkeley of', dem.width * dem.height);
