// Berkeley Bay Flood Explorer: page logic. Loads the data files, runs the connected fill for the
// chosen level (js/analyze.js) and draws the map and results.
import { analyze, FLANKED } from './analyze.js';
import { WET, LOW } from './fill.js';

const $ = (id) => document.getElementById(id);
const fmt = (x, d = 0) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
  const [dem, zbuf, streets, fac, facCells, scen, bits, art] = await Promise.all([
    j('data/terrain/dem.json'), b('data/terrain/dem.i16'), j('data/streets.json'), j('data/facilities.json'),
    j('data/facility-cells.json'), j('data/scenarios.json'), b('data/terrain/berkeley.bits'),
    j('data/hazard/art.json').catch(() => null),
  ]);
  return { dem, z: new Int16Array(zbuf), streets, facilities: fac.facilities, facilityCells: facCells, scenarios: scen.scenarios, berkeley: new Uint8Array(bits), art };
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

function draw(res) {
  const { dem } = D, W = dem.width, H = dem.height;
  const img = new ImageData(new Uint8ClampedArray(base), W, H), p = img.data, s = res.state;
  const wet = [47, 127, 214], low = [224, 138, 30], fl = [139, 63, 184], sea = [15, 39, 71];
  for (let i = 0; i < s.length; i++) {
    const col = D.water0[i] ? sea : s[i] === WET ? wet : s[i] === FLANKED ? fl : s[i] === LOW ? low : null;
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
  // Berkeley boundary is implicit in the flank color; draw streets on top.
  const toPx = ([x, y]) => [x / dem.resolution, (dem.ymax - dem.ymin - y) / dem.resolution];
  ctx.lineCap = 'round';
  for (const e of D.streets.edges) {
    ctx.beginPath(); e.geom.forEach((q, k) => { const [x, y] = toPx(q); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = e.freeway ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.28)'; ctx.lineWidth = e.freeway ? 3 : 1.5; ctx.stroke();
  }
  for (const sg of res.segs) {
    ctx.beginPath(); sg.e.geom.forEach((q, k) => { const [x, y] = toPx(q); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = sg.wet ? '#d22' : '#f0a020'; ctx.lineWidth = 4; ctx.stroke();
  }
  for (const f of D.facilityCells) for (const poly of f.outline) {
    ctx.beginPath(); poly[0].forEach((q, k) => { const [x, y] = toPx(q); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath(); ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 2.5; ctx.stroke();
  }
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

function render(levelFt, sc) {
  const res = analyze(D, levelFt);
  draw(res);
  const bStreets = res.streets.filter(s => s.berkeley), oStreets = res.streets.filter(s => !s.berkeley);
  const li = (s) => `<li>${esc(s.name.replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase()))}${s.freeway ? ' (freeway)' : s.frontage ? ' (frontage road)' : ''}: ${fmt(s.m)} m, lowest ground ${fmt(s.minFt, 1)} ft</li>`;
  const art = nearestArt(levelFt);
  $('artNote').textContent = D.art ? (art ? `Nearest ART level: MHHW + ${art.inches} in, about ${fmt(art.levelFt, 1)} ft NAVD88 (SOURCE_NOTES H5).` : '') : 'ART map not loaded.';
  $('results').innerHTML = `
    <h2>${sc ? esc(sc.label) : 'Chosen level'}</h2>
    <div class="big">${fmt(levelFt, 2)} ft NAVD88 <span class="cat">${sc ? esc(sc.category) : 'chosen'}</span></div>
    <p class="src">${sc ? esc(sc.source) : 'A level chosen with the slider.'}</p>
    <p class="src">${esc(context(levelFt))}.</p>
    ${sc && sc.id === 'ferris12' ? '<p class="warn">Scott Ferris\'s figure is shown by the project owner\'s decision. Its source, datum and whether it includes waves are unconfirmed; it is read here as a still-water level of 12 ft NAVD88. FEMA\'s flood elevations on the wave-exposed Marina shoreline, which include waves, are 12 to 14 ft NAVD88; this map shows still water only.</p>' : ''}
    <h2>In Berkeley</h2>
    <table>
      <tr><td>Ground under water (connected to the Bay)</td><td class="n">${fmt(res.wetLandHa, 1)} ha</td></tr>
      <tr><td>&nbsp;&nbsp;of which reached only through Albany or Emeryville land</td><td class="n">${fmt(res.flankedHa, 1)} ha</td></tr>
      <tr><td>Ground below the level, not connected over the surface</td><td class="n">${fmt(res.lowLandHa, 1)} ha</td></tr>
      <tr><td>Streets under water</td><td class="n">${fmt(res.wetStreetM / 1000, 2)} km</td></tr>
      <tr><td>Streets on low ground, not connected</td><td class="n">${fmt(res.lowStreetM / 1000, 2)} km</td></tr>
    </table>
    <h2>Places</h2>
    <table>${res.facilities.map(f => `<tr><td><b>${esc(f.label)}</b>${f.note ? `<details><summary>About</summary>${esc(f.note)}</details>` : ''}</td><td class="n">${fmt(100 * f.wetShare)}% under water<br>${fmt(100 * f.lowShare)}% low<br>median ground ${fmt(f.medianGroundFt, 1)} ft</td></tr>`).join('')}</table>
    <h2>Berkeley streets</h2>
    ${bStreets.filter(s => s.wet).length ? `<p class="src">Under water:</p><ul>${bStreets.filter(s => s.wet).map(li).join('')}</ul>` : '<p class="src">No Berkeley street segment is under water at this level.</p>'}
    ${bStreets.filter(s => !s.wet).length ? `<p class="src">On low ground, not connected (drains, tide gates and rain decide these):</p><ul>${bStreets.filter(s => !s.wet).map(li).join('')}</ul>` : ''}
    ${oStreets.length ? `<h2>Outside Berkeley</h2><ul>${oStreets.map(s => li(s).replace('</li>', s.wet ? '' : ' (low, not connected)</li>')).join('')}</ul>` : ''}
    ${res.overWater.length ? `<p class="src">Not counted: ${[...new Set(res.overWater.map(s => esc(s.e.name)))].join(', ')}, whose mapped line crosses open water in the terrain (a bridge, or a street drawn across water).</p>` : ''}
    <h2>What this cannot tell you</h2>
    <details open><summary>Limits of the map</summary><ul>
      <li>Still water only. Waves add height on the exposed Marina shoreline (FEMA VE zones, 12 to 14 ft NAVD88).</li>
      <li>No timing or duration: a storm tide lasts hours around high tide.</li>
      <li>"Low, not connected" ground can still flood: Second St beside the transfer station floods today in a 10-year rainstorm because the Gilman St storm drain and the Codornices Creek culvert under I-80 are undersized (transfer station Draft EIR, SOURCE_NOTES F7, F8). High Bay water backs up storm drains.</li>
      <li>Rising groundwater is not modeled (5 to 10 ft below ground at the transfer station, F6).</li>
      <li>Walls and berms narrower than the 4 m grid may be missed; bare-earth lidar removes bridges and overpasses, so freeway results need Caltrans profiles to confirm.</li>
    </ul></details>
    <p class="src">Method: a connected fill on USGS 3DEP lidar (4 m). A cell is under water when its ground is below the level and it connects to the Bay through other cells below the level (model rule). Street segments count when at least a quarter of their length is wet. Sources and checks: SOURCE_NOTES.md in the repository.</p>
  `;
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
  let current = D.scenarios.findIndex(s => s.id === 'y100');
  const pick = (k) => { current = k; list.querySelectorAll('input')[k].checked = true; $('level').value = D.scenarios[k].levelFt; $('levelOut').textContent = fmt(D.scenarios[k].levelFt, 2); render(D.scenarios[k].levelFt, D.scenarios[k]); };
  list.addEventListener('change', (e) => pick(Number(e.target.value)));
  let pending = false;
  $('level').addEventListener('input', () => {
    $('levelOut').textContent = fmt(Number($('level').value), 2);
    list.querySelectorAll('input').forEach(i => { i.checked = false; });
    if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; render(Number($('level').value), null); }); }
  });
  $('showArt').addEventListener('change', () => render(Number($('level').value), list.querySelector('input:checked') ? D.scenarios[current] : null));
  pick(current);
})();
