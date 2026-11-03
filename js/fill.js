// Connected fill (model rule, specification.md "Hazard method").
// A cell is wet when its ground is below the water level AND it connects to the open Bay through
// other cells below that level (4-neighbor connection: water does not pass diagonally between two
// higher cells). Cells below the level that do not connect are "low, not connected": ground a
// still-water level does not reach over the surface, but where drains, tide gates, groundwater
// and rain decide what happens.
//
// The open Bay is seeded from the west edge of the grid: every west-edge cell below the level.
// Works in the browser and in Node.

export const WET = 1, LOW = 2; // cell states; 0 = dry. js/analyze.js adds FLANKED = 3, DRAIN = 4.

// zcm: Int16Array of ground elevation in centimeters NAVD88 (-32768 = no data, treated as dry).
// levelFt: water level in feet NAVD88. barrier: optional Uint8Array, 1 = closed to water.
// crest: optional Int16Array (cm NAVD88) from js/plan.js; a cell's ground is the higher of the
// lidar and the crest. Returns Uint8Array of states.
export function connectedFill(zcm, W, H, levelFt, barrier = null, crest = null) {
  const lev = levelFt * 30.48; // feet to centimeters
  const state = new Uint8Array(W * H);
  const below = crest
    ? (i) => zcm[i] !== -32768 && zcm[i] < lev && crest[i] < lev && !(barrier && barrier[i])
    : (i) => zcm[i] !== -32768 && zcm[i] < lev && !(barrier && barrier[i]);
  const q = new Int32Array(W * H);
  let head = 0, tail = 0;
  for (let r = 0; r < H; r++) { const i = r * W; if (below(i)) { state[i] = WET; q[tail++] = i; } }
  while (head < tail) {
    const i = q[head++]; const r = (i / W) | 0, c = i - r * W;
    if (c > 0 && !state[i - 1] && below(i - 1)) { state[i - 1] = WET; q[tail++] = i - 1; }
    if (c < W - 1 && !state[i + 1] && below(i + 1)) { state[i + 1] = WET; q[tail++] = i + 1; }
    if (r > 0 && !state[i - W] && below(i - W)) { state[i - W] = WET; q[tail++] = i - W; }
    if (r < H - 1 && !state[i + W] && below(i + W)) { state[i + W] = WET; q[tail++] = i + W; }
  }
  for (let i = 0; i < W * H; i++) if (!state[i] && below(i)) state[i] = LOW;
  return state;
}

// Open water (model rule): ground below mean sea level that connects to the Bay, i.e. the connected
// fill at MSL, 3.31 ft NAVD88 off the Marina (SOURCE_NOTES W11). It is under water about half the
// time, so it is Bay, harbor or mudflat rather than land. The lidar's hydro-flattened water
// surfaces lie between about 0 and 1.5 ft there.
export const MSL_FT = 3.31;
export function openWater(zcm, W, H) {
  const s = connectedFill(zcm, W, H, MSL_FT);
  const m = new Uint8Array(W * H);
  for (let i = 0; i < m.length; i++) m[i] = s[i] === WET ? 1 : 0;
  return m;
}

// Sample a street's geometry (grid meters) every `step` meters; returns the share of samples in
// each state, the lowest ground elevation (ft) along it, and, given the rain-pool surface raster
// (cm NAVD88, js/rain.js), the deepest pooled rain on it (ft).
export function sampleLine(geom, state, zcm, meta, water0, step = 4, rainSurface = null) {
  let n = 0, wet = 0, low = 0, drain = 0, rain = 0, water = 0, minFt = Infinity, rainDepthCm = 0;
  for (let k = 1; k < geom.length; k++) {
    const [x0, y0] = geom[k - 1], [x1, y1] = geom[k];
    const L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(1, Math.ceil(L / step));
    for (let t = (k === 1 ? 0 : 1); t <= m; t++) {
      const x = x0 + (x1 - x0) * t / m, y = y0 + (y1 - y0) * t / m;
      const c = Math.floor(x / meta.resolution), r = Math.floor((meta.ymax - meta.ymin - y) / meta.resolution);
      if (c < 0 || r < 0 || c >= meta.width || r >= meta.height) continue;
      const i = r * meta.width + c; n++;
      if (state[i] === WET || state[i] === 3) wet++; else if (state[i] === LOW) low++; else if (state[i] === 4) drain++; else if (state[i] === 5) { rain++; if (rainSurface) rainDepthCm = Math.max(rainDepthCm, rainSurface[i] - zcm[i]); }
      if (zcm[i] !== -32768) minFt = Math.min(minFt, zcm[i] / 30.48);
      if (water0[i] || (zcm[i] !== -32768 && zcm[i] < MSL_FT * 30.48)) water++; // open Bay, or a lagoon below mean sea level
    }
  }
  return { n, wetShare: n ? wet / n : 0, lowShare: n ? low / n : 0, drainShare: n ? drain / n : 0, rainShare: n ? rain / n : 0, rainDepthFt: rainDepthCm / 30.48, waterSamples: water, minFt };
}
