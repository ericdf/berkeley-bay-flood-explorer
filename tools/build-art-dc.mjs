// Rasterize ART layers read from the Alameda County geodatabase (SOURCE_NOTES H5) onto the terrain grid.
//   node tools/build-art-dc.mjs               (reads data/raw/art-dc/lowlying_<N>.json from tools/fetch-art-dc.py)
//   node tools/build-art-dc.mjs --connected   (reads data/raw/art-dc/inundation_<N>.json, from fetch-art-dc.py --connected)
// Options: --in DIR reads the raw clips from DIR instead of data/raw/art-dc; --out DIR writes the masks and the .json there instead of data/hazard; --no-shift skips the
// datum transformation below (reproduces the rasters built before 2026-11-04, for comparison only).
// Default: writes data/hazard/art-dc-<inches>.bits (one bit per cell, row-major, 1 = inside an ART
// disconnected low-lying area at that level) and data/hazard/art-dc.json listing the levels.
// --connected: writes data/hazard/art-<inches>.bits (1 = inside ART's connected flooding, any depth
// class) for all ten levels, and data/hazard/art.json, the layer the explorer outlines and that the
// C1 comparison reads. (The Caltrans service's seven levels, tools/build-art.mjs, are kept only for
// reproducing the earlier comparison, SOURCE_NOTES C1.)
// A cell is inside when its center is, even-odd rule over every ring of a feature (holes stay holes),
// features OR-ed together, as tools/build-art.mjs does.
// The layers' coordinates are NAD83 / UTM zone 10N (the geodatabase's spatial reference names the
// datum D_North_American_1983 without a realization; taken as NAD83(2011), assumption). Each vertex
// is transformed to the grid's WGS 84 / UTM zone 10N by tools/nad83.mjs (EPSG:7807, ITRF2008 to
// NAD83(2011), inverted, at epoch 2017.0): about 1.44 m west and 0.28 m north at Berkeley.
// ART levels are total water levels of MHHW plus N inches; in feet NAVD88 they are taken as MHHW
// 6.20 at point 518 (SOURCE_NOTES W11) plus N/12 (derived), as in tools/build-art.mjs.
import fs from 'fs';
import { fileURLToPath } from 'url';
import { nad83ToWgs84, EPOCH, HELMERT } from './nad83.mjs';

export const ART_NOTE = 'ART Bay Area Sea Level Rise and Shoreline Analysis Maps (AECOM 2017 for BCDC/MTC), flooded area connected to the Bay at total water levels of MHHW plus N inches, rasterized to this grid (a cell is flooded when its center is inside a polygon of any depth class). Source: layers Alameda_inundation_poly_<N> of the Alameda County geodatabase Alameda_SLR_ART_2017.gdb from explorer.adaptingtorisingtides.org/download, all ten levels (SOURCE_NOTES H5). Coordinates: NAD83 / UTM zone 10N in the geodatabase, transformed to the grid\'s WGS 84 / UTM zone 10N with EPSG:7807 (ITRF2008 to NAD83(2011), inverted) at epoch 2017.0, a shift of about 1.5 m (tools/nad83.mjs; SOURCE_NOTES C1). levelFt = MHHW 6.20 ft NAVD88 at point 518 (W11) + N/12, derived.';

const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const R = dem.resolution, W = dem.width, H = dem.height, Hm = dem.ymax - dem.ymin;
const MHHW = 6.20;
const argv = process.argv.slice(2), SHIFT = !argv.includes('--no-shift');
const OUT = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : 'data/hazard';
const toGrid = SHIFT ? nad83ToWgs84() : (x, y) => [x, y];
export const DATUM = SHIFT ? { from: 'NAD83 / UTM zone 10N (EPSG:26910; realization taken as NAD83(2011), EPSG:6339)', to: 'WGS 84 / UTM zone 10N (EPSG:32610)', transformation: 'EPSG:7807 ITRF2008 to NAD83(2011) (1), inverted; WGS 84 (G1762) taken as ITRF2008', epoch: EPOCH, parameters: HELMERT.source, tool: 'tools/nad83.mjs' } : { none: 'coordinates used without a datum shift (--no-shift)' };

// features: [{ rings: [[[x, y], ...], ...] }] in EPSG:26910 meters. Returns { bits, cells }.
export function rasterize(features) {
  const bits = new Uint8Array(Math.ceil(W * H / 8));
  let cells = 0;
  for (const feat of features) {
    const rings = feat.rings.map(r => r.map(([x0, y0]) => { const [x, y] = toGrid(x0, y0); return [x - dem.xmin, y - dem.ymin]; }));
    let ymin = Infinity, ymax = -Infinity; for (const r of rings) for (const [, y] of r) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
    if (ymax < 0 || ymin > Hm) continue;
    for (let row = Math.max(0, Math.floor((Hm - ymax) / R)); row <= Math.min(H - 1, Math.ceil((Hm - ymin) / R)); row++) {
      const y = Hm - (row + 0.5) * R, xs = [];
      for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [x1, y1] = r[i], [x2, y2] = r[j]; if ((y1 > y) !== (y2 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let c = Math.max(0, Math.ceil(xs[k] / R - 0.5)); c < W && (c + 0.5) * R <= xs[k + 1]; c++) { const i = row * W + c; if (!((bits[i >> 3] >> (i & 7)) & 1)) cells++; bits[i >> 3] |= 1 << (i & 7); }
    }
  }
  return { bits, cells };
}

function build(dir, stem, prefix) {
  const out = [];
  for (const f of fs.readdirSync(dir).filter(f => new RegExp(`^${stem}_\\d+\\.json$`).test(f)).sort((a, b) => parseInt(a.slice(stem.length + 1)) - parseInt(b.slice(stem.length + 1)))) {
    const src = JSON.parse(fs.readFileSync(`${dir}/${f}`));
    const { bits, cells } = rasterize(src.features);
    const file = `${prefix}-${src.inches}.bits`;
    fs.writeFileSync(`${OUT}/${file}`, bits);
    out.push({ inches: src.inches, levelFt: Math.round((MHHW + src.inches / 12) * 100) / 100, file, layer: src.layer, cells, retrieved: src.retrieved.slice(0, 10) });
    console.log(src.layer, '->', file, `${(cells * R * R / 1e4).toFixed(1)} ha in the grid`);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = argv.includes('--in') ? argv[argv.indexOf('--in') + 1] : 'data/raw/art-dc';
  fs.mkdirSync(OUT, { recursive: true });
  if (argv.includes('--connected')) {
    const levels = build(dir, 'inundation', 'art').map(g => ({ inches: g.inches, levelFt: g.levelFt, file: g.file, layer: g.layer, source: 'geodatabase', retrieved: g.retrieved }));
    fs.writeFileSync(`${OUT}/art.json`, JSON.stringify({ note: ART_NOTE, provenance: { category: 'sourced', retrieved: levels.map(l => l.retrieved).sort().pop(), datum: DATUM }, levels }, null, 2) + '\n');
  } else {
    const levels = build(dir, 'lowlying', 'art-dc').map(({ retrieved, ...l }) => l);
    const retrieved = JSON.parse(fs.readFileSync(`${dir}/lowlying_12.json`)).retrieved.slice(0, 10);
    fs.writeFileSync(`${OUT}/art-dc.json`, JSON.stringify({
      note: 'ART Bay Area Sea Level Rise and Shoreline Analysis Maps (AECOM 2017 for BCDC/MTC), disconnected low-lying areas: ground below the mapped water surface that is not hydraulically connected to the flooded area, areas greater than one acre only (ART GIS data catalog, p. 2), at total water levels of MHHW plus N inches, rasterized to this grid. Source: Alameda County geodatabase Alameda_SLR_ART_2017.gdb, layers Alameda_lowlying_poly_<N>, from explorer.adaptingtorisingtides.org/download (SOURCE_NOTES H5). Coordinates transformed from NAD83 / UTM zone 10N to the grid\'s WGS 84 / UTM zone 10N as in art.json (tools/nad83.mjs). levelFt = MHHW 6.20 ft NAVD88 at point 518 (W11) + N/12, derived.',
      provenance: { category: 'sourced', retrieved, datum: DATUM },
      levels,
    }, null, 2) + '\n');
  }
}
