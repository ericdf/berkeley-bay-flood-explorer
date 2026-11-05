// The Aquatic Park tide tubes (SOURCE_NOTES D7–D9): what the "tide gate on every outfall" plan keeps
// dry around the lagoon that the lagoon could reach if it stood at the Bay's level through its tubes.
//   node tools/lagoon-tubes.mjs
// Lagoon (derived): each patch of ground below mean sea level (3.31 ft NAVD88) that does not connect
// to the open Bay over the surface and has at least 0.5 ha inside the Aquatic Park outline
// (data/facility-cells.json), joined four ways. Reached (model rule, upper bound): ground below the
// level connected over the surface to the lagoon, as if the lagoon stood at the Bay's level. The
// tubes' capacity, the gates' setting and the length of the high water are ignored.
// Counts Berkeley land at or above mean sea level, outside the lagoon.
import fs from 'fs';
import { load, planFrom } from './report.mjs';
import { analyze } from '../js/analyze.js';
import { openWater, MSL_FT, WET, LOW } from '../js/fill.js';
const FLANKED = 3, DRAIN = 4;
const D = load(); const { z, dem } = D; const W = dem.width, H = dem.height, N = W * H;
const cellHa = dem.resolution ** 2 / 1e4, msl = MSL_FT * 30.48;
const water0 = openWater(z, W, H);
const inAP = new Uint8Array(N); for (const i of D.facilityCells[D.facilities.findIndex(f => f.label.startsWith('Aquatic Park'))].cells) inAP[i] = 1;
const inB = (i) => (D.berkeley[i >> 3] >> (i & 7)) & 1;
const nb = (i) => { const r = (i / W) | 0, c = i - r * W; return [c > 0 ? i - 1 : -1, c < W - 1 ? i + 1 : -1, r > 0 ? i - W : -1, r < H - 1 ? i + W : -1]; };
const sub = (i) => !water0[i] && z[i] !== -32768 && z[i] < msl;
const lab = new Int32Array(N), q = new Int32Array(N); const patches = []; let n = 0;
for (let s = 0; s < N; s++) {
  if (lab[s] || !sub(s)) continue;
  let h = 0, t = 0, ap = 0; lab[s] = ++n; q[t++] = s;
  while (h < t) { const i = q[h++]; if (inAP[i]) ap++; for (const j of nb(i)) if (j >= 0 && !lab[j] && sub(j)) { lab[j] = n; q[t++] = j; } }
  patches.push({ id: n, ha: t * cellHa, apHa: ap * cellHa });
}
const lagoonIds = new Set(patches.filter(p => p.apHa >= 0.5).map(p => p.id));
const lagoon = (i) => lagoonIds.has(lab[i]);
console.log(`Lagoon patches: ${patches.filter(p => lagoonIds.has(p.id)).map(p => `${p.ha.toFixed(1)} ha`).join(', ')}`);
const gates = planFrom(D, 'gates');
const sc = JSON.parse(fs.readFileSync('data/scenarios.json')).scenarios.slice().sort((a, b) => a.levelFt - b.levelFt);
console.log('level ft NAVD88 | reached from the lagoon, ha: no plan (wet / through drains / low) | with gates on every outfall (wet / low)');
for (const s of sc) {
  const lev = s.levelFt * 30.48, seen = new Uint8Array(N); let h = 0, t = 0;
  for (let i = 0; i < N; i++) if (lagoon(i)) { seen[i] = 1; q[t++] = i; }
  while (h < t) { const i = q[h++]; for (const j of nb(i)) if (j >= 0 && !seen[j] && z[j] !== -32768 && z[j] < lev) { seen[j] = 1; q[t++] = j; } }
  const a = analyze(D, s.levelFt, null).state.slice(), g = analyze(D, s.levelFt, gates).state;
  const c = { aw: 0, ad: 0, al: 0, gw: 0, gl: 0 };
  for (let i = 0; i < N; i++) {
    if (!seen[i] || lagoon(i) || !inB(i) || z[i] < msl) continue;
    if (a[i] === WET || a[i] === FLANKED) c.aw++; else if (a[i] === DRAIN) c.ad++; else c.al++;
    if (g[i] === WET || g[i] === FLANKED) c.gw++; else c.gl++;
  }
  const f = (k) => (c[k] * cellHa).toFixed(1).padStart(5);
  console.log(`${s.levelFt.toFixed(2).padStart(6)} ${s.id.padEnd(24)} | ${f('aw')} / ${f('ad')} / ${f('al')} | ${f('gw')} / ${f('gl')}`);
}
