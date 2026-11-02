// Results for one water level: what the connected fill (js/fill.js) reaches. Shared by the page
// and the Node checks. Inputs are the loaded data files; nothing here fetches.
import { connectedFill, sampleLine, openWater, WET, LOW } from './fill.js';

// Extra cell state set here: wet, and reached only through a neighbor's land.
export const FLANKED = 3;

// A street segment counts as under water when at least this share of its samples is wet (model rule).
export const STREET_WET_SHARE = 0.25;

export function analyze(D, levelFt, barrier = null) {
  const { dem, z, streets, facilities, facilityCells } = D;
  const water0 = D.water0 ??= openWater(z, dem.width, dem.height);
  const state = connectedFill(z, dem.width, dem.height, levelFt, barrier);
  const inB = (i) => (D.berkeley[i >> 3] >> (i & 7)) & 1;
  let wetLand = 0, lowLand = 0;
  for (let i = 0; i < state.length; i++) {
    if (z[i] === -32768 || water0[i] || !inB(i)) continue; // open Bay or outside Berkeley
    if (state[i] === WET) wetLand++; else if (state[i] === LOW) lowLand++;
  }
  // Flanking (specification.md, Extent): Berkeley ground the water reaches only by crossing land in
  // Albany or Emeryville. Fill again with neighbors' land closed off; Berkeley cells wet in the
  // first fill but not in this one were reached through a neighbor.
  const D2 = D.neighborLand ??= (() => { const m = new Uint8Array(state.length); for (let i = 0; i < m.length; i++) m[i] = !water0[i] && !inB(i) ? 1 : 0; return m; })();
  const closed = barrier ? D2.map((v, i) => v | barrier[i]) : D2;
  const alone = connectedFill(z, dem.width, dem.height, levelFt, closed);
  let flanked = 0;
  for (let i = 0; i < state.length; i++) if (state[i] === WET && inB(i) && !water0[i] && alone[i] !== WET) { flanked++; state[i] = FLANKED; }
  const cellHa = dem.resolution * dem.resolution / 1e4;
  const segs = [], overWater = [];
  for (const e of streets.edges) {
    const s = sampleLine(e.geom, state, z, dem, water0);
    if (s.n === 0) continue;
    // A segment whose line crosses water in the terrain (the open Bay, or a lagoon below mean sea
    // level such as Aquatic Park) is a bridge, a causeway the grid misses, or a street drawn across
    // water; its samples say nothing about the road (model rule).
    if (s.waterSamples > 0) { if (s.wetShare >= STREET_WET_SHARE || s.lowShare >= STREET_WET_SHARE) overWater.push({ e, ...s }); continue; }
    if (s.wetShare >= STREET_WET_SHARE || s.lowShare >= STREET_WET_SHARE) segs.push({ e, ...s, wet: s.wetShare >= STREET_WET_SHARE });
  }
  const byName = new Map();
  for (const s of segs) {
    const k = s.e.name + (s.e.berkeley ? '' : ' (outside Berkeley)') + (s.wet ? '' : ' (low, not connected)');
    const v = byName.get(k) || { name: s.e.name, berkeley: !!s.e.berkeley, wet: s.wet, freeway: !!s.e.freeway, frontage: !!s.e.frontage, m: 0, minFt: Infinity };
    v.m += s.e.len; v.minFt = Math.min(v.minFt, s.minFt); byName.set(k, v);
  }
  const streetsOut = [...byName.values()].sort((a, b) => (b.wet - a.wet) || (b.freeway - a.freeway) || (b.berkeley - a.berkeley) || (b.m - a.m));
  const fac = facilities.map((f, k) => {
    const cells = facilityCells[k].cells; let w = 0, l = 0;
    for (const i of cells) { if (state[i] === WET || state[i] === FLANKED) w++; else if (state[i] === LOW) l++; }
    const g = cells.map(i => z[i]).filter(v => v !== -32768).sort((a, b) => a - b);
    return { ...f, wetShare: cells.length ? w / cells.length : 0, lowShare: cells.length ? l / cells.length : 0, medianGroundFt: g.length ? g[g.length >> 1] / 30.48 : NaN };
  });
  return {
    levelFt, state, segs,
    wetLandHa: wetLand * cellHa, lowLandHa: lowLand * cellHa, flankedHa: flanked * cellHa,
    wetStreetM: segs.filter(s => s.wet && s.e.berkeley).reduce((t, s) => t + s.e.len, 0),
    lowStreetM: segs.filter(s => !s.wet && s.e.berkeley).reduce((t, s) => t + s.e.len, 0),
    freewayWet: streetsOut.filter(s => s.wet && s.freeway),
    streets: streetsOut, facilities: fac, overWater,
  };
}
