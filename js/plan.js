// Plans: what Berkeley controls (specification.md "Plans"; docs/design/levers-and-drains.md).
// A plan changes the ground, never the water. Walls and raised roads become a crest raster: for
// each cell, the elevation (cm NAVD88) the fill must exceed to wet it, -32768 where the plan does
// nothing. Tide gates close drain links (js/analyze.js).
//
// plan = { walls: [{ id, label, crestFt, lines: [[[x, y], ...], ...], widthCells }],
//          roads: [{ id, label, crestFt, names: ['UNIVERSITY AV', ...], maxX }],
//          gates: { <watershed name>: true } }
// Coordinates are grid meters (x east, y north from the grid's south-west corner).

export const NONE = -32768;

// Mark the cells a polyline passes through, `width` cells wide. Lines are stepped every half cell,
// so a wall has no gap a 4-neighbor fill could pass through.
function stamp(crest, dem, line, cm, width = 1) {
  const R = dem.resolution, W = dem.width, H = dem.height, Hm = dem.ymax - dem.ymin;
  const half = (width - 1) >> 1;
  const put = (x, y) => {
    const c0 = Math.floor(x / R), r0 = Math.floor((Hm - y) / R);
    for (let dr = -half; dr <= half; dr++) for (let dc = -half; dc <= half; dc++) {
      const r = r0 + dr, c = c0 + dc;
      if (r < 0 || c < 0 || r >= H || c >= W) continue;
      const i = r * W + c; if (crest[i] < cm) crest[i] = cm;
    }
  };
  for (let k = 1; k < line.length; k++) {
    const [x0, y0] = line[k - 1], [x1, y1] = line[k];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (R / 2)));
    for (let t = 0; t <= n; t++) put(x0 + (x1 - x0) * t / n, y0 + (y1 - y0) * t / n);
  }
}

// Build the crest raster for a plan (null when the plan raises nothing).
export function crestFor(D, plan) {
  if (!plan || (!(plan.walls || []).length && !(plan.roads || []).length)) return null;
  const crest = new Int16Array(D.dem.width * D.dem.height).fill(NONE);
  for (const w of plan.walls || []) for (const line of w.lines) stamp(crest, D.dem, line, Math.round(w.crestFt * 30.48), w.widthCells || 1);
  for (const rd of plan.roads || []) {
    const names = new Set(rd.names);
    for (const e of D.streets.edges) {
      if (!names.has(e.name)) continue;
      if (rd.maxX != null && e.geom.every(([x]) => x > rd.maxX)) continue;
      stamp(crest, D.dem, e.geom, Math.round(rd.crestFt * 30.48), 3);
    }
  }
  return crest;
}

// Which streets a plan raises, and to what crest: { edgeId: crestFt }.
export function raisedEdges(D, plan) {
  const out = {};
  for (const rd of (plan && plan.roads) || []) {
    const names = new Set(rd.names);
    for (const e of D.streets.edges) if (names.has(e.name) && !(rd.maxX != null && e.geom.every(([x]) => x > rd.maxX))) out[e.id] = Math.max(out[e.id] ?? -Infinity, rd.crestFt);
  }
  return out;
}
