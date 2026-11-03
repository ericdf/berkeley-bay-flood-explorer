// Grid cells for a site in data/sites-checked.json: the cells within about 30 m of its point, or
// inside its bounding box. Shared by tools/site-check.mjs and tools/build-site-cells.mjs.
import { toUTM } from './utm.mjs';
export function siteCells(dem, s) {
  const W = dem.width, R = dem.resolution;
  const cellOf = (lat, lon) => { const [x, y] = toUTM(lon, lat); return [Math.floor((x - dem.xmin) / R), Math.floor((dem.ymax - y) / R)]; };
  const out = [];
  if (s.bbox) {
    const [c0, r1] = cellOf(s.bbox[0], s.bbox[1]), [c1, r0] = cellOf(s.bbox[2], s.bbox[3]);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push(r * W + c);
  } else {
    const [c, r] = cellOf(s.lat, s.lon);
    for (let dr = -7; dr <= 7; dr++) for (let dc = -7; dc <= 7; dc++) if (dr * dr + dc * dc <= 56) out.push((r + dr) * W + c + dc); // within about 30 m
  }
  return out;
}
