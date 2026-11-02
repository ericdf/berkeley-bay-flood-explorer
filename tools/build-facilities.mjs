// Project the facility outlines (data/raw/osm/facilities.geojson, © OpenStreetMap contributors,
// ODbL) onto the terrain grid. Writes data/facility-cells.json: for each facility in
// data/facilities.json, its outline in grid meters and the indices of the grid cells inside it.
//   node tools/build-facilities.mjs
import fs from 'fs';
import { toUTM } from './utm.mjs';
const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const fac = JSON.parse(fs.readFileSync('data/facilities.json')).facilities;
const osm = JSON.parse(fs.readFileSync('data/raw/osm/facilities.geojson')).features;
const local = ([lo, la]) => { const [x, y] = toUTM(lo, la); return [Math.round((x - dem.xmin) * 10) / 10, Math.round((y - dem.ymin) * 10) / 10]; };
const inRing = (x, y, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [x1, y1] = r[i], [x2, y2] = r[j]; if ((y1 > y) !== (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) c = !c; } return c; };
const out = [];
for (const f of fac) {
  const o = osm.find(g => g.properties.osm === f.osm);
  if (!o) throw new Error(`no outline for ${f.osm}`);
  const polys = o.geometry.type === 'Polygon' ? [o.geometry.coordinates] : o.geometry.coordinates;
  const rings = polys.map(p => p.map(r => r.map(local)));
  const cells = [];
  const xs = rings.flat(3).filter((_, i) => i % 2 === 0), ys = rings.flat(3).filter((_, i) => i % 2 === 1);
  const R = dem.resolution, Hm = dem.ymax - dem.ymin;
  for (let c = Math.max(0, Math.floor(Math.min(...xs) / R)); c <= Math.min(dem.width - 1, Math.floor(Math.max(...xs) / R)); c++)
    for (let r = Math.max(0, Math.floor((Hm - Math.max(...ys)) / R)); r <= Math.min(dem.height - 1, Math.floor((Hm - Math.min(...ys)) / R)); r++) {
      const x = (c + 0.5) * R, y = Hm - (r + 0.5) * R;
      if (rings.some(p => inRing(x, y, p[0]) && !p.slice(1).some(h => inRing(x, y, h)))) cells.push(r * dem.width + c);
    }
  out.push({ osm: f.osm, outline: rings, cells });
  console.log(f.label, cells.length, 'cells');
}
fs.writeFileSync('data/facility-cells.json', JSON.stringify(out) + '\n');
