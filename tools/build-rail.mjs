// The rail main line for the explorer: OpenStreetMap ways tagged railway=rail, usage=main (the Union
// Pacific Martinez Subdivision, which carries Amtrak's Capitol Corridor and San Joaquins and freight),
// clipped to the terrain grid and re-based to its origin (data/raw/osm/rail.geojson,
// tools/fetch-rail.py; © OpenStreetMap contributors, ODbL). Sidings, spurs, yards and disused or
// abandoned track are left out; BART is underground in Berkeley and left out too.
//   node tools/build-rail.mjs      writes data/rail.json: { origin, edges: [{ id, name, geom, len, berkeley }] }
import fs from 'fs';
import { toUTM } from './utm.mjs';
const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const Wm = dem.xmax - dem.xmin, Hm = dem.ymax - dem.ymin;
const place = JSON.parse(fs.readFileSync('data/raw/census/berkeley-place.geojson')).features[0].geometry;
const ring = (place.type === 'Polygon' ? place.coordinates[0] : place.coordinates[0][0]).map(([lo, la]) => { const [x, y] = toUTM(lo, la); return [x - dem.xmin, y - dem.ymin]; });
const inRing = (x, y, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [x1, y1] = r[i], [x2, y2] = r[j]; if ((y1 > y) !== (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) c = !c; } return c; };
const raw = JSON.parse(fs.readFileSync('data/raw/osm/rail.geojson'));
const edges = [];
for (const f of raw.features) {
  const p = f.properties;
  if (p.railway !== 'rail' || p.usage !== 'main' || p.service) continue;
  const g = f.geometry.coordinates.map(([lo, la]) => { const [x, y] = toUTM(lo, la); return [Math.round((x - dem.xmin) * 10) / 10, Math.round((y - dem.ymin) * 10) / 10]; });
  if (!g.some(([x, y]) => x >= 0 && y >= 0 && x <= Wm && y <= Hm)) continue;
  let len = 0; for (let k = 1; k < g.length; k++) len += Math.hypot(g[k][0] - g[k - 1][0], g[k][1] - g[k - 1][1]);
  edges.push({ id: f.id, name: p.name || 'Martinez Subdivision', bridge: p.bridge === 'yes' || undefined, geom: g, len: Math.round(len), berkeley: inRing(...g[Math.floor(g.length / 2)], ring) || undefined });
}
fs.writeFileSync('data/rail.json', JSON.stringify({
  origin: [dem.xmin, dem.ymin], crs: 'EPSG:32610, meters from origin',
  provenance: { category: 'derived', note: `OpenStreetMap main-line rail (railway=rail, usage=main) inside the terrain grid: the Union Pacific Martinez Subdivision, used by Amtrak's Capitol Corridor and San Joaquins and by freight. ${fs.readFileSync('data/raw/osm/rail.retrieved', 'utf8').trim()}. © OpenStreetMap contributors, ODbL.` },
  edges,
}) + '\n');
console.log(edges.length, 'edges,', Math.round(edges.reduce((t, e) => t + e.len, 0)), 'm;', Math.round(edges.filter(e => e.berkeley).reduce((t, e) => t + e.len, 0)), 'm in Berkeley;', edges.filter(e => e.bridge).length, 'bridges');
