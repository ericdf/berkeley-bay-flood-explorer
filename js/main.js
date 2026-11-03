// Berkeley Bay Flood Explorer: page logic. Loads the data files, runs the connected fill for the
// chosen level and plan (js/analyze.js), and draws the map and results.
import { analyze, FLANKED, DRAIN, RAIN } from './analyze.js';
import { WET, LOW } from './fill.js';

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
  { ft: 13.36, text: 'the level at which the Bay reaches the flats behind I-80 (13.36, this explorer)' },
];

async function load() {
  const j = (p) => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
  const b = (p) => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.arrayBuffer(); });
  const [dem, zbuf, streets, fac, facCells, scen, bits, art, drains, wsIds, plans, atlas, imp] = await Promise.all([
    j('data/terrain/dem.json'), b('data/terrain/dem.i16'), j('data/streets.json'), j('data/facilities.json'),
    j('data/facility-cells.json'), j('data/scenarios.json'), b('data/terrain/berkeley.bits'),
    j('data/hazard/art.json').catch(() => null), j('data/drains.json'), b('data/hazard/watersheds.u8'), j('data/plans.json'),
    j('data/raw/noaa/atlas14-berkeley.json'), j('data/raw/nlcd/impervious-by-watershed.json'),
  ]);
  return { dem, z: new Int16Array(zbuf), streets, facilities: fac.facilities, facilityCells: facCells, scenarios: scen.scenarios,
    berkeley: new Uint8Array(bits), art, drains, watershedIds: new Uint8Array(wsIds), plans: plans.presets, atlas, impervious: imp.watersheds };
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

let D, base, canvas, ctx, artMasks = {};
// The plan the reader has built: preset ids, tide gates, and walls they drew.
const ui = { presets: new Set(), gates: false, drawing: false, draft: [], drawn: [], drawCrest: 12.7, rain: null };

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
    if (!col && baseRes && isWet(baseRes.state[i])) col = kept; // wet with no plan, dry with this plan
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
  ctx.putImageData(img, 0, 0);
  const toPx = ([x, y]) => [x / dem.resolution, (dem.ymax - dem.ymin - y) / dem.resolution];
  const path = (pts) => { ctx.beginPath(); pts.forEach((q, k) => { const [x, y] = toPx(q); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const e of D.streets.edges) { path(e.geom); ctx.strokeStyle = e.freeway ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.28)'; ctx.lineWidth = e.freeway ? 3 : 1.5; ctx.stroke(); }
  for (const sg of res.segs) { path(sg.e.geom); ctx.strokeStyle = sg.cls === 'wet' ? '#d22' : sg.cls === 'rain' ? '#5a3fd6' : sg.cls === 'drain' ? '#0e8f7e' : '#f0a020'; ctx.lineWidth = 4; ctx.stroke(); }
  for (const f of D.facilityCells) for (const poly of f.outline) { path(poly[0]); ctx.closePath(); ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 2.5; ctx.stroke(); }
  // The plan: walls and raised roads in black over white, so they read on any color.
  if (plan) {
    const lines = [...plan.walls.flatMap(w => w.lines)];
    for (const rd of plan.roads) { const names = new Set(rd.names); for (const e of D.streets.edges) if (names.has(e.name) && !(rd.maxX != null && e.geom.every(([x]) => x > rd.maxX))) lines.push(e.geom); }
    for (const l of lines) { path(l); ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.stroke(); path(l); ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.stroke(); }
    if (plan.gates && Object.keys(plan.gates).length) for (const w of D.drains.watersheds) if (w.link && plan.gates[w.name]) {
      const [x, y] = toPx(w.outfall); ctx.fillStyle = '#111'; ctx.fillRect(x - 7, y - 7, 14, 14); ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, y - 4, 8, 8);
    }
  }
  if (ui.draft.length) { path(ui.draft); ctx.setLineDash([10, 6]); ctx.strokeStyle = '#ff2d7a'; ctx.lineWidth = 5; ctx.stroke(); ctx.setLineDash([]); }
}

function nearestArt(levelFt) {
  if (!D.art) return null;
  let best = null;
  for (const l of D.art.levels) if (!best || Math.abs(l.levelFt - levelFt) < Math.abs(best.levelFt - levelFt)) best = l;
  return best;
}

function context(lv) {
  const below = REFS.filter(r => r.ft <= lv + 1e-6).pop(), above = REFS.find(r => r.ft > lv + 1e-6);
  const parts = [];
  if (below) parts.push(`${fmt(lv - below.ft, 2)} ft above ${below.text}`);
  if (above) parts.push(`${fmt(above.ft - lv, 2)} ft below ${above.text}`);
  return parts.join('; ');
}

const title = (n) => n.replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase());

function render(levelFt, sc) {
  const plan = currentPlan();
  const res = analyze(D, levelFt, plan, ui.rain);
  const baseRes = plan ? analyze(D, levelFt, null, ui.rain) : null;
  draw(res, baseRes, plan);
  const bStreets = res.streets.filter(s => s.berkeley), oStreets = res.streets.filter(s => !s.berkeley);
  const li = (s) => `<li>${esc(title(s.name))}${s.freeway ? ' (freeway)' : s.frontage ? ' (frontage road)' : ''}: ${fmt(s.m)} m, ${s.depthFt != null ? `up to ${fmt(s.depthFt, 1)} ft of water` : `lowest ground ${fmt(s.minFt, 1)} ft`}</li>`;
  const art = nearestArt(levelFt);
  $('artNote').textContent = D.art ? (art ? `Nearest ART level: MHHW + ${art.inches} in, about ${fmt(art.levelFt, 1)} ft NAVD88 (SOURCE_NOTES H5).` : '') : 'ART map not loaded.';
  const row = (label, a, b, unit, d = 1) => `<tr><td>${label}</td><td class="n">${fmt(a, d)} ${unit}</td>${plan ? `<td class="n">${fmt(b, d)} ${unit}</td>` : ''}</tr>`;
  const B = baseRes || res;
  const drainWs = Object.entries(res.drainHa).filter(([, v]) => v >= 0.05).map(([k, v]) => `${esc(k)} ${fmt(v, 1)} ha`).join(', ');
  $('results').innerHTML = `
    <h2>${sc ? esc(sc.label) : 'Chosen level'}</h2>
    <div class="big">${fmt(levelFt, 2)} ft NAVD88 <span class="cat">level: ${sc ? esc(sc.category) : 'chosen'}</span></div>
    <p class="src">${sc ? esc(sc.source) : 'A level chosen with the slider.'}</p>
    <p class="src">${esc(context(levelFt))}.</p>
    ${sc && sc.id === 'ferris12' ? '<p class="warn">Scott Ferris\'s figure is shown by the project owner\'s decision. Its source, datum and whether it includes waves are unconfirmed; it is read here as a still-water level of 12 ft NAVD88. FEMA\'s flood elevations on the wave-exposed Marina shoreline, which include waves, are 12 to 14 ft NAVD88; this map shows still water only.</p>' : ''}
    <p class="src"><span class="cat">derived</span> Everything below is calculated by this explorer, not published: a connected fill on USGS 3DEP lidar (a model rule, explained under Method), at the level above. The level's own category is shown next to it.</p>
    ${plan ? `<p class="warn">Comparing <b>no plan</b> with <b>your plan</b> at the same level. Green on the map is ground the plan keeps dry. ${res.overtopped.length ? `Overtopped at this level: ${res.overtopped.map(esc).join('; ')}.` : 'Nothing in the plan is overtopped at this level; water can still go around the ends of a wall.'}</p>` : ''}
    <h2>In Berkeley <span class="cat">derived</span></h2>
    <table>
      ${plan ? '<tr><th></th><th class="n">No plan</th><th class="n">Your plan</th></tr>' : ''}
      ${row('Ground under water (connected to the Bay)', B.wetLandHa, res.wetLandHa, 'ha')}
      ${row('&nbsp;&nbsp;of which reached only through Albany or Emeryville land', B.flankedHa, res.flankedHa, 'ha')}
      ${ui.rain ? row('Ground under pooled rain', B.rainLandHa, res.rainLandHa, 'ha') : ''}
      ${row('Low ground that can fill through the storm drains', B.drainLandHa, res.drainLandHa, 'ha')}
      ${row('Low ground not connected, even through drains', B.lowLandHa, res.lowLandHa, 'ha')}
      ${row('Streets under water', B.wetStreetM / 1000, res.wetStreetM / 1000, 'km', 2)}
      ${ui.rain ? row('Streets under pooled rain', B.rainStreetM / 1000, res.rainStreetM / 1000, 'km', 2) : ''}
      ${row('Streets that can flood through drains', B.drainStreetM / 1000, res.drainStreetM / 1000, 'km', 2)}
      ${row('Streets on low ground, not connected', B.lowStreetM / 1000, res.lowStreetM / 1000, 'km', 2)}
    </table>
    ${res.rain ? `<h2>Rain on this tide <span class="cat">derived</span></h2>
    <p class="src">${fmt(res.rain.depthIn, 2)} in of rain (NOAA Atlas 14, ${esc(ui.rain.ari)}-year, ${esc(ui.rain.duration.replace('-hr', ' hours'))}), ${fmt(100 * ui.rain.blocked)}% of the runoff unable to drain. Each watershed's runoff pools at its lowest inlet: one pool per watershed, so depth there is overstated and smaller ponds elsewhere are missed.</p>
    <table><tr><th>Watershed</th><th class="n">Runoff share</th><th class="n">Water</th><th class="n">Pool surface</th><th class="n">Area</th></tr>
    ${res.rain.pools.map(p => `<tr><td>${esc(p.watershed)}</td><td class="n">${fmt(p.runoffShare, 2)}</td><td class="n">${fmt(p.volumeM3 / 1000)}k m³</td><td class="n">${fmt(p.levelFt, 1)} ft${p.spilledToBay ? '<br>spills to the Bay' : ''}</td><td class="n">${fmt(p.berkeleyLandHa, 1)} ha</td></tr>`).join('')}</table><p class="src">Area: Berkeley land under the pool, not counting the Aquatic Park lagoon.</p>` : ''}
    ${drainWs ? `<p class="src">Through the drains, by City watershed: ${drainWs}. ${ui.gates ? '' : 'Tide gates: status unknown, shown open (an upper bound).'}</p>` : ''}
    <h2>Places <span class="cat">derived</span></h2>
    <table>${res.facilities.map((f, k) => `<tr><td><b>${esc(f.label)}</b>${f.note ? `<details><summary>About</summary>${esc(f.note)}</details>` : ''}</td><td class="n">${fmt(100 * f.wetShare)}% under water${plan ? ` (no plan ${fmt(100 * B.facilities[k].wetShare)}%)` : ''}<br>${ui.rain ? `${fmt(100 * f.rainShare)}% under pooled rain<br>` : ''}${fmt(100 * f.drainShare)}% through drains<br>${fmt(100 * f.lowShare)}% low<br>median ground ${fmt(f.medianGroundFt, 1)} ft</td></tr>`).join('')}</table>
    <h2>Berkeley streets <span class="cat">derived</span></h2>
    ${bStreets.filter(s => s.cls === 'wet').length ? `<p class="src">Under water:</p><ul>${bStreets.filter(s => s.cls === 'wet').map(li).join('')}</ul>` : '<p class="src">No Berkeley street segment is under water at this level.</p>'}
    ${bStreets.filter(s => s.cls === 'rain').length ? `<p class="src">Under pooled rain:</p><ul>${bStreets.filter(s => s.cls === 'rain').map(li).join('')}</ul>` : ''}
    ${bStreets.filter(s => s.cls === 'drain').length ? `<p class="src">On low ground that can fill through the storm drains:</p><ul>${bStreets.filter(s => s.cls === 'drain').map(li).join('')}</ul>` : ''}
    ${bStreets.filter(s => s.cls === 'low').length ? `<p class="src">On low ground, not connected (rain decides these):</p><ul>${bStreets.filter(s => s.cls === 'low').map(li).join('')}</ul>` : ''}
    ${oStreets.length ? `<h2>Outside Berkeley <span class="cat">derived</span></h2><ul>${oStreets.map(s => li(s).replace('</li>', s.cls === 'wet' ? '</li>' : s.cls === 'drain' ? ' (through drains)</li>' : s.cls === 'rain' ? ' (pooled rain)</li>' : ' (low, not connected)</li>')).join('')}</ul>` : ''}
    ${res.overWater.length ? `<p class="src">Not counted: ${[...new Set(res.overWater.map(s => esc(s.e.name)))].join(', ')}, whose mapped line crosses water in the terrain (a bridge, or a street drawn across water).</p>` : ''}
    <h2>What this cannot tell you</h2>
    <details open><summary>Limits of the map</summary><ul>
      <li>Still water only. Waves add height on the exposed Marina shoreline (FEMA VE zones, 12 to 14 ft NAVD88).</li>
      <li>No timing or duration: a storm tide lasts hours around high tide.</li>
      <li>"Through the drains" is an upper bound: it assumes every inlet in the watershed connects to an outfall without a tide gate, and that the pipes fill. The City does not publish its pipes, outfalls or tide gates.</li>
      <li>Rain is modeled only as pools at each watershed's lowest inlet when "Add a rainstorm" is on, with no pipe capacity, timing or overland flow. Second St beside the transfer station floods today in a 10-year rainstorm because the Gilman St storm drain and the Codornices Creek culvert under I-80 are undersized (transfer station Draft EIR, SOURCE_NOTES F7, F8).</li>
      <li>Rising groundwater is not modeled (5 to 10 ft below ground at the transfer station, F6).</li>
      <li>Walls and berms narrower than the 4 m grid may be missed; bare-earth lidar removes bridges and overpasses, so freeway results need Caltrans profiles to confirm.</li>
    </ul></details>
    <p class="src">Method: a connected fill on USGS 3DEP lidar (4 m). A cell is under water when its ground, or the crest of a wall or raised road the plan puts there, is below the level and it connects to the Bay through other such cells (model rule). Street segments count when at least a quarter of their length is wet. Sources and checks: SOURCE_NOTES.md and docs/design/levers-and-drains.md in the repository.</p>
  `;
}

function planPanel(rerender) {
  const box = $('plan');
  box.innerHTML = `
    ${D.plans.map(p => `<label class="row lever"><input type="checkbox" data-preset="${p.id}"> <span><b>${esc(p.label)}</b><br><span class="src">Crest ${fmt(p.crestFt, 1)} ft NAVD88 (${esc(p.category)}). ${esc(p.cost)}. ${esc(p.source)}.</span></span></label>`).join('')}
    <label class="row lever"><input type="checkbox" id="gates"> <span><b>Tide gates on every storm drain outfall</b><br><span class="src">Closes the drain links, so the Bay cannot come up through the pipes (model rule). Which outfalls already have gates is not published.</span></span></label>
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
  $('drawBtn').addEventListener('click', () => { ui.drawing = true; ui.draft = []; $('drawDone').disabled = false; $('drawNote').textContent = 'Click points on the map along the wall; then "Finish wall".'; canvas.style.cursor = 'crosshair'; });
  $('drawDone').addEventListener('click', () => {
    if (ui.draft.length >= 2) ui.drawn.push({ line: ui.draft, crestFt: ui.drawCrest });
    ui.draft = []; ui.drawing = false; $('drawDone').disabled = true; canvas.style.cursor = '';
    $('drawNote').textContent = `${ui.drawn.length} wall(s) drawn.`; rerender();
  });
  $('drawClear').addEventListener('click', () => { ui.drawn = []; ui.draft = []; $('drawNote').textContent = 'No walls drawn.'; rerender(); });
  canvas.addEventListener('click', (e) => {
    if (!ui.drawing) return;
    const rect = canvas.getBoundingClientRect(), dem = D.dem;
    const x = (e.clientX - rect.left) / rect.width * dem.width * dem.resolution;
    const y = (dem.ymax - dem.ymin) - (e.clientY - rect.top) / rect.height * dem.height * dem.resolution;
    ui.draft.push([Math.round(x), Math.round(y)]); rerender();
  });
}

(async () => {
  D = await load();
  const W = D.dem.width, H = D.dem.height;
  canvas = $('map'); canvas.width = W; canvas.height = H; ctx = canvas.getContext('2d');
  base = shade(D);
  if (D.art) await Promise.all(D.art.levels.map(async l => { artMasks[l.file] = new Uint8Array(await fetch(`data/hazard/${l.file}`).then(r => r.arrayBuffer())); }));
  else $('showArt').disabled = true;
  analyze(D, 6); // computes D.water0 once
  const list = $('scenarios');
  list.innerHTML = D.scenarios.map((s, k) => `<label class="sc"><input type="radio" name="sc" value="${k}"><span class="t">${esc(s.label)}</span><span class="lv">${fmt(s.levelFt, 2)}</span></label>`).join('');
  // The level shown is kept here, exactly: a scenario's level may not be a multiple of the
  // slider's step, and the slider would round it.
  let current = D.scenarios.findIndex(s => s.id === 'y100'), levelNow = null, scNow = null;
  const show = (lv, sc) => { levelNow = lv; scNow = sc; render(lv, sc); };
  const pick = (k) => { current = k; list.querySelectorAll('input')[k].checked = true; $('level').value = D.scenarios[k].levelFt; $('levelOut').textContent = fmt(D.scenarios[k].levelFt, 2); show(D.scenarios[k].levelFt, D.scenarios[k]); };
  list.addEventListener('change', (e) => pick(Number(e.target.value)));
  let pending = false;
  $('level').addEventListener('input', () => {
    $('levelOut').textContent = fmt(Number($('level').value), 2);
    list.querySelectorAll('input').forEach(i => { i.checked = false; });
    if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; show(Number($('level').value), null); }); }
  });
  $('showArt').addEventListener('change', () => render(levelNow, scNow));
  planPanel(() => render(levelNow, scNow));
  const rainUpdate = () => {
    ui.rain = $('rainOn').checked ? { ari: $('rainAri').value, duration: $('rainDur').value, blocked: Number($('rainBlocked').value) } : null;
    $('rainNote').textContent = ui.rain ? `${D.atlas.depthIn[ui.rain.duration][ui.rain.ari]} in of rain (NOAA Atlas 14, SOURCE_NOTES R1).` : '';
    render(levelNow, scNow);
  };
  for (const id of ['rainOn', 'rainAri', 'rainDur', 'rainBlocked']) $(id).addEventListener('change', rainUpdate);
  pick(current);
})();
