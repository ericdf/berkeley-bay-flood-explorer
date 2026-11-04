// Simplify the ART geodatabase clips (tools/fetch-art-dc.py) in place, to keep the repository small.
//   node tools/simplify-art-dc.mjs <tolerance m> <file.json ...>     e.g. 0.5 data/raw/art-dc/inundation_*.json
// Also drops every ring that cannot change the rasterized mask: one whose bounding box, with or
// without the datum shift (tools/nad83.mjs), spans no row of cell centers or no column of them in
// the terrain grid (data/terrain/dem.json). Under the even-odd rule such a ring flips inside and
// outside only between two neighboring cell centers, so no cell changes (checked by rebuilding).
// Douglas-Peucker on every ring, in the layer's coordinates (NAD83 / UTM zone 10N, meters): no
// vertex moves, and the simplified outline stays within the tolerance of the published one. A closed
// ring is split at its first vertex and the vertex farthest from it, so every ring keeps at least
// three distinct vertices and none disappears. Coordinates stay rounded to 0.1 m. The tolerance is
// recorded in the file ("simplifiedM"); a file already simplified at that tolerance or coarser is skipped.
// Dropping the rings changes no cell (checked 2026-11-04). Douglas-Peucker at 0.5 m, one eighth of
// the grid's 4 m cell, changed 0.25% (+ 108 in) to 1.3% (+ 12 in) of each connected mask's cells in
// the whole grid, and agreement with the fill on Berkeley land by at most 0.2 points (SOURCE_NOTES C1).
import fs from 'fs';
import { nad83ToWgs84 } from './nad83.mjs';

const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json')), R = dem.resolution, shift = nad83ToWgs84();
// true when the ring's bounding box holds no row or no column of cell centers, in either registration
function inert(r) {
  for (const f of [(x, y) => [x, y], shift]) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of r) { const [u, v] = f(x, y); x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v); }
    const c0 = Math.ceil((x0 - dem.xmin) / R - 0.5), c1 = Math.floor((x1 - dem.xmin) / R - 0.5);
    const r0 = Math.ceil((dem.ymax - y1) / R - 0.5), r1 = Math.floor((dem.ymax - y0) / R - 0.5);
    if (c1 >= c0 && r1 >= r0) return false;
  }
  return true;
}

function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); const [x1, y1] = pts[a], [x2, y2] = pts[b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    let md = -1, mi = -1;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = pts[i], d = L ? Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / L : Math.hypot(x - x1, y - y1);
      if (d > md) { md = d; mi = i; }
    }
    if (md > tol) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

export function simplifyRing(r, tol) {
  const closed = r.length > 3 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1];
  if (!closed) return dp(r, tol);
  let far = 1, fd = -1;
  for (let i = 1; i < r.length - 1; i++) { const d = Math.hypot(r[i][0] - r[0][0], r[i][1] - r[0][1]); if (d > fd) { fd = d; far = i; } }
  const a = dp(r.slice(0, far + 1), tol), b = dp(r.slice(far), tol);
  return [...a, ...b.slice(1)];
}

const [tolArg, ...files] = process.argv.slice(2);
const tol = Number(tolArg);
if (!(tol > 0 && tol <= 0.5) || !files.length) { console.error('usage: node tools/simplify-art-dc.mjs <tolerance m, at most 0.5> <file.json ...>'); process.exit(1); }
for (const f of files) {
  const src = JSON.parse(fs.readFileSync(f));
  if (src.simplifiedM && src.simplifiedM >= tol) { console.log(`${f}: already simplified at ${src.simplifiedM} m`); continue; }
  let v0 = 0, v1 = 0, r0 = 0, r1 = 0;
  for (const feat of src.features) feat.rings = feat.rings.filter(r => { v0 += r.length; r0++; return !inert(r); }).map(r => { r1++; const s = simplifyRing(r, tol); v1 += s.length; return s; });
  src.features = src.features.filter(f => f.rings.length);
  const before = fs.statSync(f).size;
  const out = { ...src, simplifiedM: tol, simplification: `tools/simplify-art-dc.mjs: rings that cannot change a cell of the 4 m grid dropped (${r0} rings before, ${r1} after), then Douglas-Peucker at ${tol} m; ${v0} vertices before, ${v1} after` };
  fs.writeFileSync(f, JSON.stringify(out, null, 0));
  console.log(`${f}: ${r0} -> ${r1} rings, ${v0} -> ${v1} vertices, ${(before / 1e6).toFixed(2)} -> ${(fs.statSync(f).size / 1e6).toFixed(2)} MB`);
}
