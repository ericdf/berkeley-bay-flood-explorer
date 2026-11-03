// Rain on a high tide (docs/design/levers-and-drains.md, part 3). Model rule: an illustrative storage
// experiment, not a flood estimate. Putting all of a watershed's runoff in one pool overstates depth
// at that inlet and misses ponding elsewhere, so it bounds neither extent nor depth across Berkeley.
//
// While the Bay is high, storm drain outfalls cannot discharge. The storm's runoff from each City
// watershed then backs up in the pipes and comes out first at the watershed's lowest inlet, and
// fills the low ground around it upward (fill-and-spill from one point).
//   volume = rain depth (NOAA Atlas 14) x runoff share x share that cannot drain x watershed area
// The runoff share is the Simple Method, Rv = 0.05 + 0.009 x percent impervious (Schueler 1987),
// with NLCD 2021 imperviousness averaged over the watershed (SOURCE_NOTES R1-R4). The method was made
// for annual pollutant loads from drainage areas under one square mile (EPA BASINS 4.5 manual,
// SOURCE_NOTES R3); applying it to one design storm, and to Derby, Strawberry, Schoolhouse and
// Codornices, which are larger, is an exploratory assumption.
// The pool stays inside its watershed (spill over a divide is not modeled); if it reaches ground
// connected to the Bay, the rest flows to the Bay and the pool stops rising.
// Ground already under Bay water is not counted again. Low ground already filling through the
// drains (js/analyze.js DRAIN) is treated as full to the Bay level, so rain adds above it.

export const RAIN = 5;
const isBay = (v) => v === 1 || v === 3; // WET or FLANKED

export function runoffShare(imperviousPct) { return Math.min(1, 0.05 + 0.009 * imperviousPct); }

// opts = { duration: '6-hr', ari: '10', blocked: 1.0 }. Mutates state (sets RAIN) and returns pools.
// crest: the plan's crest raster (js/plan.js) or null; walls and raised roads count as ground.
export function rainPools(D, state, levelFt, opts, crest = null) {
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
    // Bottom of a cell for the pool: its ground (or the crest of a wall or raised road in the plan),
    // or the Bay level where the drains already fill it.
    const ground = (i) => crest && crest[i] > z[i] ? crest[i] : z[i];
    const bottom = (i) => state[i] === 4 ? Math.max(ground(i), Lcm) : ground(i);
    const allowed = (i) => ids[i] === w.id && z[i] !== -32768 && !D.water0[i] && !isBay(state[i]) && state[i] !== RAIN;
    // Seed: the watershed's lowest inlet that is not under Bay water (else its lowest cell).
    let seed = -1;
    for (let i = 0; i < W * H; i++) if (inlet[i] && allowed(i) && (seed < 0 || bottom(i) < bottom(seed))) seed = i;
    if (seed < 0) for (let i = 0; i < W * H; i++) if (allowed(i) && (seed < 0 || bottom(i) < bottom(seed))) seed = i;
    if (seed < 0 || V <= 0) continue;
    // Priority flood from the seed: cells join in order of the level needed to reach them. Water held
    // at level h over the n cells in the pool is (n*h - S) cell-cm, S the sum of their bottoms, so a
    // cell that joins below the current level takes its share of the runoff when it joins.
    const Vc = V * 100 / cellM2; // runoff in cell-centimeters
    let n = 0, S = 0, hn = 0; const touched = [];
    const push = (v, i) => { let k = hn++; hv[k] = v; hi[k] = i; while (k > 0) { const p = (k - 1) >> 1; if (hv[p] <= hv[k]) break; [hv[p], hv[k]] = [hv[k], hv[p]]; [hi[p], hi[k]] = [hi[k], hi[p]]; k = p; } };
    const pop = () => { const v = hv[0], i = hi[0]; hn--; hv[0] = hv[hn]; hi[0] = hi[hn]; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < hn && hv[l] < hv[m]) m = l; if (r < hn && hv[r] < hv[m]) m = r; if (m === k) break; [hv[m], hv[k]] = [hv[k], hv[m]]; [hi[m], hi[k]] = [hi[k], hi[m]]; k = m; } return [v, i]; };
    push(bottom(seed), seed); queued[seed] = 1; touched.push(seed);
    let level = bottom(seed), spilled = false, done = false; // level in cm
    const members = [];
    while (hn > 0) {
      const [e, i] = pop();
      // Raising the pool to e would hold all the runoff: it settles below e.
      if (n > 0 && n * e - S >= Vc) { level = (Vc + S) / n; done = true; break; }
      // A cell next to Bay water: once the pool reaches it, the rest drains to the Bay over the surface.
      const r = (i / W) | 0, c = i - r * W;
      const nb = [c > 0 ? i - 1 : -1, c < W - 1 ? i + 1 : -1, r > 0 ? i - W : -1, r < H - 1 ? i + W : -1];
      if (nb.some(j => j >= 0 && (isBay(state[j]) || D.water0[j]))) { level = Math.max(level, e); spilled = true; done = true; break; }
      // Admitting this cell at level e would take more than the runoff (a hollow behind a rise):
      // the pool stops at e and the hollow is left out.
      if ((n + 1) * e - (S + bottom(i)) > Vc) { level = Math.max(level, e); done = true; break; }
      inPool[i] = 1; members.push(i); n++; S += bottom(i); level = Math.max(level, e);
      for (const j of nb) if (j >= 0 && !queued[j] && allowed(j)) { queued[j] = 1; touched.push(j); push(Math.max(bottom(j), e), j); }
    }
    if (!done && n) level = Math.max(level, (Vc + S) / n); // filled all its ground in the map
    const heldM3 = n ? Math.max(0, n * level - S) * cellM2 / 100 : 0;
    let wetCells = 0, maxDepth = 0, inB = 0;
    for (const i of members) if (bottom(i) < level) { // cells at exactly the pool surface hold no water
      state[i] = RAIN; surface[i] = Math.floor(level); wetCells++; maxDepth = Math.max(maxDepth, level - bottom(i));
      if (((D.berkeley[i >> 3] >> (i & 7)) & 1) && z[i] >= 3.31 * 30.48) inB++; // Berkeley land, not lagoon
    }
    for (const i of touched) { queued[i] = 0; inPool[i] = 0; }
    const [sx, sy] = [((seed % W) + 0.5) * R, (dem.ymax - dem.ymin) - (((seed / W) | 0) + 0.5) * R];
    pools.push({ watershed: w.name, runoffShare: rv, volumeM3: V, heldM3, levelFt: level / 30.48, areaHa: wetCells * cellM2 / 1e4, berkeleyLandHa: inB * cellM2 / 1e4,
      maxDepthFt: maxDepth / 30.48, spilledToBay: spilled, seed: [sx, sy] });
  }
  return { depthIn, pools };
}
