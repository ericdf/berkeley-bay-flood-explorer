// Shareable views (an outside review, 2026-11-04; SOURCE_NOTES E11, E12): the scenario or level,
// the plan, the rain experiment, the reader's site choices and the published overlays, kept in the
// page's URL after "#" so a link opens the same view. Map pan and zoom are not kept. Values are
// checked against what the page offers when applied (js/main.js); anything unknown is ignored.
// Separators are "_" between fields and "*" between a wall point's x and y (meters on the grid),
// characters a URL carries without escaping; no id the page uses contains "_".
// Works in the browser and in Node.

const num = (v) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);

// state: { sc, lv, presets, gates, rain: {ari, duration, blocked} | null, walls: [{crestFt, line: [[x, y]]}],
//          sites: {id: choice}, floodproofFt, show: [names], cosmos: {slr, storm} | null,
//          mode: 'guided' | 'expert', q: guided question id | null,
//          story: story id | null, step: '1', '2', ... | 'brief' | null, view: 'decisions' | null }
// (civic stories, js/civic/civic.js). An address is never put in the link.
export function encodeView(s) {
  const p = new URLSearchParams();
  if (s.sc) p.set('sc', s.sc); else if (s.lv != null) p.set('lv', s.lv.toFixed(2));
  if (s.presets && s.presets.length) p.set('plan', s.presets.join('_'));
  if (s.gates) p.set('gates', '1');
  if (s.rain) p.set('rain', `${s.rain.ari}_${s.rain.duration}_${s.rain.blocked}`);
  for (const w of s.walls || []) p.append('wall', [w.crestFt.toFixed(1), ...w.line.map(([x, y]) => `${Math.round(x)}*${Math.round(y)}`)].join('_'));
  for (const [id, c] of Object.entries(s.sites || {})) if (c && c !== 'none') p.append('site', `${id}_${c}`);
  if (s.floodproofFt != null && Object.values(s.sites || {}).includes('floodproof')) p.set('fp', String(s.floodproofFt));
  if (s.show && s.show.length) p.set('show', s.show.join('_'));
  if (s.cosmos) p.set('cosmos', `${s.cosmos.slr}_${s.cosmos.storm}`);
  if (s.mode) p.set('mode', s.mode);
  if (s.q) p.set('q', s.q);
  if (s.story) { p.set('story', s.story); if (s.step) p.set('step', s.step); }
  if (s.view) p.set('view', s.view);
  return p.toString();
}

export function decodeView(hash) {
  const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const out = { sc: p.get('sc') || null, lv: num(p.get('lv')), presets: (p.get('plan') || '').split('_').filter(Boolean),
    gates: p.get('gates') === '1', rain: null, walls: [], sites: {}, floodproofFt: num(p.get('fp')),
    show: (p.get('show') || '').split('_').filter(Boolean), cosmos: null,
    mode: ['guided', 'expert'].includes(p.get('mode')) ? p.get('mode') : null, q: p.get('q') || null,
    // Story ids and steps are checked against data/civic/stories.json when opened, and an unknown one
    // says so on the page; here only their length is limited.
    story: p.get('story') ? p.get('story').slice(0, 80) : null,
    step: p.get('step') ? p.get('step').slice(0, 8) : null,
    view: p.get('view') === 'decisions' ? 'decisions' : null };
  const rain = (p.get('rain') || '').split('_');
  if (rain.length === 3 && num(rain[2]) != null) out.rain = { ari: rain[0], duration: rain[1], blocked: num(rain[2]) };
  for (const w of p.getAll('wall')) {
    const [crest, ...pts] = w.split('_'), line = pts.map(t => t.split('*').map(num)).filter(xy => xy.length === 2 && xy.every(v => v != null));
    if (num(crest) != null && line.length >= 2) out.walls.push({ crestFt: num(crest), line });
  }
  for (const t of p.getAll('site')) { const [id, c] = t.split('_'); if (id && c) out.sites[id] = c; }
  const cs = (p.get('cosmos') || '').split('_');
  if (cs.length === 2 && cs[0] && cs[1]) out.cosmos = { slr: cs[0], storm: cs[1] };
  return out;
}

// A shared wall is drawn only if every point lies on the terrain grid (meters, 0 to widthM and
// 0 to heightM) and it has at most MAX_WALL_POINTS points: a far-off point would make the wall
// stamping in js/plan.js run for a very long time (Codex review, PR #11).
export const MAX_WALL_POINTS = 200;
export const MAX_WALLS = 20; // walls read from a link, and walls the page lets a reader draw
export function wallFits(w, widthM, heightM) {
  return w.line.length >= 2 && w.line.length <= MAX_WALL_POINTS
    && w.line.every(([x, y]) => x >= 0 && x <= widthM && y >= 0 && y <= heightM);
}
