// Rain on a high tide (docs/design/levers-and-drains.md, part 3). Model rule, an upper bound.
//
// While the Bay is high, storm drain outfalls cannot discharge. The storm's runoff from each City
// watershed then backs up in the pipes and comes out first at the watershed's lowest inlet, and
// fills the low ground around it upward (fill-and-spill from one point).
//   volume = rain depth (NOAA Atlas 14) x runoff share x share that cannot drain x watershed area
// The runoff share is the Simple Method, Rv = 0.05 + 0.009 x percent impervious (Schueler 1987),
// with NLCD 2021 imperviousness averaged over the watershed (SOURCE_NOTES R1-R4).
// The pool stays inside its watershed (spill over a divide is not modeled); if it reaches ground
// connected to the Bay, the rest flows to the Bay and the pool stops rising.
// Ground already under Bay water is not counted again. Low ground already filling through the
// drains (js/analyze.js DRAIN) is treated as full to the Bay level, so rain adds above it.

export const RAIN = 5;
const isBay = (v) => v === 1 || v === 3; // WET or FLANKED

export function runoffShare(imperviousPct) { return Math.min(1, 0.05 + 0.009 * imperviousPct); }

// opts = { duration: '6-hr', ari: '10', blocked: 1.0 }. Mutates state (sets RAIN) and returns pools.
export function rainPools(D, state, levelFt, opts) {
  const { dem, z } = D, W = dem.width, H = dem.height, R = dem.resolution, cellM2 = R * R;
  const depthIn = D.atlas.depthIn[opts.duration][opts.ari];
  const depthM = depthIn * 0.0254, Lcm = levelFt * 30.48;
  const ids = D.watershedIds;
  const inlet = D.inletMask ??= (() => { const m = new Uint8Array(W * H); for (const i of D.drains.inletCells) m[i] = 1; return m; })();
  const pools = [];
  // Pool surface (cm NAVD88) for every rain-pool cell, for depths on streets.
  const surface = D.rainSurface = new Int16Array(W * H).fill(-32768);
  const hv = new Float32Array(W * H * 2), hi = new Int32Array(W * H * 2);
  const inPool = new Uint8Array(W * H), queued = new Uint8Array(W * H);
  for (const w of D.drains.watersheds) {
    if (!w.link || !w.cellsInMap) continue;
    const imp = D.impervious[w.name]; if (!imp) continue;
    const rv = runoffShare(imp.imperviousPct);
    const V = depthM * rv * opts.blocked * w.areaM2; // m3
    // Bottom of a cell for the pool: its ground, or the Bay level where the drains already fill it.
    const bottom = (i) => state[i] === 4 ? Math.max(z[i], Lcm) : z[i];
    const allowed = (i) => ids[i] === w.id && z[i] !== -32768 && !D.water0[i] && !isBay(state[i]) && state[i] !== RAIN;
    // Seed: the watershed's lowest inlet that is not under Bay water (else its lowest cell).
    let seed = -1;
    for (let i = 0; i < W * H; i++) if (inlet[i] && allowed(i) && (seed < 0 || bottom(i) < bottom(seed))) seed = i;
    if (seed < 0) for (let i = 0; i < W * H; i++) if (allowed(i) && (seed < 0 || bottom(i) < bottom(seed))) seed = i;
    if (seed < 0 || V <= 0) continue;
    // Priority flood from the seed: cells join in order of the level needed to reach them.
    let n = 0, hn = 0; const touched = [];
    const push = (v, i) => { let k = hn++; hv[k] = v; hi[k] = i; while (k > 0) { const p = (k - 1) >> 1; if (hv[p] <= hv[k]) break; [hv[p], hv[k]] = [hv[k], hv[p]]; [hi[p], hi[k]] = [hi[k], hi[p]]; k = p; } };
    const pop = () => { const v = hv[0], i = hi[0]; hn--; hv[0] = hv[hn]; hi[0] = hi[hn]; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < hn && hv[l] < hv[m]) m = l; if (r < hn && hv[r] < hv[m]) m = r; if (m === k) break; [hv[m], hv[k]] = [hv[k], hv[m]]; [hi[m], hi[k]] = [hi[k], hi[m]]; k = m; } return [v, i]; };
    push(bottom(seed), seed); queued[seed] = 1; touched.push(seed);
    let level = bottom(seed), vol = 0, spilled = false; // level in cm, vol in m3
    const members = [];
    while (hn > 0) {
      const [e, i] = pop();
      if (e > level) {
        const add = n * cellM2 * (e - level) / 100;
        if (vol + add >= V) { level += (V - vol) / (n * cellM2) * 100; vol = V; break; }
        vol += add; level = e;
      }
      // A pool cell next to Bay water: the pool now drains to the Bay over the surface.
      const r = (i / W) | 0, c = i - r * W;
      const nb = [c > 0 ? i - 1 : -1, c < W - 1 ? i + 1 : -1, r > 0 ? i - W : -1, r < H - 1 ? i + W : -1];
      if (nb.some(j => j >= 0 && (isBay(state[j]) || D.water0[j]))) { spilled = true; members.push(i); n++; break; }
      inPool[i] = 1; members.push(i); n++;
      for (const j of nb) if (j >= 0 && !queued[j] && allowed(j)) { queued[j] = 1; touched.push(j); push(Math.max(bottom(j), e), j); }
    }
    if (hn === 0 && vol < V && n) { level += (V - vol) / (n * cellM2) * 100; vol = V; } // filled its whole area in the map
    let wetCells = 0, maxDepth = 0, inB = 0;
    for (const i of members) if (bottom(i) < level) {
      state[i] = RAIN; surface[i] = Math.round(level); wetCells++; maxDepth = Math.max(maxDepth, level - bottom(i));
      if (((D.berkeley[i >> 3] >> (i & 7)) & 1) && z[i] >= 3.31 * 30.48) inB++; // Berkeley land, not lagoon
    }
    for (const i of touched) { queued[i] = 0; inPool[i] = 0; }
    const [sx, sy] = [((seed % W) + 0.5) * R, (dem.ymax - dem.ymin) - (((seed / W) | 0) + 0.5) * R];
    pools.push({ watershed: w.name, runoffShare: rv, volumeM3: V, levelFt: level / 30.48, areaHa: wetCells * cellM2 / 1e4, berkeleyLandHa: inB * cellM2 / 1e4,
      maxDepthFt: maxDepth / 30.48, spilledToBay: spilled, seed: [sx, sy] });
  }
  return { depthIn, pools };
}
