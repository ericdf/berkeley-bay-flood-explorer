// Streets for the explorer: the vehicle segments of the wildfire simulator's street network
// (Alameda County centerlines in Berkeley; OpenStreetMap beyond, © OpenStreetMap contributors,
// ODbL) that lie inside this explorer's terrain grid, re-based to its origin.
//   node tools/build-streets.mjs [path to berkeley-wildfire-simulator]
// Writes data/streets.json: { origin, edges: [{ id, name, cls, freeway, geom: [[x, y], ...], len }] }
import fs from 'fs';
import { toUTM } from './utm.mjs';
const src = process.argv[2] || '../berkeley-wildfire-simulator';
const net = JSON.parse(fs.readFileSync(`${src}/data/model/network.json`));
const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const [ox, oy] = net.meta.origin;
const dx = ox - dem.xmin, dy = oy - dem.ymin, Wm = dem.xmax - dem.xmin, Hm = dem.ymax - dem.ymin;
// City of Berkeley boundary (Census TIGERweb place 0606000) in grid meters: a segment is in
// Berkeley when its midpoint is inside it.
const place = JSON.parse(fs.readFileSync('data/raw/census/berkeley-place.geojson')).features[0].geometry;
const ring = (place.type === 'Polygon' ? place.coordinates[0] : place.coordinates[0][0]).map(([lo, la]) => { const [x, y] = toUTM(lo, la); return [x - dem.xmin, y - dem.ymin]; });
const inRing = (x, y, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [x1, y1] = r[i], [x2, y2] = r[j]; if ((y1 > y) !== (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) c = !c; } return c; };
const FREEWAY = /^(I80|I580|EASTSHORE HW|JOHN T\. KNOX FREEWAY)|ON I80|OFF I80/;
const edges = [];
for (const e of net.edges) {
  if (e.mode !== 'vehicle') continue;
  const g = e.geom.map(([x, y]) => [Math.round((x + dx) * 10) / 10, Math.round((y + dy) * 10) / 10]);
  if (!g.some(([x, y]) => x >= 0 && y >= 0 && x <= Wm && y <= Hm)) continue;
  edges.push({ id: e.id, name: e.name || 'UNNAMED', cls: e.cls, freeway: FREEWAY.test(e.name || '') && !/EASTSHORE HW/.test(e.name || '') ? true : undefined, frontage: /EASTSHORE HW/.test(e.name || '') ? true : undefined, geom: g, len: Math.round(e.len), berkeley: inRing(...g[Math.floor(g.length / 2)], ring) || undefined });
}
fs.writeFileSync('data/streets.json', JSON.stringify({
  origin: [dem.xmin, dem.ymin], crs: 'EPSG:32610, meters from origin',
  provenance: { category: 'derived', note: `Vehicle segments of berkeley-wildfire-simulator data/model/network.json (built ${net.meta.built}) inside the terrain grid. Sources: Alameda County street centerlines; OpenStreetMap beyond Berkeley (© OpenStreetMap contributors, ODbL).` },
  edges,
}) + '\n');
console.log(edges.length, 'segments;', edges.filter(e => e.freeway).length, 'freeway;', edges.filter(e => e.frontage).length, 'frontage');
