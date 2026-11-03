# Download the USGS CoSMoS v2.1 San Francisco Bay flood rasters for Alameda County from Our Coast,
# Our Future (Point Blue and USGS; SOURCE_NOTES H1) and clip them to the explorer's grid extent.
#   python3 -I tools/fetch-cosmos.py <cache dir> [slr ...]      (slr in cm: 000 025 050 ... 500)
# The county zips are 78-398 MB each and are kept in <cache dir>, never in the repository. For each
# sea level rise and storm it writes to data/raw/cosmos/:
#   extent_slr<slr>_<storm>.bits.gz the cells of county_alameda_flddepth_slr<slr>_<storm>.tif that carry
#                                   a flood depth (any depth, including 0), one bit per 2 m cell,
#                                   row-major north to south, bit (i & 7) of byte (i >> 3), 1 = depth;
#                                   NAD83 UTM zone 10N. The depths themselves are not stored (size).
#   wse_slr<slr>_<storm>.i16.gz     water surface elevation from county_alameda_waterelev_..., every
#                                   10th cell (20 m), int16 millimeters NAVD88, -32768 = no data
# and data/raw/cosmos/clips.json (grid, sources, retrieval date). tools/build-cosmos.mjs rasterizes them.
# Standard library only. The rasters are 32-bit, one row per strip, Deflate-compressed.
import gzip, json, os, struct, sys, time, urllib.request, zipfile, zlib, datetime

BASE = 'https://d36bibj3hf4jrv.cloudfront.net/ocof-counties/alameda_flooding_slr{}.zip'
PAGE = 'https://data.pointblue.org/apps/ocof2_flood_map/download_data'
SLRS = ['000', '025', '050', '075', '100', '125', '150', '175', '200', '500']
STORMS = ['w000', 'w001', 'w020', 'w100', 'wkt']
OUT = 'data/raw/cosmos'
dem = json.load(open('data/terrain/dem.json'))
# Clip window: the explorer grid (UTM 10N), with one 2 m cell of margin on each side.
X0, X1, Y0, Y1 = dem['xmin'] - 2, dem['xmax'] + 2, dem['ymin'] - 2, dem['ymax'] + 2


def tags_of(f):
    b = f.read(8); E = '<' if b[:2] == b'II' else '>'
    if struct.unpack(E + 'H', b[2:4])[0] != 42: raise SystemExit('not a classic TIFF')
    f.seek(struct.unpack(E + 'I', b[4:8])[0]); n = struct.unpack(E + 'H', f.read(2))[0]
    T = {1: 'B', 2: 's', 3: 'H', 4: 'I', 12: 'd', 16: 'Q'}; S = {1: 1, 2: 1, 3: 2, 4: 4, 12: 8, 16: 8}
    ents = [struct.unpack(E + 'HHI4s', f.read(12)) for _ in range(n)]; tags = {}
    for tag, typ, cnt, v in ents:
        sz = S[typ] * cnt
        if sz <= 4: raw = v[:sz]
        else: f.seek(struct.unpack(E + 'I', v)[0]); raw = f.read(sz)
        tags[tag] = raw if typ == 2 else struct.unpack(E + T[typ] * cnt, raw)
    return E, tags


def clip(f, step=1):
    """Rows/cols of the raster inside the window; returns (values per row, grid info)."""
    E, t = tags_of(f)
    if t[259][0] != 8 or t[278][0] != 1 or t[277][0] != 1: raise SystemExit('unexpected TIFF layout')
    R = t[33550][0]; X, Y = t[33922][3], t[33922][4]  # pixel-corner origin (raster type PixelIsArea)
    c0 = int((X0 - X) // R); c1 = int(-(-(X1 - X) // R)); r0 = int((Y - Y1) // R); r1 = int(-(-(Y - Y0) // R))
    fmt = {(2, 32): 'i', (3, 32): 'f'}[(t[339][0], t[258][0])]
    rows = []
    for r in range(r0, r1, step):
        f.seek(t[273][r]); row = zlib.decompress(f.read(t[279][r]))
        rows.append(struct.unpack(E + fmt * (c1 - c0), row[4 * c0:4 * c1])[::step])
    info = {'xmin': X + c0 * R, 'ymax': Y - r0 * R, 'resolution': R * step, 'width': len(rows[0]), 'height': len(rows),
            'nodata': t[42113].rstrip(b'\0').decode(), 'geoKeys': t[34737].rstrip(b'|\0').decode()}
    return rows, info


def get(url, path):
    if os.path.exists(path): return
    for i in range(4):
        try:
            urllib.request.urlretrieve(url, path + '.part'); os.rename(path + '.part', path); return
        except Exception as e: print('retry', e, file=sys.stderr); time.sleep(2 ** i)
    raise SystemExit('fail ' + url)


cache = sys.argv[1]; os.makedirs(cache, exist_ok=True); os.makedirs(OUT, exist_ok=True)
meta_path = f'{OUT}/clips.json'
meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {'scenarios': {}}
for slr in sys.argv[2:] or SLRS:
    url = BASE.format(slr); zpath = f'{cache}/alameda_flooding_slr{slr}.zip'
    get(url, zpath)
    lm = urllib.request.urlopen(urllib.request.Request(url, method='HEAD')).headers.get('Last-Modified')
    z = zipfile.ZipFile(zpath)
    for st in STORMS:
        dn = f'flooding/v2.1/county_alameda_flddepth_slr{slr}_{st}.tif'
        if dn not in z.namelist(): continue
        with z.open(dn) as raw:
            f = open(f'{cache}/tmp.tif', 'wb'); f.write(raw.read()); f.close()
        with open(f'{cache}/tmp.tif', 'rb') as f: rows, info = clip(f)
        nod = int(info['nodata'])
        w = info['width']; buf = bytearray((w * len(rows) + 7) // 8); wet = 0
        for r, row in enumerate(rows):
            for c, v in enumerate(row):
                if v != nod and v >= 0: i = r * w + c; buf[i >> 3] |= 1 << (i & 7); wet += 1
        open(f'{OUT}/extent_slr{slr}_{st}.bits.gz', 'wb').write(gzip.compress(bytes(buf), 9, mtime=0))
        sc = {'slrM': int(slr) / 100, 'storm': st, 'extentFile': f'extent_slr{slr}_{st}.bits.gz', 'depthSource': dn.split('/')[-1],
              'depth': info, 'depthCells': wet, 'zip': url, 'zipLastModified': lm}
        wn = dn.replace('flddepth', 'waterelev')
        if wn in z.namelist():
            with z.open(wn) as raw:
                f = open(f'{cache}/tmp.tif', 'wb'); f.write(raw.read()); f.close()
            with open(f'{cache}/tmp.tif', 'rb') as f: rows, winfo = clip(f, 10)
            wb = bytearray()
            for row in rows:
                for v in row: wb += struct.pack('<h', -32768 if v == float(winfo['nodata']) or v != v else round(v * 1000))
            open(f'{OUT}/wse_slr{slr}_{st}.i16.gz', 'wb').write(gzip.compress(bytes(wb), 9, mtime=0))
            sc.update({'wseFile': f'wse_slr{slr}_{st}.i16.gz', 'wseSource': wn.split('/')[-1], 'wse': winfo})
        meta['scenarios'][f'slr{slr}_{st}'] = sc
        print(slr, st, 'depth cells', wet, flush=True)
    os.remove(f'{cache}/tmp.tif')
    meta.update({
        'note': 'USGS CoSMoS v2.1 San Francisco Bay flood projections, Alameda County package, clipped to the explorer grid extent. Downloaded from Our Coast, Our Future (Point Blue Conservation Science and USGS). Extent: cells of the flood depth raster that carry a depth (OCOF: "projected flood depth assuming the underlying DEM topography"), 2 m bits; wse: water surface elevation, mm NAVD88 (OCOF: "water surface elevation relative to NAVD88"), every 10th 2 m cell. Horizontal: NAD83 UTM zone 10N; vertical NAVD88 (OCOF v2.x metadata). SOURCE_NOTES H1.',
        'page': PAGE, 'retrieved': datetime.date.today().isoformat(),
        'licence': 'USGS product; no licence stated in the package. USGS-authored data are U.S. public domain; OCOF asks users to cite (ourcoastourfuture.org/about/#cite).',
    })
    json.dump(meta, open(meta_path, 'w'), indent=1); open(meta_path, 'a').write('\n')
print('done')
