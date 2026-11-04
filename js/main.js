// Berkeley Bay Flood Explorer: page logic. Loads the data files, runs the connected fill for the
// chosen level and plan (js/analyze.js), and draws the map and results.
import { analyze, FLANKED, DRAIN, RAIN } from './analyze.js';
import { WET, LOW } from './fill.js';
import { exposure, groundText } from './exposure.js';
import { encodeView, decodeView, wallFits, MAX_WALL_POINTS, MAX_WALLS } from './share.js';
import { initGuided } from './guided.js';

const $ = (id) => document.getElementById(id);
const fmt = (x, d = 0) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isWet = (v) => v === WET || v === FLANKED;

// Reference levels for the "how high is this" line, ft NAVD88 (SOURCE_NOTES W2, W11, W14, C6).
const REFS = [
  { ft: 6.2, text: 'the average daily high tide (MHHW, 6.2)' },
  { ft: 7.42, text: "this winter's highest predicted tide (7.42, Dec 24)" },
  { ft: 8.47, text: 'the 10-year storm tide (8.47)' },
  { ft: 8.65, text: 'the highest level observed at Richmond (8.65, 1998)' },
  { ft: 9.73, text: 'the 100-year storm tide (9.73)' },
  { ft: 10.91, text: 'the 500-year storm tide (10.91)' },
  { ft: 13.35, text: 'the modeled surface connection behind I-80 (about 13.4, this explorer; uncertain, SOURCE_NOTES C6)' },
];

async function load() {
  const j = (p) => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
  const b = (p) => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.arrayBuffer(); });
  const [dem, zbuf, streets, fac, facCells, scen, bits, art, drains, wsIds, plans, atlas, imp, tsunami, tsunamiBits, exp, siteCells, rail, thresholds] = await Promise.all([
    j('data/terrain/dem.json'), b('data/terrain/dem.i16'), j('data/streets.json'), j('data/facilities.json'),
    j('data/facility-cells.json'), j('data/scenarios.json'), b('data/terrain/berkeley.bits'),
    j('data/hazard/art.json').catch(() => null), j('data/drains.json'), b('data/hazard/watersheds.u8'), j('data/plans.json'),
    j('data/raw/noaa/atlas14-berkeley.json'), j('data/raw/nlcd/impervious-by-watershed.json'),
    j('data/hazard/tsunami.json').catch(() => null), b('data/hazard/tsunami.bits').catch(() => null),
    j('data/exposure.json'), j('data/site-cells.json'), j('data/rail.json').catch(() => null), j('data/thresholds.json'),
  ]);
  return { dem, z: new Int16Array(zbuf), streets, facilities: fac.facilities, facilityCells: facCells, scenarios: scen.scenarios,
    berkeley: new Uint8Array(bits), art, drains, watershedIds: new Uint8Array(wsIds), plans: plans.presets, atlas, impervious: imp.watersheds,
    tsunami: tsunami && tsunamiBits ? { ...tsunami, mask: new Uint8Array(tsunamiBits) } : null,
    exposure: exp, siteCells, rail, thresholds };
}

function shade(D) {
  const { dem, z } = D, W = dem.width, H = dem.height, img = new Uint8ClampedArray(W * H * 4);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const i = r * W + c, v = z[i] / 30.48; // feet
    const dzdx = (z[r * W + Math.min(W - 1, c + 1)] - z[r * W + Math.max(0, c - 1)]) / 30.48;
    const dzdy = (z[Math.min(H - 1, r + 1) * W + c] - z[Math.max(0, r - 1) * W + c]) / 30.48;
    const hs = Math.max(0, Math.min(1, 0.75 - 0.06 * dzdx + 0.06 * dzdy));
    const base = 150 + Math.min(80, v * 1.2);
    img[i * 4] = img[i * 4 + 1] = base * hs + 40; img[i * 4 + 2] = base * hs + 35; img[i * 4 + 3] = 255;
  }
  return img;
}

let D, base, canvas, ctx, grid, gctx, artMasks = {};
// Guided mode's current place on the map: { points: [[x, y]], lines: [geom], label } in grid meters.
let focusOn = null;
// Map view: device pixels per grid cell (k) and the grid's offset on the canvas. The flood raster is
// drawn once per result on an offscreen canvas the size of the grid; panning and zooming only
// repaint it and redraw streets, walls and outlines as vectors at screen resolution.
const view = { k: 1, tx: 0, ty: 0, fit: 1 };
let last = null;
// The stamp drawn on the map, so a screenshot carries its scenario and the caveat (set by render).
let stamp = null;
const SITE_URL = 'ericdf.github.io/berkeley-bay-flood-explorer';
// Landmark names drawn on the map, at screen resolution, so a newcomer can find their way.
const LANDMARKS = [['UNIVERSITY AV', 'University Ave'], ['GILMAN ST', 'Gilman St'], ['ASHBY AV', 'Ashby Ave'], ['I80 WB', 'I-80'],
  ['MARINA BL', 'Marina Blvd'], ['BOLIVAR DR', 'Bolivar Dr'], ['SAN PABLO AV', 'San Pablo Ave'], ['SPINNAKER WY', 'Spinnaker Way']];
let labels = null;
function landmarkLabels() {
  const out = [];
  for (const [name, text] of LANDMARKS) {
    const pts = D.streets.edges.filter(e => e.name === name && e.berkeley !== false).flatMap(e => e.geom);
    if (!pts.length) continue;
    const mx = pts.reduce((t, q) => t + q[0], 0) / pts.length, my = pts.reduce((t, q) => t + q[1], 0) / pts.length;
    const at = pts.reduce((b, q) => Math.hypot(q[0] - mx, q[1] - my) < Math.hypot(b[0] - mx, b[1] - my) ? q : b);
    out.push({ text, at, street: true });
  }
  D.facilities.forEach((f, k) => {
    const cells = D.facilityCells[k].cells; if (!cells.length) return;
    const W = D.dem.width, R = D.dem.resolution, Hm = D.dem.ymax - D.dem.ymin;
    let sx = 0, sy = 0; for (const i of cells) { sx += (i % W + 0.5) * R; sy += Hm - (Math.floor(i / W) + 0.5) * R; }
    out.push({ text: f.label.split(' (')[0], at: [sx / cells.length, sy / cells.length], street: false });
  });
  // Drawing order is priority: the four main streets, then the mapped places, then the rest.
  return [...out.slice(0, 4), ...out.filter(L => !L.street), ...out.slice(4).filter(L => L.street)];
}
// The plan the reader has built: preset ids, tide gates, and walls they drew.
const ui = { mode: 'guided', q: null, presets: new Set(), gates: false, drawing: false, draft: [], drawn: [], drawCrest: 12.7, rain: null,
  siteChoices: {}, floodproofFt: 13 }; // site choices: js/exposure.js

function currentPlan() {
  const plan = { walls: [], roads: [], gates: {} };
  for (const p of D.plans) if (ui.presets.has(p.id)) {
    for (const w of p.walls || []) plan.walls.push({ ...w, label: `${p.label}`, crestFt: p.crestFt });
    for (const r of p.roads || []) plan.roads.push({ ...r, label: p.label, crestFt: p.crestFt });
  }
  ui.drawn.forEach((w, k) => plan.walls.push({ id: `drawn${k}`, label: `Your wall ${k + 1} (${fmt(w.crestFt, 1)} ft)`, crestFt: w.crestFt, lines: [w.line] }));
  if (ui.gates) for (const w of D.drains.watersheds) plan.gates[w.name] = true;
  const any = plan.walls.length || plan.roads.length || ui.gates;
  return any ? plan : null;
}

function draw(res, baseRes, plan) {
  const { dem } = D, W = dem.width, H = dem.height;
  const img = new ImageData(new Uint8ClampedArray(base), W, H), p = img.data, s = res.state;
  const wet = [47, 127, 214], low = [224, 138, 30], fl = [139, 63, 184], sea = [15, 39, 71], drain = [38, 178, 160], kept = [70, 200, 90], rainc = [123, 92, 255];
  for (let i = 0; i < s.length; i++) {
    let col = D.water0[i] ? sea : s[i] === WET ? wet : s[i] === FLANKED ? fl : s[i] === LOW ? low : s[i] === DRAIN ? drain : s[i] === RAIN ? rainc : null;
    // Kept out of the Bay by the plan: under Bay water with no plan, not with this one. Ground the
    // plan keeps from the Bay but that still fills through drains or with rain keeps that color.
    if (baseRes && !D.water0[i] && isWet(baseRes.state[i]) && !isWet(s[i]) && s[i] !== DRAIN && s[i] !== RAIN) col = kept;
    if (col) { p[i * 4] = col[0]; p[i * 4 + 1] = col[1]; p[i * 4 + 2] = col[2]; }
  }
  // Published ART map: outline of its flooded area at the nearest level (sourced layer, H5).
  if ($('showArt').checked && D.art) {
    const lv = nearestArt(res.levelFt);
    const m = lv && artMasks[lv.file];
    if (m) for (let r = 1; r < H - 1; r++) for (let c = 1; c < W - 1; c++) {
      const i = r * W + c, on = (k) => (m[k >> 3] >> (k & 7)) & 1;
      if (on(i) && (!on(i - 1) || !on(i + 1) || !on(i - W) || !on(i + W))) { p[i * 4] = 255; p[i * 4 + 1] = 255; p[i * 4 + 2] = 255; }
    }
  }
  // ART's disconnected low-lying areas (sourced layer, H5, C20): the inside edge, two cells (8 m)
  // wide, in lime, at the same nearest ART level as the ART outline; the mask loads when first shown.
  const dl = $('showArtDc').checked && artDcLevel(res.levelFt), dm = dl && artDcMask(dl);
  if (dm) {
    const on = (k) => (dm[k >> 3] >> (k & 7)) & 1, B = 2;
    for (let r = B; r < H - B; r++) for (let c = B; c < W - B; c++) {
      const i = r * W + c;
      if (!on(i)) continue;
      let edge = false;
      for (let d = 1; d <= B && !edge; d++) edge = !on(i - d) || !on(i + d) || !on(i - d * W) || !on(i + d * W);
      if (edge) { p[i * 4] = 166; p[i * 4 + 1] = 255; p[i * 4 + 2] = 0; }
    }
  }
  // Published USGS CoSMoS map (sourced layer, H1): the inside edge, two cells (8 m) wide, in cyan,
  // for the sea level rise and storm the reader chose; it does not follow the level.
  const cs = cosmosChoice(), cm = $('showCosmos').checked && cs && cosmosMasks[cs.file];
  if (cm) {
    const on = (k) => (cm[k >> 3] >> (k & 7)) & 1, B = 2;
    for (let r = B; r < H - B; r++) for (let c = B; c < W - B; c++) {
      const i = r * W + c;
      if (!on(i)) continue;
      let edge = false;
      for (let d = 1; d <= B && !edge; d++) edge = !on(i - d) || !on(i + d) || !on(i - d * W) || !on(i + d * W);
      if (edge) { p[i * 4] = 0; p[i * 4 + 1] = 229; p[i * 4 + 2] = 255; }
    }
  }
  // The State's Tsunami Hazard Area (sourced layer, H6): the inside edge, four cells (16 m) wide,
  // in magenta, so it reads at the whole-map view.
  if ($('showTsunami').checked && D.tsunami) {
    const m = D.tsunami.mask, on = (k) => (m[k >> 3] >> (k & 7)) & 1, B = 4;
    for (let r = B; r < H - B; r++) for (let c = B; c < W - B; c++) {
      const i = r * W + c;
      if (!on(i)) continue;
      let edge = false;
      for (let d = 1; d <= B && !edge; d++) edge = !on(i - d) || !on(i + d) || !on(i - d * W) || !on(i + d * W);
      if (edge) { p[i * 4] = 255; p[i * 4 + 1] = 45; p[i * 4 + 2] = 200; }
    }
  }
  gctx.putImageData(img, 0, 0);
  last = { res, plan };
  paint();
}

const dpr = () => window.devicePixelRatio || 1;

function clampView() {
  const w = D.dem.width * view.k, h = D.dem.height * view.k, cw = canvas.width, ch = canvas.height;
  view.tx = w <= cw ? (cw - w) / 2 : Math.min(0, Math.max(cw - w, view.tx));
  view.ty = h <= ch ? (ch - h) / 2 : Math.min(0, Math.max(ch - h, view.ty));
}
function fitView() { view.k = view.fit; clampView(); }
// Show a place: zoom so its extent fills about a third of the map, centered on it.
function showPlace(f) {
  focusOn = f && ((f.points && f.points.length) || (f.lines && f.lines.length)) ? f : null;
  if (focusOn) {
    const pts = [...(f.points || []), ...(f.lines || []).flat()], R = D.dem.resolution, Hm = D.dem.ymax - D.dem.ymin;
    const xs = pts.map(q => q[0] / R), ys = pts.map(q => (Hm - q[1]) / R);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const span = Math.max(x1 - x0, y1 - y0, 150); // at least 600 m across
    view.k = Math.max(view.fit, Math.min(view.fit * 24, Math.min(canvas.width, canvas.height) / (span * 3)));
    view.tx = canvas.width / 2 - (x0 + x1) / 2 * view.k; view.ty = canvas.height / 2 - (y0 + y1) / 2 * view.k; clampView();
  } else fitView();
  paint();
}
function sizeCanvas() {
  const r = canvas.getBoundingClientRect(), wasFit = Math.abs(view.k - view.fit) < 1e-9;
  canvas.width = Math.max(1, Math.round(r.width * dpr())); canvas.height = Math.max(1, Math.round(r.height * dpr()));
  view.fit = Math.min(canvas.width / D.dem.width, canvas.height / D.dem.height);
  if (wasFit || view.k < view.fit) fitView(); else clampView();
}
// Zoom by factor f about canvas point (sx, sy), in device pixels. From the whole map to 24 times it.
function zoomAt(f, sx = canvas.width / 2, sy = canvas.height / 2) {
  const k = Math.max(view.fit, Math.min(view.fit * 24, view.k * f));
  const gx = (sx - view.tx) / view.k, gy = (sy - view.ty) / view.k;
  view.k = k; view.tx = sx - gx * k; view.ty = sy - gy * k; clampView(); paint();
}
// Canvas point (device pixels) to grid meters, the coordinates the data use.
function toMeters(sx, sy) {
  const dem = D.dem, gx = (sx - view.tx) / view.k, gy = (sy - view.ty) / view.k;
  return [Math.round(gx * dem.resolution), Math.round((dem.ymax - dem.ymin) - gy * dem.resolution)];
}

function paint() {
  if (!last) return;
  const { plan } = last, res = last.res, dem = D.dem, u = dpr() / view.k; // u: one CSS pixel in grid cells
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0f2747'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(view.k, 0, 0, view.k, view.tx, view.ty);
  ctx.imageSmoothingEnabled = view.k < 2; // zoomed in, each 4 m cell shows as a square
  ctx.drawImage(grid, 0, 0);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, dem.width, dem.height); ctx.clip(); // vectors stop at the terrain's edge
  const toPx = ([x, y]) => [x / dem.resolution, (dem.ymax - dem.ymin - y) / dem.resolution];
  const path = (pts) => { ctx.beginPath(); pts.forEach((q, k) => { const [x, y] = toPx(q); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const e of D.streets.edges) { path(e.geom); ctx.strokeStyle = e.freeway ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.28)'; ctx.lineWidth = (e.freeway ? 2.5 : 1.2) * u; ctx.stroke(); }
  // The rail main line: a dark line with white ties; flooded segments in the street colors.
  if (D.rail) {
    for (const e of D.rail.edges) { path(e.geom); ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 2.6 * u; ctx.stroke(); }
    ctx.setLineDash([2 * u, 6 * u]);
    for (const e of D.rail.edges) { path(e.geom); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4.5 * u; ctx.stroke(); }
    ctx.setLineDash([]);
    for (const sg of res.railSegs || []) { path(sg.e.geom); ctx.strokeStyle = sg.cls === 'wet' ? '#d22' : sg.cls === 'rain' ? '#5a3fd6' : '#0e8f7e'; ctx.lineWidth = 3.5 * u; ctx.stroke(); }
  }
  for (const sg of res.segs) { path(sg.e.geom); ctx.strokeStyle = sg.cls === 'wet' ? '#d22' : sg.cls === 'rain' ? '#5a3fd6' : sg.cls === 'drain' ? '#0e8f7e' : '#f0a020'; ctx.lineWidth = 3.5 * u; ctx.stroke(); }
  for (const f of D.facilityCells) for (const poly of f.outline) { path(poly[0]); ctx.closePath(); ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 2 * u; ctx.stroke(); }
  // The plan: walls and raised roads in black over white, so they read on any color.
  if (plan) {
    const lines = [...plan.walls.flatMap(w => w.lines)];
    for (const rd of plan.roads) { const names = new Set(rd.names); for (const e of D.streets.edges) if (names.has(e.name) && !(rd.maxX != null && e.geom.every(([x]) => x > rd.maxX))) lines.push(e.geom); }
    for (const l of lines) { path(l); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6 * u; ctx.stroke(); path(l); ctx.strokeStyle = '#111'; ctx.lineWidth = 3.5 * u; ctx.stroke(); }
    if (plan.gates && Object.keys(plan.gates).length) for (const w of D.drains.watersheds) if (w.link && plan.gates[w.name]) {
      const [x, y] = toPx(w.outfall); ctx.fillStyle = '#111'; ctx.fillRect(x - 7 * u, y - 7 * u, 14 * u, 14 * u); ctx.fillStyle = '#fff'; ctx.fillRect(x - 4 * u, y - 4 * u, 8 * u, 8 * u);
    }
  }
  // Guided mode's place: its lines and points in a bright ring, so the reader can find it.
  if (focusOn) {
    for (const l of focusOn.lines || []) { path(l); ctx.strokeStyle = '#fff'; ctx.lineWidth = 9 * u; ctx.stroke(); path(l); ctx.strokeStyle = '#ff2d7a'; ctx.lineWidth = 5 * u; ctx.stroke(); }
    for (const q of focusOn.points || []) { const [x, y] = toPx(q); ctx.beginPath(); ctx.arc(x, y, 11 * u, 0, 2 * Math.PI); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6 * u; ctx.stroke(); ctx.strokeStyle = '#ff2d7a'; ctx.lineWidth = 3.5 * u; ctx.stroke(); }
  }
  if (ui.draft.length) { path(ui.draft); ctx.setLineDash([10 * u, 6 * u]); ctx.strokeStyle = '#ff2d7a'; ctx.lineWidth = 4 * u; ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
  // Landmark names and the stamp, in screen pixels.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const dd = dpr();
  labels = labels || landmarkLabels();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  // In list order; a label that would overlap one already drawn is skipped (zoom in to see it).
  const boxes = [];
  for (const L of labels) {
    const [gx, gy] = toPx(L.at), x = view.tx + gx * view.k, y = view.ty + gy * view.k;
    if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) continue;
    ctx.font = `${L.street ? '' : 'italic '}600 ${12 * dd}px system-ui, sans-serif`;
    const w = ctx.measureText(L.text).width + 6 * dd, h = 16 * dd, bx = [x - w / 2, y - h / 2, w, h];
    if (boxes.some(o => bx[0] < o[0] + o[2] && o[0] < bx[0] + bx[2] && bx[1] < o[1] + o[3] && o[1] < bx[1] + bx[3])) continue;
    boxes.push(bx);
    ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.lineWidth = 3 * dd; ctx.strokeText(L.text, x, y);
    ctx.fillStyle = L.street ? '#fff' : '#ffe14d'; ctx.fillText(L.text, x, y);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  if (stamp) {
    // Shrink to a floor of 10 CSS px, then wrap each line by words to the map's width, so the
    // level, datum and caveats are never clipped from a screenshot.
    const pad = 8 * dd, maxW = canvas.width - 2 * 10 * dd - 2 * pad;
    const fontOf = (k, fs) => `${k ? '' : '600 '}${k ? fs * 0.9 : fs}px system-ui, sans-serif`;
    let fs = 13 * dd;
    const widest = () => Math.max(...stamp.map((t, k) => { ctx.font = fontOf(k, fs); return ctx.measureText(t).width; }));
    while (fs > 10 * dd && widest() > maxW) fs -= dd;
    const rows = []; // [text, line index]
    stamp.forEach((t, k) => {
      ctx.font = fontOf(k, fs); let cur = '';
      for (const w of t.split(' ')) { const next = cur ? `${cur} ${w}` : w; if (cur && ctx.measureText(next).width > maxW) { rows.push([cur, k]); cur = w; } else cur = next; }
      if (cur) rows.push([cur, k]);
    });
    const bw = Math.min(maxW, Math.max(...rows.map(([t, k]) => { ctx.font = fontOf(k, fs); return ctx.measureText(t).width; }))) + 2 * pad;
    const lh = fs * 1.35, bh = rows.length * lh + pad * 1.2, bx = 10 * dd, by = Math.max(0, canvas.height - 10 * dd - bh);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(bx, by, bw, bh);
    rows.forEach(([t, k], n) => { ctx.font = fontOf(k, fs); ctx.fillStyle = k > 0 && k < stamp.length - 1 ? '#a0300a' : '#111'; ctx.fillText(t, bx + pad, by + pad * 0.6 + lh * (n + 0.75)); });
  }
  // Scale bar, top left: the longest round length that fits in about 120 CSS pixels.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const mPerPx = dem.resolution / view.k, d = dpr();
  const len = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000].filter(m => m / mPerPx <= 120 * d).pop() || 10;
  const px = len / mPerPx, x0 = 14 * d, y0 = 30 * d;
  const label = len >= 1000 ? `${len / 1000} km` : `${len} m`;
  ctx.font = `${12 * d}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(x0 - 6 * d, y0 - 22 * d, px + 12 * d + ctx.measureText(label).width + 8 * d, 30 * d);
  ctx.fillStyle = '#111'; ctx.fillRect(x0, y0 - 4 * d, px, 4 * d); ctx.fillRect(x0, y0 - 10 * d, 2 * d, 10 * d); ctx.fillRect(x0 + px - 2 * d, y0 - 10 * d, 2 * d, 10 * d);
  ctx.fillText(label, x0 + px + 8 * d, y0);
}

// Pan and zoom: wheel, drag, pinch, double-click, the buttons, and keys when the map has focus.
// A press that moves less than 5 CSS pixels is a click: it adds a wall point while drawing.
function mapControls() {
  const pts = new Map(); let moved = 0, pinch = null;
  const at = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * dpr(), (e.clientY - r.top) * dpr()]; };
  canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, at(e)); moved = 0; pinch = null; });
  canvas.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    const p = at(e), q = pts.get(e.pointerId);
    if (pts.size === 1) {
      moved += Math.hypot(p[0] - q[0], p[1] - q[1]) / dpr();
      if (moved >= 5) { canvas.classList.add('dragging'); view.tx += p[0] - q[0]; view.ty += p[1] - q[1]; clampView(); paint(); }
      pts.set(e.pointerId, p);
    } else if (pts.size === 2) {
      pts.set(e.pointerId, p); moved = 99;
      const [a, b] = [...pts.values()], dist = Math.hypot(a[0] - b[0], a[1] - b[1]), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (pinch) { view.tx += mid[0] - pinch.mid[0]; view.ty += mid[1] - pinch.mid[1]; zoomAt(dist / pinch.dist, mid[0], mid[1]); }
      pinch = { dist, mid };
    }
  });
  const up = (e) => {
    if (!pts.has(e.pointerId)) return;
    const single = pts.size === 1; pts.delete(e.pointerId); pinch = null; canvas.classList.remove('dragging');
    if (single && moved < 5 && ui.drawing) {
      // Only points on the terrain grid, the same rule a shared link applies (js/share.js), so a
      // wall drawn here comes back whole from its link (Codex review, PR #11).
      const pt = toMeters(...at(e)), widthM = D.dem.width * D.dem.resolution, heightM = D.dem.ymax - D.dem.ymin;
      if (wallFits({ line: [pt, pt] }, widthM, heightM) && ui.draft.length < MAX_WALL_POINTS) { ui.draft.push(pt); paint(); }
      else $('drawNote').textContent = ui.draft.length >= MAX_WALL_POINTS ? `A wall has at most ${MAX_WALL_POINTS} points; click "Finish wall".` : 'That point is outside the map\'s terrain; click inside it.';
    }
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = at(e); zoomAt(Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0015)), x, y); }, { passive: false });
  canvas.addEventListener('dblclick', (e) => { if (!ui.drawing) { const [x, y] = at(e); zoomAt(2, x, y); } });
  $('zoomIn').addEventListener('click', () => zoomAt(1.6));
  $('zoomOut').addEventListener('click', () => zoomAt(1 / 1.6));
  $('zoomFit').addEventListener('click', () => { fitView(); paint(); });
  $('mapwrap').addEventListener('keydown', (e) => {
    const step = 0.15 * Math.min(canvas.width, canvas.height);
    const k = { '+': () => zoomAt(1.6), '=': () => zoomAt(1.6), '-': () => zoomAt(1 / 1.6), '0': () => { fitView(); paint(); },
      ArrowLeft: () => { view.tx += step; clampView(); paint(); }, ArrowRight: () => { view.tx -= step; clampView(); paint(); },
      ArrowUp: () => { view.ty += step; clampView(); paint(); }, ArrowDown: () => { view.ty -= step; clampView(); paint(); } }[e.key];
    if (k && e.target === $('mapwrap')) { e.preventDefault(); k(); }
  });
  new ResizeObserver(() => { sizeCanvas(); paint(); }).observe(canvas);
}

// Share of a place's cells inside the State's Tsunami Hazard Area (H6); the area does not depend on the level.
const tsunamiShares = [];
function tsunamiShare(k) {
  if (tsunamiShares[k] == null) { const m = D.tsunami.mask, c = D.facilityCells[k].cells; tsunamiShares[k] = c.length ? c.filter(i => (m[i >> 3] >> (i & 7)) & 1).length / c.length : 0; }
  return tsunamiShares[k];
}

// USGS CoSMoS scenarios (data/hazard/cosmos.json, H1): the one chosen with the two selects, and its
// mask, fetched when first shown.
const cosmosMasks = {};
function cosmosChoice() {
  if (!D.cosmos) return null;
  return D.cosmos.scenarios.find(s => String(s.slrM) === $('cosmosSlr').value && s.storm === $('cosmosStorm').value) || null;
}
async function loadCosmosMask() {
  const s = cosmosChoice();
  if (s && $('showCosmos').checked && !cosmosMasks[s.file]) cosmosMasks[s.file] = new Uint8Array(await fetch(`data/hazard/${s.file}`).then(r => { if (!r.ok) throw new Error(s.file); return r.arrayBuffer(); }));
}
function cosmosText(s) {
  const ws = s.waterSurface ? `; CoSMoS's water surface over the Bay off Berkeley is ${fmt(s.waterSurface.medianFt, 1)} ft NAVD88 (median; a modeled total water level, not still water)` : '';
  return `CoSMoS: ${s.label}, ${fmt(s.cosmosHa, 1)} ha of Berkeley land flooded${ws}. This explorer's still-water fill matches its extent best at ${fmt(s.bestMatch.levelFt, 2)} ft NAVD88${s.bestMatch.levelFt > +document.getElementById('level').max ? ', above the level slider\'s range' : ''} (${fmt(100 * s.bestMatch.agreement)}% agreement; derived, SOURCE_NOTES C21). A best match is a comparison, neither validation nor an equivalent scenario: see "Why these maps disagree".`;
}

function nearestArt(levelFt) {
  if (!D.art) return null;
  let best = null;
  for (const l of D.art.levels) if (!best || Math.abs(l.levelFt - levelFt) < Math.abs(best.levelFt - levelFt)) best = l;
  return best;
}

// ART's disconnected low-lying areas (H5, C20), data/hazard/art-dc.json: the level the ART outline
// uses (same inches), or the nearest one listed if that level is missing. Masks load when first drawn;
// draw() asks for one, and the page redraws when it arrives (onArtDcLoad, set at start).
const artDcMasks = {}, artDcPending = new Set();
let onArtDcLoad = () => {};
function artDcLevel(levelFt) {
  if (!D.artDc) return null;
  const a = nearestArt(levelFt), same = a && D.artDc.levels.find(l => l.inches === a.inches);
  if (same) return same;
  let best = null;
  for (const l of D.artDc.levels) if (!best || Math.abs(l.levelFt - levelFt) < Math.abs(best.levelFt - levelFt)) best = l;
  return best;
}
function artDcMask(l) {
  if (artDcMasks[l.file]) return artDcMasks[l.file];
  if (!artDcPending.has(l.file)) {
    artDcPending.add(l.file);
    fetch(`data/hazard/${l.file}`).then(r => { if (!r.ok) throw new Error(l.file); return r.arrayBuffer(); })
      .then(b => { artDcMasks[l.file] = new Uint8Array(b); artDcPending.delete(l.file); onArtDcLoad(true); })
      .catch(() => { artDcPending.delete(l.file); onArtDcLoad(false); });
  }
  return null;
}

// One plain sentence for a level: its height above an ordinary high tide and against the record.
function plain(lv) {
  const half = (x) => { const r = Math.round(x * 2) / 2, w = Math.floor(r); return `${w || ''}${r - w ? '½' : ''}`.replace(/^$/, '0'); };
  const d = lv - 6.2, rec = lv - 8.65;
  if (Math.abs(d) < 0.25) return 'About the height of an ordinary high tide, reached almost every day.';
  const a = d > 0 ? `About ${half(d)} ft above an ordinary high tide` : `About ${half(-d)} ft below an ordinary high tide`;
  const b = Math.abs(rec) < 0.25 ? ', about the highest tide on record nearby (Richmond, 1998)' : rec > 0 ? `, and ${half(rec)} ft above the highest tide on record nearby (Richmond, 1998)` : '';
  return `${a}${b}.`;
}

function context(lv) {
  // A reference within 0.06 ft of the level is the level itself (the I-80 connection, shown as about 13.4).
  const near = (r) => Math.abs(r.ft - lv) < 0.06;
  const below = REFS.filter(r => r.ft <= lv + 1e-6 && !near(r)).pop(), above = REFS.find(r => r.ft > lv + 1e-6 && !near(r));
  const parts = [];
  if (below) parts.push(`${fmt(lv - below.ft, 2)} ft above ${below.text}`);
  if (above) parts.push(`${fmt(above.ft - lv, 2)} ft below ${above.text}`);
  return parts.join('; ');
}

// Rain pools smaller than this show no surface level (an outside review, 2026-11-03: 18-21 ft NAVD88 on under 1 ha).
const MIN_POOL_HA = 1;
const title = (n) => n.replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase());

// The view in the URL (js/share.js): written on every render, read once at load.
const OVERLAYS = { art: 'showArt', artdc: 'showArtDc', tsunami: 'showTsunami' };
let lastHash = null;
function writeView(levelFt, sc) {
  const h = encodeView({ sc: sc ? sc.id : null, lv: levelFt, presets: [...ui.presets], gates: ui.gates, rain: ui.rain,
    walls: ui.drawn, sites: ui.siteChoices, floodproofFt: ui.floodproofFt,
    show: Object.entries(OVERLAYS).filter(([, id]) => $(id).checked).map(([k]) => k),
    cosmos: $('showCosmos').checked ? { slr: $('cosmosSlr').value, storm: $('cosmosStorm').value } : null,
    mode: ui.mode, q: ui.mode === 'guided' ? ui.q : null });
  lastHash = h ? `#${h}` : '';
  if (location.hash !== lastHash) history.replaceState(null, '', `${location.pathname}${location.search}${lastHash}`);
}
// Sets a control from a link only to a value the page offers; returns whether it did.
const setSelect = (el, v) => { if (!el || ![...el.options].some(o => o.value === String(v))) return false; el.value = String(v); return true; };
function applyView(v) {
  for (const id of v.presets) { const el = document.querySelector(`input[data-preset="${CSS.escape(id)}"]`); if (el) { el.checked = true; ui.presets.add(id); } }
  if (v.gates) { $('gates').checked = true; ui.gates = true; }
  if (v.rain && setSelect($('rainAri'), v.rain.ari) && setSelect($('rainDur'), v.rain.duration) && setSelect($('rainBlocked'), v.rain.blocked)) {
    $('rainOn').checked = true;
    ui.rain = { ari: $('rainAri').value, duration: $('rainDur').value, blocked: Number($('rainBlocked').value) };
    $('rainNote').textContent = `${D.atlas.depthIn[ui.rain.duration][ui.rain.ari]} in of rain (NOAA Atlas 14, SOURCE_NOTES R1).`;
  }
  const widthM = D.dem.width * D.dem.resolution, heightM = D.dem.ymax - D.dem.ymin;
  for (const w of v.walls.slice(0, MAX_WALLS)) if (w.crestFt >= 6 && w.crestFt <= 20 && wallFits(w, widthM, heightM)) ui.drawn.push(w);
  if (ui.drawn.length) $('drawNote').textContent = `${ui.drawn.length} wall(s) drawn.`;
  for (const [id, c] of Object.entries(v.sites)) if (setSelect(document.querySelector(`select[data-site="${CSS.escape(id)}"]`), c)) ui.siteChoices[id] = c;
  if (v.floodproofFt != null && v.floodproofFt >= 8 && v.floodproofFt <= 20 && $('floodproofFt')) { ui.floodproofFt = v.floodproofFt; $('floodproofFt').value = v.floodproofFt; }
  for (const k of v.show) if (Object.hasOwn(OVERLAYS, k) && !$(OVERLAYS[k]).disabled) $(OVERLAYS[k]).checked = true;
  if (v.cosmos && !$('showCosmos').disabled && setSelect($('cosmosSlr'), v.cosmos.slr) && setSelect($('cosmosStorm'), v.cosmos.storm)) $('showCosmos').checked = true;
}

// The map key: only what this view draws.
function legend(res, plan) {
  const sw = (c, extra = '') => `<span class="sw" style="background:${c};${extra}"></span>`;
  const cls = new Set([...res.segs.map(s => s.cls), ...(res.railSegs || []).map(s => s.cls)]);
  const rows = [
    [true, sw('#0f2747', 'outline:1px solid #fff'), 'Open Bay'],
    [true, sw('var(--wet)'), 'Under Bay water'],
    [res.flankedHa > 0, sw('var(--flank)'), 'Under Bay water that came through Albany or Emeryville'],
    [res.drainLandHa > 0, sw('#26b2a0'), 'Can fill up the storm drains'],
    [res.rainLandHa > 0, sw('#7b5cff'), 'Pooled rain that cannot drain'],
    [res.lowLandHa > 0, sw('var(--low)'), 'Below the water, cut off from it'],
    [!!plan, sw('#46c85a'), 'Kept dry by the defenses'],
    [!!plan, sw('#111', 'outline:2px solid #fff'), 'Wall or raised road'],
    [cls.has('wet'), sw('#d22'), 'Street or track under water'],
    [cls.has('drain'), sw('#0e8f7e'), 'Street or track flooded up the drains'],
    [cls.has('rain'), sw('#5a3fd6'), 'Street or track under pooled rain'],
    [cls.has('low'), sw('#f0a020'), 'Street on low ground, cut off'],
    [!!D.rail, sw('#2b2118', 'outline:1px dashed #fff'), 'Rail line'],
    [true, sw('transparent', 'outline:2px solid #ffe14d'), 'Mapped places'],
    [!!focusOn, sw('transparent', 'outline:3px solid #ff2d7a;border-radius:50%'), focusOn ? esc(focusOn.label || 'The place in the answer') : ''],
    [$('showArt').checked, sw('transparent', 'outline:2px solid #fff'), 'ART map outline'],
    [$('showArtDc').checked, sw('#a6ff00'), 'ART ground cut off from the Bay'],
    [$('showCosmos').checked, sw('#00e5ff'), 'CoSMoS map outline'],
    [$('showTsunami').checked, sw('#ff2dc8'), 'State tsunami hazard area'],
  ];
  $('legendBody').innerHTML = rows.filter(r => r[0]).map(([, s, t]) => `<div>${s}${t}</div>`).join('');
}

function render(levelFt, sc) {
  writeView(levelFt, sc);
  // Guided mode's answers assume no defenses, no rain and no site choices (data/thresholds.json), so
  // the map shows exactly that; expert settings are kept and come back in expert mode (Codex, PR #14).
  const expert = ui.mode === 'expert';
  const plan = expert ? currentPlan() : null, rain = expert ? ui.rain : null;
  const res = analyze(D, levelFt, plan, rain);
  const baseRes = plan ? analyze(D, levelFt, null, rain) : null;
  const lvText = `${sc && sc.precision === 1 ? 'about ' : ''}${fmt(levelFt, sc && sc.precision != null ? sc.precision : 2)} ft NAVD88 still water`;
  const extras = [rain ? `rain experiment (${rain.ari}-year, ${rain.duration.replace('-hr', ' h')})` : '', plan ? 'with a plan the reader built' : '', expert && Object.values(ui.siteChoices).some(c => c && c !== 'none') ? 'site choices assumed' : ''].filter(Boolean);
  // The level's provenance travels with it; a qualified level carries its qualification.
  const QUAL = { ferris12: 'Read here as ft NAVD88 still water (inference): its source, datum and whether it includes waves are unconfirmed',
    spill: "A result of this explorer's terrain model, uncertain: the connection could open lower or higher",
    kingKelvin: 'A hypothetical combination with no established likelihood', y10Kelvin: 'A hypothetical combination with no established likelihood' };
  stamp = [`${sc ? sc.label : 'Level chosen with the slider'}${sc && sc.group === "At today's sea level" ? ", at today's sea level" : ''}: ${lvText} (level: ${sc ? sc.category : 'chosen'})${extras.length ? ', ' + extras.join(', ') : ''}`,
    ...(sc && QUAL[sc.id] ? [QUAL[sc.id]] : []),
    ...($('showArtDc').checked && artDcLevel(levelFt) ? [`Lime outline: ART disconnected low-lying areas, MHHW + ${artDcLevel(levelFt).inches} in; low ground not connected to the Bay, which may flood through drains or groundwater`] : []),
    ...($('showCosmos').checked && cosmosChoice() ? [`Cyan outline: USGS CoSMoS v2.1, ${cosmosChoice().label}; a published map with waves, not still water, and not tied to the level`] : []),
    'Not a flood forecast: an educational comparison on bare-earth lidar',
    `Berkeley Bay Flood Explorer · ${new Date().toISOString().slice(0, 10)} · ${SITE_URL}`];
  draw(res, baseRes, plan);
  legend(res, plan);
  $('nowLevel').textContent = `${sc ? sc.label : 'Chosen with the slider'}: ${fmt(levelFt, 2)} ft NAVD88`;
  $('nowRain').textContent = ui.rain ? `${ui.rain.ari}-year storm, ${ui.rain.duration.replace('-hr', ' hours')}` : 'Off';
  $('nowPlan').textContent = currentPlan() ? [...[...ui.presets].map(id => (D.plans.find(p => p.id === id) || {}).label), ui.gates ? 'tide gates' : '', ui.drawn.length ? `${ui.drawn.length} wall(s) you drew` : ''].filter(Boolean).join('; ') : 'None';
  const shown = [['showArt', 'ART'], ['showArtDc', 'ART cut-off ground'], ['showCosmos', 'CoSMoS'], ['showTsunami', 'tsunami area']].filter(([id]) => $(id).checked).map(([, t]) => t);
  $('nowMaps').textContent = shown.length ? shown.join(', ') : 'None shown';
  const nChoices = Object.values(ui.siteChoices).filter(c => c && c !== 'none').length;
  $('nowSites').textContent = nChoices ? `${nChoices} site choice(s)` : 'No changes';
  const bStreets = res.streets.filter(s => s.berkeley), oStreets = res.streets.filter(s => !s.berkeley);
  const li = (s) => `<li>${esc(title(s.name))}${s.freeway ? ' (freeway)' : s.frontage ? ' (frontage road)' : ''}: ${fmt(s.m)} m, ${s.depthFt != null ? `up to ${fmt(s.depthFt, 1)} ft of water` : `lowest ground ${fmt(s.minFt, 1)} ft NAVD88`}</li>`;
  const art = nearestArt(levelFt);
  $('artNote').textContent = D.art ? (art ? `Nearest ART level: MHHW + ${art.inches} in, about ${fmt(art.levelFt, 1)} ft NAVD88 (SOURCE_NOTES H5).` : '') : 'ART map not loaded.';
  const dl = $('showArtDc').checked && artDcLevel(levelFt);
  $('artDcNote').textContent = !D.artDc ? 'ART disconnected low-lying areas not loaded.' : dl ? `Disconnected low-lying areas at MHHW + ${dl.inches} in, about ${fmt(dl.levelFt, 1)} ft NAVD88${artDcMasks[dl.file] ? '' : ' (loading)'}.` : '';
  const cs = cosmosChoice();
  $('cosmosNote').textContent = D.cosmos ? (cs ? cosmosText(cs) : '') : 'CoSMoS map not loaded.';
  const row = (label, a, b, unit, d = 1) => `<tr><td>${label}</td><td class="n">${fmt(a, d)} ${unit}</td>${plan ? `<td class="n">${fmt(b, d)} ${unit}</td>` : ''}</tr>`;
  const B = baseRes || res;
  const drainWs = Object.entries(res.drainHa).filter(([, v]) => v >= 0.05).map(([k, v]) => `${esc(k)} ${fmt(v, 1)} ha`).join(', ');
  $('exposed').innerHTML = exposedPanel(levelFt, res, B, plan);
  $('results').innerHTML = `
    <h2>${sc ? esc(sc.label) : 'Chosen level'}</h2>
    <div class="big">${sc && sc.precision === 1 ? 'about ' : ''}${fmt(levelFt, sc && sc.precision != null ? sc.precision : 2)} ft NAVD88 <span class="cat">level: ${sc ? esc(sc.category) : 'chosen'}</span></div>
    <p>${esc(plain(levelFt))}</p>
    <details><summary>Where this level comes from</summary><p class="src">${sc ? esc(sc.source) : 'A level chosen with the slider.'}</p><p class="src">${esc(context(levelFt))}.</p></details>
    ${sc && sc.category === 'sensitivity' ? `<p class="warn">A sensitivity test: a hypothetical combination of two sourced figures, with no established likelihood.${sc.id === 'y10Kelvin' ? ' Part of the El Niño rise is already in the storm-tide statistics (SOURCE_NOTES W16).' : ''}</p>` : ''}
    ${sc && sc.id === 'spill' ? '<p class="warn">A result of this explorer\'s terrain model, not a protective threshold: the connection could open lower or higher. ART\'s published maps come in steps: at MHHW + 84 in (13.20 ft NAVD88) they show the transfer station as disconnected low-lying ground (41% of the site), with no flooding connected to the Bay there; at + 96 in (14.20 ft NAVD88) they flood 56% of it from the Bay (SOURCE_NOTES C6, C20). The connection lies somewhere between those two maps; they do not establish the level at which it opens.</p>' : ''}
    ${sc && sc.id === 'ferris12' ? '<p class="warn">This figure is shown by the project owner\'s decision; who said it is in the source line above. Its source, datum and whether it includes waves are unconfirmed; it is read here as a still-water level of 12 ft NAVD88. FEMA\'s flood elevations on the wave-exposed Marina shoreline, which include waves, are 12 to 14 ft NAVD88; this map shows still water only.</p>' : ''}
    <p class="src"><span class="cat">derived</span> Below: what this explorer's model reaches at this level, calculated here and not published (a connected fill on lidar; see Method at the end). Not a flood forecast.</p>
    ${plan ? `<p class="warn">Comparing <b>no plan</b> with <b>your plan</b> at the same level. Green on the map is ground the plan keeps dry. ${res.overtopped.length ? `Overtopped at this level: ${res.overtopped.map(esc).join('; ')}.` : 'Nothing in the plan is overtopped at this level; water can still go around the ends of a wall.'}</p>` : ''}
    <p class="src">Polluted sites, critical services and what current plans leave out: the "What's exposed" tab.</p>
    <h2>In Berkeley <span class="cat">derived</span></h2>
    <table>
      ${plan ? '<tr><th></th><th class="n">No plan</th><th class="n">Your plan</th></tr>' : ''}
      ${row('Ground under water (connected to the Bay)', B.wetLandHa, res.wetLandHa, 'ha')}
      ${row('&nbsp;&nbsp;of which reached only through Albany or Emeryville land', B.flankedHa, res.flankedHa, 'ha')}
      ${rain ? row('Ground under pooled rain', B.rainLandHa, res.rainLandHa, 'ha') : ''}
      ${row('Low ground that can fill through the storm drains', B.drainLandHa, res.drainLandHa, 'ha')}
      ${row('Low ground not connected, even through drains', B.lowLandHa, res.lowLandHa, 'ha')}
      ${row('Streets under water', B.wetStreetM / 1000, res.wetStreetM / 1000, 'km', 2)}
      ${rain ? row('Streets under pooled rain', B.rainStreetM / 1000, res.rainStreetM / 1000, 'km', 2) : ''}
      ${row('Streets that can flood through drains', B.drainStreetM / 1000, res.drainStreetM / 1000, 'km', 2)}
      ${row('Streets on low ground, not connected', B.lowStreetM / 1000, res.lowStreetM / 1000, 'km', 2)}
    </table>
    ${res.rain ? `<h2>Rain on this tide <span class="cat">derived</span></h2>
    <p class="src">${fmt(res.rain.depthIn, 2)} in of rain (NOAA Atlas 14, ${esc(rain.ari)}-year, ${esc(rain.duration.replace('-hr', ' hours'))}), ${fmt(100 * rain.blocked)}% of the runoff unable to drain. An illustrative storage experiment, not a flood estimate: each watershed's runoff is put in one pool at its lowest inlet, which overstates depth there and misses ponding elsewhere. The runoff share uses a method EPA describes for annual loads from areas under one square mile; most of these watersheds are larger, so it is an exploratory assumption (SOURCE_NOTES R3). How often a storm of this size coincides with this tide is not established.</p>
    <table><tr><th>Watershed</th><th class="n">Runoff share</th><th class="n">Water</th><th class="n">Pool surface, ft NAVD88</th><th class="n">Area</th></tr>
    ${res.rain.pools.map(p => `<tr><td>${esc(p.watershed)}</td><td class="n">${fmt(p.runoffShare, 2)}</td><td class="n">${fmt(p.volumeM3 / 1000)}k m³</td><td class="n">${p.areaHa >= MIN_POOL_HA ? `${fmt(p.levelFt, 1)} ft NAVD88` : 'not shown'}${p.spilledToBay ? '<br>spills to the Bay' : ''}</td><td class="n">${fmt(p.berkeleyLandHa, 1)} ha</td></tr>`).join('')}</table><p class="src">Area: Berkeley land under the pool, not counting the Aquatic Park lagoon. A pool surface is shown only where the pool covers at least ${MIN_POOL_HA} ha: on less ground, often where the Bay already covers the inlet and the runoff spills into it, one pool at one inlet says nothing useful about a water level.</p>` : ''}
    ${plan && ui.gates ? `<p class="warn">Assumed: a working tide gate on every outfall, so no Bay water comes up the drains. Which outfalls have gates is not published. A shut gate also holds in the rain that falls while it is shut${rain ? ': the pools above show it.' : '; add a rainstorm above to see where it collects.'}</p>` : ''}
    ${drainWs ? `<p class="src">Through the drains, by City watershed: ${drainWs}. ${plan && ui.gates ? '' : 'This assumes every outfall is open, with no working tide gate. Which outfalls have gates, and whether they work, is not published.'}</p>` : ''}
    <h2>Places <span class="cat">derived</span></h2>
    <p class="src">Shares are of each mapped site's ground, not of its buildings: whether water reaches floors, entrances or equipment needs separate evidence (the City study's floor elevations for the DoubleTree are one, SOURCE_NOTES W7).</p>
    <table>${res.facilities.map((f, k) => `<tr><td><b>${esc(f.label)}</b>${f.note ? `<details><summary>About</summary>${esc(f.note)}</details>` : ''}</td><td class="n">${fmt(100 * f.wetShare)}% under water${plan ? ` (no plan ${fmt(100 * B.facilities[k].wetShare)}%)` : ''}<br>${rain ? `${fmt(100 * f.rainShare)}% under pooled rain<br>` : ''}${fmt(100 * f.drainShare)}% through drains<br>${fmt(100 * f.lowShare)}% low<br>median ground ${fmt(f.medianGroundFt, 1)} ft NAVD88${D.tsunami ? `<br>${fmt(100 * tsunamiShare(k))}% in the State tsunami hazard area` : ''}</td></tr>`).join('')}</table>
    <h2>Berkeley streets <span class="cat">derived</span></h2>
    <details><summary>${bStreets.length} street segments reached or on low ground${oStreets.length ? `; ${oStreets.length} outside Berkeley` : ''}</summary>
    ${bStreets.filter(s => s.cls === 'wet').length ? `<p class="src">Under water:</p><ul>${bStreets.filter(s => s.cls === 'wet').map(li).join('')}</ul>` : '<p class="src">No Berkeley street segment is under water at this level.</p>'}
    ${bStreets.filter(s => s.cls === 'rain').length ? `<p class="src">Under pooled rain:</p><ul>${bStreets.filter(s => s.cls === 'rain').map(li).join('')}</ul>` : ''}
    ${bStreets.filter(s => s.cls === 'drain').length ? `<p class="src">On low ground that can fill through the storm drains:</p><ul>${bStreets.filter(s => s.cls === 'drain').map(li).join('')}</ul>` : ''}
    ${bStreets.filter(s => s.cls === 'low').length ? `<p class="src">On low ground, not connected (rain decides these):</p><ul>${bStreets.filter(s => s.cls === 'low').map(li).join('')}</ul>` : ''}
    ${oStreets.length ? `<h2>Outside Berkeley <span class="cat">derived</span></h2><ul>${oStreets.map(s => li(s).replace('</li>', s.cls === 'wet' ? '</li>' : s.cls === 'drain' ? ' (through drains)</li>' : s.cls === 'rain' ? ' (pooled rain)</li>' : ' (low, not connected)</li>')).join('')}</ul>` : ''}
    </details>
    ${res.overWater.length ? `<p class="src">Not counted: ${[...new Set(res.overWater.map(s => esc(s.e.name)))].join(', ')}, whose mapped line crosses water in the terrain (a bridge, or a street drawn across water).</p>` : ''}
    <h2>What this cannot tell you</h2>
    <details open><summary>Limits of the map</summary><ul>
      <li>Still water only. Waves add height on the exposed Marina shoreline (FEMA VE zones, 12 to 14 ft NAVD88).</li>
      <li>No timing or duration: a storm tide lasts hours around high tide.</li>
      <li>"Through the drains" assumes every mapped inlet in the watershed connects to an outfall without a tide gate, and that the pipes fill. The City does not publish its pipes, outfalls or tide gates.</li>
      <li>Rain, when "Add a rainstorm" is on, is an illustrative experiment: each watershed's runoff goes into one pool at its lowest inlet, with no pipe capacity, timing or overland flow, so it can overstate water in some places and miss it in others. Second St beside the transfer station floods today in a 10-year rainstorm because the Gilman St storm drain and the Codornices Creek culvert under I-80 are undersized (transfer station Draft EIR, SOURCE_NOTES F7, F8).</li>
      <li>Return periods are for the tide alone. A level that adds a rise or a rainstorm to a storm tide has no established return period.</li>
      <li>Rising groundwater is not modeled (5 to 10 ft below ground at the transfer station, F6).</li>
      <li>Walls and berms narrower than the 4 m grid may be missed; bare-earth lidar removes bridges and overpasses, so freeway results need Caltrans profiles to confirm.</li>
    </ul></details>
    <p class="src">Method: a connected fill on USGS 3DEP lidar (4 m). A cell is under water when its ground, or the crest of a wall or raised road the plan puts there, is below the level and it connects to the Bay through other such cells (model rule). Street segments count when at least a quarter of their length is wet. Sources and checks: SOURCE_NOTES.md and docs/design/levers-and-drains.md in the repository.</p>
  `;
}

// "What's exposed" (docs/design/mitigations.md, E6-E8): do nothing beside the reader's choices, by
// pollution sources, critical services and ways off the waterfront; then what current plans leave out.
const CHOICE_LABEL = { none: 'No change', floodproof: 'Flood-proof its storage', move: 'Move the operation away', exit: 'Exit: use a regional station', contain: 'Contain the contamination', remove: 'Remove the contamination' };
function exposedPanel(levelFt, res, B, plan) {
  if (!D.exposure) return '';
  const anyChoice = ui.mode === 'expert' && Object.values(ui.siteChoices).some(c => c && c !== 'none');
  const mine = !!plan || anyChoice;
  const ex0 = exposure(D, B, {}, null, null), ex1 = mine ? exposure(D, res, ui.siteChoices, ui.floodproofFt, plan) : ex0;
  const cell = (r) => {
    const parts = [];
    if (r.site.stillWaterNotApplicable) parts.push('not described by a still-water level');
    else parts.push(r.reach ? `<b>reached</b>: ${esc(r.reach.how)}, ${fmt(100 * r.reach.share)}% of its ground` : esc(groundText(r.water)));
    if (r.tsunami >= 0.25) parts.push('inside the State tsunami hazard area');
    for (const n of r.notes) parts.push(`<i>${esc(n)}</i>`);
    if ((r.reach && !r.counts) || (r.partial && !r.partlyExposed)) parts.push('no longer counted as a pollution source here');
    return parts.join('<br>');
  };
  const srow = (r0, r1) => `<tr><td><b>${esc(r0.site.name)}</b>${r0.site.verified ? '' : ' <span class="cat">not re-read</span>'}<details><summary>What it holds</summary>${esc(r0.site.holds)} (SOURCE_NOTES ${esc(r0.site.refs)})</details>${r0.site.costs ? `<details><summary>Costs on record</summary>${esc(r0.site.costs)}</details>` : ''}</td><td>${cell(r0)}</td>${mine ? `<td>${cell(r1)}</td>` : ''}</tr>`;
  const vrow = (s0, s1) => `<tr><td><b>${esc(s0.name)}</b></td><td>${esc(s0.status)}</td>${mine ? `<td>${esc(s1.status)}</td>` : ''}</tr>`;
  const head = `<tr><th></th><th>Do nothing</th>${mine ? '<th>Your choices</th>' : ''}</tr>`;
  const ways0 = ex0.services.find(s => s.wayOut), ways1 = ex1.services.find(s => s.wayOut);
  return `
    <h2>What current plans leave out</h2>
    <p class="src">From the plans, reviews and rules read for this explorer. Each names its source row in SOURCE_NOTES.md; figures this explorer derives say so.</p>
    <ul>${D.exposure.gaps.map(g => `<li><b>${esc(g.title)}.</b> ${esc(g.text)} <span class="src">(SOURCE_NOTES ${esc(g.refs)})</span></li>`).join('')}</ul>
    <h2>What's exposed <span class="cat">derived</span></h2>
    <p class="src">At this level: <b>${ex0.reachedCount}</b> of ${ex0.sites.length} listed pollution sources reached if we do nothing${mine ? `; <b>${ex1.reachedCount}</b> with your choices` : ''}, counting a site when water covers 25% or more of its ground${ex0.partialCount ? `; ${ex0.partialCount} more partially reached, under 25%, shown in the table` : ''}. The count is a screening result: it does not measure what a site would release, how toxic or how far it would travel, or what cleanup would cost, and a choice of yours counts only if the measure works. ${ex0.tsunamiCount} lie inside the State tsunami hazard area, which does not depend on the level. Measures as in SOURCE_NOTES E6: pollution sources, then critical services, with ways off the waterfront as a check. Choices are your assumptions; they change what is exposed, never the water. Not a forecast.</p>
    <table>${head}<tr><th colspan="${mine ? 3 : 2}">Pollution sources</th></tr>${ex0.sites.map((r, k) => srow(r, ex1.sites[k])).join('')}
      <tr><th colspan="${mine ? 3 : 2}">Critical services</th></tr>${ex0.services.filter(s => !s.wayOut).map((s, k) => vrow(s, ex1.services.filter(t => !t.wayOut)[k])).join('')}
      <tr><th colspan="${mine ? 3 : 2}">Ways off the waterfront (a check)</th></tr>${vrow(ways0, ways1)}</table>`;
}

function sitesPanel(rerender) {
  const box = $('sitesPanel'); if (!box || !D.exposure) return;
  box.innerHTML = `
    <p class="src">For each site, a choice of yours. Each is an assumption, shown beside the real status, and none changes the water (docs/design/mitigations.md).</p>
    <label class="row">Flood-proofed to <input id="floodproofFt" type="number" step="0.5" min="8" max="20" value="${ui.floodproofFt}" style="width:5em"> ft NAVD88</label>
    ${D.exposure.sites.map(s => `<label class="row lever"><span><b>${esc(s.name)}</b><br><select data-site="${s.id}">${['none', ...s.choices].map(c => `<option value="${c}"${(ui.siteChoices[s.id] || 'none') === c ? ' selected' : ''}>${CHOICE_LABEL[c]}</option>`).join('')}</select></span></label>`).join('')}`;
  box.addEventListener('change', (e) => {
    if (e.target.dataset.site) { ui.siteChoices[e.target.dataset.site] = e.target.value; rerender(); }
    if (e.target.id === 'floodproofFt') { ui.floodproofFt = Number(e.target.value); rerender(); }
  });
}

function planPanel(rerender) {
  const box = $('plan');
  box.innerHTML = `
    ${D.plans.map(p => `<label class="row lever"><input type="checkbox" data-preset="${p.id}"> <span><b>${esc(p.label)}</b><br><span class="src">Crest ${fmt(p.crestFt, 1)} ft NAVD88 (${esc(p.category)}). ${esc(p.cost)}. ${esc(p.source)}.</span></span></label>`).join('')}
    <label class="row lever"><input type="checkbox" id="gates"> <span><b>Assume a working tide gate on every storm drain outfall</b><br><span class="src">Compares assumed open outfalls with assumed working gates: the Bay cannot come up through the pipes (model rule). Which outfalls have gates, and whether they work, is not published. A shut gate also holds the rain in: try it with "Add a rainstorm".</span></span></label>
    <div class="lever"><b>Draw your own wall</b> <span class="src">(assumption: you choose where and how high)</span>
      <div class="row"><button id="drawBtn" type="button">Start drawing</button> <label>Crest <input id="drawCrest" type="number" step="0.1" min="6" max="20" value="${ui.drawCrest}" style="width:5em"> ft NAVD88</label></div>
      <div class="row"><button id="drawDone" type="button" disabled>Finish wall</button> <button id="drawClear" type="button">Remove my walls</button></div>
      <p class="src" id="drawNote">Click "Start drawing", then click points on the map.</p></div>`;
  box.addEventListener('change', (e) => {
    const id = e.target.dataset.preset;
    if (id) { e.target.checked ? ui.presets.add(id) : ui.presets.delete(id); rerender(); }
    if (e.target.id === 'gates') { ui.gates = e.target.checked; rerender(); }
    if (e.target.id === 'drawCrest') ui.drawCrest = Number(e.target.value);
  });
  $('drawBtn').addEventListener('click', () => { ui.drawing = true; ui.draft = []; $('drawDone').disabled = false; $('drawNote').textContent = 'Click points on the map along the wall (drag to pan, scroll to zoom); then "Finish wall".'; canvas.style.cursor = 'crosshair'; });
  $('drawDone').addEventListener('click', () => {
    // The limits a shared link applies (js/share.js, applyView): at most MAX_WALLS walls, crest 6-20 ft NAVD88.
    const full = ui.drawn.length >= MAX_WALLS;
    if (ui.draft.length >= 2 && !full) ui.drawn.push({ line: ui.draft, crestFt: Math.min(20, Math.max(6, Math.round(10 * ui.drawCrest) / 10)) });
    ui.draft = []; ui.drawing = false; $('drawDone').disabled = true; canvas.style.cursor = '';
    $('drawNote').textContent = full ? `At most ${MAX_WALLS} walls; remove some to draw more.` : `${ui.drawn.length} wall(s) drawn.`; rerender();
  });
  $('drawClear').addEventListener('click', () => { ui.drawn = []; ui.draft = []; $('drawNote').textContent = 'No walls drawn.'; rerender(); });
}

(async () => {
  // The header's height sets the map's height, and with it the width the map takes (index.html --mapw).
  new ResizeObserver(() => document.documentElement.style.setProperty('--hdr', `${$('hdr').offsetHeight}px`)).observe($('hdr'));
  if (window.innerWidth < 1000) $('legend').open = false; // on a phone the key starts closed, so the map shows
  D = await load();
  const W = D.dem.width, H = D.dem.height;
  canvas = $('map'); ctx = canvas.getContext('2d');
  grid = document.createElement('canvas'); grid.width = W; grid.height = H; gctx = grid.getContext('2d');
  sizeCanvas();
  base = shade(D);
  if (D.art) await Promise.all(D.art.levels.map(async l => { artMasks[l.file] = new Uint8Array(await fetch(`data/hazard/${l.file}`).then(r => r.arrayBuffer())); }));
  else $('showArt').disabled = true;
  // ART disconnected low-lying areas (H5, C20): the level list now, each level's mask when first drawn.
  D.artDc = await fetch('data/hazard/art-dc.json').then(r => r.ok ? r.json() : null).catch(() => null);
  if (!D.artDc) $('showArtDc').disabled = true;
  // USGS CoSMoS (H1): the scenario list now, each scenario's mask when first shown.
  D.cosmos = await fetch('data/hazard/cosmos.json').then(r => r.ok ? r.json() : null).catch(() => null);
  if (D.cosmos) {
    const STORMS = { w000: 'Background tide, no storm', w100: '100-year storm' };
    $('cosmosSlr').innerHTML = [...new Set(D.cosmos.scenarios.map(s => s.slrM))].map(m => `<option value="${m}">${fmt(m, 2)} m (${fmt(m / 0.3048, 1)} ft)</option>`).join('');
    $('cosmosStorm').innerHTML = Object.entries(STORMS).filter(([k]) => D.cosmos.scenarios.some(s => s.storm === k)).map(([k, t]) => `<option value="${k}"${k === 'w100' ? ' selected' : ''}>${t}</option>`).join('');
  } else for (const id of ['showCosmos', 'cosmosSlr', 'cosmosStorm']) $(id).disabled = true;
  analyze(D, 6); // computes D.water0 once
  const list = $('scenarios');
  // Scenarios by group (data/scenarios.json "group"), in the order the groups first appear.
  const groups = [...new Set(D.scenarios.map(s => s.group))];
  list.innerHTML = groups.map(g => `<h3 class="grp">${esc(g)}</h3>` + D.scenarios.map((s, k) => s.group !== g ? '' : `<label class="sc"><input type="radio" name="sc" value="${k}"><span class="t">${esc(s.label)}</span><span class="lv">${s.precision === 1 ? 'about ' : ''}${fmt(s.levelFt, s.precision ?? 2)}</span></label>`).join('')).join('');
  // The level shown is kept here, exactly: a scenario's level may not be a multiple of the
  // slider's step, and the slider would round it.
  let current = D.scenarios.findIndex(s => s.id === 'y100'), levelNow = null, scNow = null;
  const show = (lv, sc) => { levelNow = lv; scNow = sc; render(lv, sc); };
  const pick = (k) => { current = k; list.querySelector(`input[value="${k}"]`).checked = true; $('level').value = D.scenarios[k].levelFt; $('levelOut').textContent = fmt(D.scenarios[k].levelFt, 2); show(D.scenarios[k].levelFt, D.scenarios[k]); };
  list.addEventListener('change', (e) => pick(Number(e.target.value)));
  let pending = false;
  $('level').addEventListener('input', () => {
    $('levelOut').textContent = fmt(Number($('level').value), 2);
    list.querySelectorAll('input').forEach(i => { i.checked = false; });
    if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; show(Number($('level').value), null); }); }
  });
  $('showArt').addEventListener('change', () => render(levelNow, scNow));
  $('showArtDc').addEventListener('change', () => render(levelNow, scNow));
  onArtDcLoad = (ok) => {
    if (!ok) $('showArtDc').checked = false;
    if (levelNow != null) render(levelNow, scNow);
    if (!ok) $('artDcNote').textContent = 'ART disconnected low-lying areas not loaded.';
  };
  for (const id of ['showCosmos', 'cosmosSlr', 'cosmosStorm']) $(id).addEventListener('change', async () => {
    let failed = false;
    try { await loadCosmosMask(); } catch (e) { failed = true; $('showCosmos').checked = false; }
    render(levelNow, scNow);
    if (failed) $('cosmosNote').textContent = 'CoSMoS map not loaded.';
  });
  if (!D.tsunami) $('showTsunami').disabled = true;
  $('showTsunami').addEventListener('change', () => render(levelNow, scNow));
  planPanel(() => render(levelNow, scNow));
  sitesPanel(() => render(levelNow, scNow));
  mapControls();
  const rainUpdate = () => {
    ui.rain = $('rainOn').checked ? { ari: $('rainAri').value, duration: $('rainDur').value, blocked: Number($('rainBlocked').value) } : null;
    $('rainNote').textContent = ui.rain ? `${D.atlas.depthIn[ui.rain.duration][ui.rain.ari]} in of rain (NOAA Atlas 14, SOURCE_NOTES R1).` : '';
    render(levelNow, scNow);
  };
  for (const id of ['rainOn', 'rainAri', 'rainDur', 'rainBlocked']) $(id).addEventListener('change', rainUpdate);
  // Guided mode (js/guided.js) and the mode switch.
  const guided = initGuided({ D, T: D.thresholds, el: $('guide'),
    // A rung of an answer: the scenario at that level, so the stamp names it; or the tsunami area.
    setLevel: (lv, opt) => {
      if (opt && opt.tsunami) { $('showTsunami').checked = true; showPlace(null); render(levelNow, scNow); return; }
      const k = D.scenarios.findIndex(s => Math.abs(s.levelFt - lv) < 0.001);
      if (k >= 0) pick(k); else { $('level').value = lv; $('levelOut').textContent = fmt(lv, 2); show(lv, null); }
    },
    focus: (f) => { showPlace(f); if (levelNow != null) legend(last.res, last.plan); },
    onQuestion: (q) => { ui.q = q; if (levelNow != null) writeView(levelNow, scNow); } });
  const setMode = (m) => {
    ui.mode = m; $('main').className = m;
    $('modeGuided').setAttribute('aria-pressed', m === 'guided'); $('modeExpert').setAttribute('aria-pressed', m === 'expert');
    sizeCanvas();
    if (levelNow != null) render(levelNow, scNow); else paint();
  };
  $('modeGuided').addEventListener('click', () => setMode('guided'));
  $('modeExpert').addEventListener('click', () => setMode('expert'));
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-mode]'); if (a) { e.preventDefault(); setMode(a.dataset.mode); } });
  for (const [tab, panel] of [['tabLevel', 'results'], ['tabExposed', 'exposed']]) $(tab).addEventListener('click', () => {
    for (const [t2, p2] of [['tabLevel', 'results'], ['tabExposed', 'exposed']]) { $(t2).setAttribute('aria-selected', t2 === tab); $(p2).hidden = p2 !== panel; }
  });
  // A shared link (js/share.js): its scenario, or its level, and its choices.
  const hadHash = location.hash.length > 1, view = decodeView(location.hash);
  applyView(view);
  if ($('showCosmos').checked) { try { await loadCosmosMask(); } catch (e) { $('showCosmos').checked = false; } }
  const shared = view.sc ? D.scenarios.findIndex(s => s.id === view.sc) : -1;
  if (shared >= 0) pick(shared);
  else if (view.lv != null && view.lv >= +$('level').min && view.lv <= +$('level').max) {
    $('level').value = view.lv; $('levelOut').textContent = fmt(view.lv, 2); show(view.lv, null);
  } else pick(current);
  // A link from before guided mode carries expert settings and no mode: it opens in expert mode.
  setMode(view.mode || (hadHash ? 'expert' : 'guided'));
  guided.show(view.mode === 'guided' && guided.questions.includes(view.q) ? view.q : null);
  // A different link opened in the same tab changes only the part after "#": load it afresh.
  window.addEventListener('hashchange', () => { if (location.hash !== lastHash) location.reload(); });
  $('shareBtn').addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(location.href); ok = true; } catch (e) { /* shown below instead */ }
    $('shareNote').textContent = ok ? 'Link copied. It opens this level, plan, rain and site choices, and the outlines shown; not the map\'s pan and zoom.' : `Copy this link: ${location.href}`;
  });
})();
