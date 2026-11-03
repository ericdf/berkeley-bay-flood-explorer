// Results for one water level and one plan: what the connected fill (js/fill.js) reaches. Shared by
// the page and the Node checks. Inputs are the loaded data files; nothing here fetches.
import { connectedFill, sampleLine, openWater, WET, LOW, MSL_FT } from './fill.js';
const MSL_CM = MSL_FT * 30.48;
import { crestFor, raisedEdges } from './plan.js';
import { rainPools, RAIN } from './rain.js';
export { RAIN };

// Extra cell states set here: wet and reached only through a neighbor's land; and low ground
// that can fill through the storm drains (docs/design/levers-and-drains.md, part 2).
export const FLANKED = 3, DRAIN = 4;

// A street segment counts as under water when at least this share of its samples is wet (model rule).
export const STREET_WET_SHARE = 0.25;

const isWet = (v) => v === WET || v === FLANKED;

// "Bay water up the drains" (model rule): in a watershed whose drain link is open (no tide gate),
// every connected patch of low, not-connected ground that holds a storm drain inlet can fill
// through the drains. Upper bound: pipe capacity, inverts and storm duration are ignored.
function markDrains(D, state, gates) {
  if (!D.drains || !D.watershedIds) return {};
  const W = D.dem.width, H = D.dem.height, ids = D.watershedIds;
  const inlet = D.inletMask ??= (() => { const m = new Uint8Array(W * H); for (const i of D.drains.inletCells) m[i] = 1; return m; })();
  const open = new Uint8Array(256);
  for (const w of D.drains.watersheds) if (w.link && !(gates && gates[w.name])) open[w.id] = 1;
  const seen = new Uint8Array(W * H), q = new Int32Array(W * H), byName = {};
  const names = []; for (const w of D.drains.watersheds) names[w.id] = w.name;
  for (let s = 0; s < W * H; s++) {
    if (state[s] !== LOW || seen[s]) continue;
    let t = 0, h = 0, hasInlet = false, ws = 0; q[t++] = s; seen[s] = 1;
    while (h < t) {
      const i = q[h++]; const r = (i / W) | 0, c = i - r * W;
      if (inlet[i]) { hasInlet = true; if (!ws && open[ids[i]]) ws = ids[i]; }
      for (const j of [c > 0 ? i - 1 : -1, c < W - 1 ? i + 1 : -1, r > 0 ? i - W : -1, r < H - 1 ? i + W : -1])
        if (j >= 0 && !seen[j] && state[j] === LOW) { seen[j] = 1; q[t++] = j; }
    }
    if (hasInlet && ws) for (let k = 0; k < t; k++) {
      state[q[k]] = DRAIN;
      const name = names[ids[q[k]]] || 'outside the City watersheds'; byName[name] = (byName[name] || 0) + 1;
    }
  }
  return byName;
}

// rain: optional { duration: '6-hr', ari: '10', blocked: 1 } (js/rain.js).
export function analyze(D, levelFt, plan = null, rain = null) {
  const { dem, z, streets, facilities, facilityCells } = D;
  const water0 = D.water0 ??= openWater(z, dem.width, dem.height);
  const crest = plan ? crestFor(D, plan) : null;
  const state = connectedFill(z, dem.width, dem.height, levelFt, null, crest);
  const inB = (i) => (D.berkeley[i >> 3] >> (i & 7)) & 1;
  // Flanking (specification.md, Extent): Berkeley ground the water reaches only by crossing land in
  // Albany or Emeryville. Fill again with neighbors' land closed off; Berkeley cells wet in the
  // first fill but not in this one were reached through a neighbor.
  const neighborLand = D.neighborLand ??= (() => { const m = new Uint8Array(state.length); for (let i = 0; i < m.length; i++) m[i] = !water0[i] && !inB(i) ? 1 : 0; return m; })();
  const alone = connectedFill(z, dem.width, dem.height, levelFt, neighborLand, crest);
  for (let i = 0; i < state.length; i++) if (state[i] === WET && inB(i) && !water0[i] && alone[i] !== WET) state[i] = FLANKED;
  const drainCellsByWatershed = markDrains(D, state, plan && plan.gates);
  const rainRes = rain ? rainPools(D, state, levelFt, rain, crest) : null;
  let wetLand = 0, lowLand = 0, flanked = 0, drainLand = 0, rainLand = 0;
  for (let i = 0; i < state.length; i++) {
    if (z[i] === -32768 || water0[i] || !inB(i) || z[i] < MSL_CM) continue; // open Bay, a lagoon below mean sea level (Aquatic Park), or outside Berkeley
    const v = state[i];
    if (isWet(v)) wetLand++; if (v === FLANKED) flanked++; else if (v === LOW) lowLand++; else if (v === DRAIN) drainLand++; else if (v === RAIN) rainLand++;
  }
  const cellHa = dem.resolution * dem.resolution / 1e4;
  const raised = raisedEdges(D, plan);
  const segs = [], overWater = [];
  for (const e of streets.edges) {
    const s = sampleLine(e.geom, state, z, dem, water0, 4, rainRes ? D.rainSurface : null);
    if (s.n === 0) continue;
    // A segment whose line crosses water in the terrain (the open Bay, or a lagoon below mean sea
    // level such as Aquatic Park) is a bridge, a causeway the grid misses, or a street drawn across
    // water; its samples say nothing about the road (model rule).
    const any = s.wetShare >= STREET_WET_SHARE || s.lowShare >= STREET_WET_SHARE || s.drainShare >= STREET_WET_SHARE || s.rainShare >= STREET_WET_SHARE;
    if (s.waterSamples > 0) { if (any) overWater.push({ e, ...s }); continue; }
    if (!any) continue;
    const cls = s.wetShare >= STREET_WET_SHARE ? 'wet' : s.rainShare >= STREET_WET_SHARE ? 'rain' : s.drainShare >= STREET_WET_SHARE ? 'drain' : 'low';
    const depthFt = cls === 'rain' ? s.rainDepthFt : undefined; // deepest pooled rain, from the same 4 m samples
    segs.push({ e, ...s, cls, wet: cls === 'wet', raisedFt: raised[e.id], depthFt });
  }
  const byName = new Map();
  for (const s of segs) {
    const k = `${s.e.name}|${s.e.berkeley ? 1 : 0}|${s.cls}`;
    const v = byName.get(k) || { name: s.e.name, berkeley: !!s.e.berkeley, cls: s.cls, wet: s.wet, freeway: !!s.e.freeway, frontage: !!s.e.frontage, m: 0, minFt: Infinity };
    v.m += s.e.len; v.minFt = Math.min(v.minFt, s.minFt); if (s.depthFt != null) v.depthFt = Math.max(v.depthFt || 0, s.depthFt); byName.set(k, v);
  }
  const rank = { wet: 3, rain: 2, drain: 1, low: 0 };
  const streetsOut = [...byName.values()].sort((a, b) => (rank[b.cls] - rank[a.cls]) || (b.freeway - a.freeway) || (b.berkeley - a.berkeley) || (b.m - a.m));
  const fac = facilities.map((f, k) => {
    const cells = facilityCells[k].cells; let w = 0, l = 0, d = 0, rn = 0;
    for (const i of cells) { if (isWet(state[i])) w++; else if (state[i] === LOW) l++; else if (state[i] === DRAIN) d++; else if (state[i] === RAIN) rn++; }
    const g = cells.map(i => z[i]).filter(v => v !== -32768).sort((a, b) => a - b);
    const n = cells.length || 1;
    return { ...f, wetShare: w / n, lowShare: l / n, drainShare: d / n, rainShare: rn / n, medianGroundFt: g.length ? g[g.length >> 1] / 30.48 : NaN };
  });
  const sumB = (cls) => segs.filter(s => s.cls === cls && s.e.berkeley).reduce((t, s) => t + s.e.len, 0);
  // Walls the water goes over at this level.
  const overtopped = [...((plan && plan.walls) || []), ...((plan && plan.roads) || [])].filter(w => w.crestFt <= levelFt).map(w => w.label);
  // Drain-fillable Berkeley land by the City watershed each cell lies in.
  const drainHa = {};
  for (let i = 0; i < state.length; i++) if (state[i] === DRAIN && inB(i) && !water0[i] && z[i] >= MSL_CM) { const n = (D.drains.watersheds.find(w => w.id === D.watershedIds[i]) || {}).name || 'outside the City watersheds'; drainHa[n] = (drainHa[n] || 0) + cellHa; }
  return {
    levelFt, state, segs,
    wetLandHa: wetLand * cellHa, lowLandHa: lowLand * cellHa, flankedHa: flanked * cellHa, drainLandHa: drainLand * cellHa, drainHa,
    rainLandHa: rainLand * cellHa, rain: rainRes,
    wetStreetM: sumB('wet'), lowStreetM: sumB('low'), drainStreetM: sumB('drain'), rainStreetM: sumB('rain'),
    freewayWet: streetsOut.filter(s => s.wet && s.freeway),
    streets: streetsOut, facilities: fac, overWater, overtopped,
  };
}
