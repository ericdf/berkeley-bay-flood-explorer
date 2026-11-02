// Find the lowest water level at which the connected fill reaches the West Berkeley flats behind
// I-80, and where it first crosses: the "spill point" (derived from the terrain, model rule).
//   node tools/overtop.mjs
// Target: the transfer station outline (data/facility-cells.json). Bisection to 0.01 ft, then the
// spill point is the highest cell on the path the water takes at that level (a minimax path),
// found by a priority flood from the Bay.
import { load } from './report.mjs';
import { connectedFill, WET } from '../js/fill.js';
import { fromUTM as toLonLat } from './utm.mjs';
const D = load(), { dem, z } = D, W = dem.width, H = dem.height;
const target = D.facilityCells[0].cells;
const reaches = (lv) => { const s = connectedFill(z, W, H, lv); return target.some(i => s[i] === WET); };
let lo = 9, hi = 16;
while (hi - lo > 0.01) { const m = (lo + hi) / 2; if (reaches(m)) hi = m; else lo = m; }
console.log(`The Bay reaches the transfer station over the surface between ${lo.toFixed(3)} and ${hi.toFixed(3)} ft NAVD88.`);
// Priority flood: the level needed to reach each cell from the west edge = minimax elevation along a path.
const need = new Float32Array(W * H).fill(Infinity), from = new Int32Array(W * H).fill(-1);
// Binary heap on typed arrays (a cell may be pushed more than once; stale entries are skipped).
const CAP = W * H * 3; const hv = new Float32Array(CAP), hi_ = new Int32Array(CAP); let hn = 0;
const push = (v, i) => { let k = hn++; hv[k] = v; hi_[k] = i; while (k > 0) { const p = (k - 1) >> 1; if (hv[p] <= hv[k]) break; [hv[p], hv[k]] = [hv[k], hv[p]]; [hi_[p], hi_[k]] = [hi_[k], hi_[p]]; k = p; } };
const pop = () => { const v = hv[0], i = hi_[0]; hn--; hv[0] = hv[hn]; hi_[0] = hi_[hn]; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < hn && hv[l] < hv[m]) m = l; if (r < hn && hv[r] < hv[m]) m = r; if (m === k) break; [hv[m], hv[k]] = [hv[k], hv[m]]; [hi_[m], hi_[k]] = [hi_[k], hi_[m]]; k = m; } return [v, i]; };
const zf = (i) => z[i] === -32768 ? Infinity : z[i] / 30.48;
for (let r = 0; r < H; r++) { const i = r * W; need[i] = zf(i); push(need[i], i); }
while (hn > 0) {
  const [v, i] = pop(); if (v > need[i]) continue;
  const r = (i / W) | 0, c = i - r * W;
  for (const j of [c > 0 ? i - 1 : -1, c < W - 1 ? i + 1 : -1, r > 0 ? i - W : -1, r < H - 1 ? i + W : -1]) {
    if (j < 0) continue; const nv = Math.max(v, zf(j));
    if (nv < need[j]) { need[j] = nv; from[j] = i; push(nv, j); }
  }
}
let best = target[0]; for (const i of target) if (need[i] < need[best]) best = i;
// Walk back to the Bay; the spill point is the highest cell on the way.
let i = best, spill = best; const path = [];
while (from[i] >= 0) { path.push(i); if (zf(i) > zf(spill)) spill = i; i = from[i]; }
path.push(i); path.reverse(); // from the Bay to the transfer station
if (process.argv[2] === '--path') for (let k = 0; k < path.length; k += 12) { const j = path[k], rr = (j / W) | 0, cc = j - rr * W; const [lo_, la_] = toLonLat(dem.xmin + (cc + 0.5) * 4, dem.ymax - (rr + 0.5) * 4); console.log(k, la_.toFixed(5), lo_.toFixed(5), zf(j).toFixed(2)); }
const r = (spill / W) | 0, c = spill - r * W;
const [lon, lat] = toLonLat(dem.xmin + (c + 0.5) * dem.resolution, dem.ymax - (r + 0.5) * dem.resolution);
console.log(`Spill point: ground ${zf(spill).toFixed(2)} ft NAVD88 at ${lat.toFixed(5)}, ${lon.toFixed(5)} (cell row ${r}, col ${c}).`);
