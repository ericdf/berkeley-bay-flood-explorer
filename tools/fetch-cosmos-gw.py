# Download the USGS CoSMoS-GW groundwater emergence and shoaling polygons for Alameda County
# (Befus and others 2020, https://doi.org/10.5066/P9H5PBXP; SOURCE_NOTES H7) and clip them to the
# explorer's grid extent.
#   python3 -I tools/fetch-cosmos-gw.py <cache dir>
# The county zip (Alameda_MHHW.zip, 110 MB) is kept in <cache dir>, never in the repository. Only the
# full model (groundwater reaching the surface is removed, "simulating loss via natural drainage") with
# horizontal hydraulic conductivity Kh = 1.0 m/day is read: the middle of the three cases (0.1, 1.0,
# 10 m/day); the release names no best estimate (its metadata: the three "bracket reasonable model
# parameter values"). The marine boundary condition is MHHW. For each sea level rise it writes to
# data/raw/cosmos-gw/:
#   wtbins_slr<cm>.json.gz   every polygon that meets the window, its rings clipped to the window
#                            (Sutherland-Hodgman): {fbin, type, wtdepth, rings}, rings in
#                            NAD83(NSRS2007) UTM zone 10N meters, rounded to 0.1 m. fbin_m as published:
#                            -1 marine inundation, 0 emergent, 1 = 0-1 m, 2 = 1-2 m, 5 = 2-5 m, 6 = > 5 m
#                            depth to the water table.
# and data/raw/cosmos-gw/clips.json (window, sources, retrieval date). tools/build-cosmos-gw.mjs
# rasterizes them. Standard library only.
import datetime, gzip, io, json, os, struct, sys, time, urllib.request, zipfile

ITEM = 'https://www.sciencebase.gov/catalog/item/5bd9f318e4b0b3fc5cec20ed'
URL = 'https://www.sciencebase.gov/catalog/file/get/5bd9f318e4b0b3fc5cec20ed?name=Alameda_MHHW.zip'
KH = 'Kh1p0mday'
SLRS = ['0p00', '0p25', '0p50', '0p75', '1p00', '1p25', '1p50', '1p75', '2p00', '2p50', '3p00', '5p00']
OUT = 'data/raw/cosmos-gw'
dem = json.load(open('data/terrain/dem.json'))
# Clip window: the explorer grid (UTM 10N) with 20 m of margin.
X0, X1, Y0, Y1 = dem['xmin'] - 20, dem['xmax'] + 20, dem['ymin'] - 20, dem['ymax'] + 20


def get(url, path):
    if os.path.exists(path): return
    for i in range(4):
        try:
            urllib.request.urlretrieve(url, path + '.part'); os.rename(path + '.part', path); return
        except Exception as e: print('retry', e, file=sys.stderr); time.sleep(2 ** i)
    raise SystemExit('fail ' + url)


def dbf_records(b):
    n, hl, rl = struct.unpack('<I', b[4:8])[0], *struct.unpack('<HH', b[8:12])
    fields, i = [], 32
    while b[i] != 0x0D:
        fields.append((b[i:i + 11].split(b'\0')[0].decode(), b[i + 16])); i += 32
    for k in range(n):
        rec, o, d = b[hl + k * rl:hl + (k + 1) * rl], 1, {}
        for name, ln in fields: d[name] = rec[o:o + ln].decode('latin-1').strip(); o += ln
        yield d


def clip_ring(ring):
    """Sutherland-Hodgman against the window; the even-odd fill of the clipped rings equals the
    original's inside the window."""
    for k, v, keep_lt in ((0, X0, False), (0, X1, True), (1, Y0, False), (1, Y1, True)):
        out, n = [], len(ring)
        for i in range(n):
            a, b = ring[i - 1], ring[i]
            ina, inb = (a[k] <= v) if keep_lt else (a[k] >= v), (b[k] <= v) if keep_lt else (b[k] >= v)
            if inb != ina:
                t = (v - a[k]) / (b[k] - a[k]); q = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]; q[k] = v; out.append(q)
            if inb: out.append(b)
        ring = out
        if not ring: return []
    return [[round(x, 1), round(y, 1)] for x, y in ring]


def polygons(shp):
    """(bbox, rings) per record of a polygon shapefile (type 5)."""
    if struct.unpack('>I', shp[:4])[0] != 9994 or struct.unpack('<I', shp[32:36])[0] != 5: raise SystemExit('not a polygon shapefile')
    o, end = 100, len(shp)
    while o < end:
        clen = struct.unpack('>I', shp[o + 4:o + 8])[0] * 2; c = o + 8
        st = struct.unpack('<I', shp[c:c + 4])[0]
        if st == 0: yield None, []
        else:
            bb = struct.unpack('<4d', shp[c + 4:c + 36]); np_, npt = struct.unpack('<2I', shp[c + 36:c + 44])
            parts = struct.unpack(f'<{np_}I', shp[c + 44:c + 44 + 4 * np_]); p0 = c + 44 + 4 * np_
            pts = struct.unpack(f'<{2 * npt}d', shp[p0:p0 + 16 * npt]); rings = []
            for k in range(np_):
                a, b = parts[k], parts[k + 1] if k + 1 < np_ else npt
                r = clip_ring([(pts[2 * j], pts[2 * j + 1]) for j in range(a, b)])
                if len(r) >= 3: rings.append(r)
            yield bb, rings
        o = c + clen


cache = sys.argv[1]; os.makedirs(cache, exist_ok=True); os.makedirs(OUT, exist_ok=True)
zpath = f'{cache}/Alameda_MHHW.zip'
get(URL, zpath)
z = zipfile.ZipFile(zpath)
meta = {'scenarios': {}}
for slr in SLRS:
    base = f'{KH}/Alameda_mhhw_noghb_slr{slr}m_{KH}_wtbins'
    shp, dbf = z.read(base + '.shp'), z.read(base + '.dbf')
    prj = z.read(base + '.prj').decode()
    if 'UTM_zone_10N' not in prj or 'NSRS2007' not in prj: raise SystemExit('unexpected projection ' + prj)
    feats, counts = [], {}
    for (bb, rings), rec in zip(polygons(shp), dbf_records(dbf)):
        if bb is None or not rings or bb[2] < X0 or bb[0] > X1 or bb[3] < Y0 or bb[1] > Y1: continue
        fb = int(rec['fbin_m']); counts[fb] = counts.get(fb, 0) + 1
        feats.append({'fbin': fb, 'type': rec['type'], 'wtdepth': rec['wtdepth'], 'rings': rings})
    cm = f'{round(float(slr.replace("p", ".")) * 100):03d}'
    fn = f'wtbins_slr{cm}.json.gz'
    open(f'{OUT}/{fn}', 'wb').write(gzip.compress(json.dumps({'features': feats}, separators=(',', ':')).encode(), 9, mtime=0))
    meta['scenarios'][f'slr{cm}'] = {'slrM': float(slr.replace('p', '.')), 'file': fn, 'source': base.split('/')[-1] + '.shp', 'features': len(feats),
                                     'featuresByFbin': {str(k): counts[k] for k in sorted(counts)}}
    print(slr, len(feats), counts, flush=True)
meta.update({
    'note': 'USGS CoSMoS-GW: Befus, K.M., Hoover, D.J., Barnard, P.L., and Erikson, L.H., 2020, Projected responses of the coastal water table for California using present-day and future sea-level rise scenarios: U.S. Geological Survey data release, https://doi.org/10.5066/P9H5PBXP. Alameda County package, MHHW marine boundary condition, full model (groundwater reaching the surface removed), Kh = 1.0 m/day, polygons clipped to the explorer grid extent plus 20 m. fbin_m: -1 marine inundation (below MHHW + sea level rise), 0 emergent (water table at or above the ground surface), 1 = 0-1 m, 2 = 1-2 m, 5 = 2-5 m, 6 = deeper than 5 m below the ground surface. Horizontal NAD83(NSRS2007) UTM zone 10N; vertical NAVD88 (metadata). SOURCE_NOTES H7.',
    'item': ITEM, 'zip': URL, 'zipBytes': os.path.getsize(zpath), 'conductivity': 'Kh 1.0 m/day (middle of 0.1, 1.0, 10; no best estimate named)',
    'model': 'full model (noghb, not linresponse)', 'marineBoundary': 'MHHW',
    'window': {'xmin': X0, 'xmax': X1, 'ymin': Y0, 'ymax': Y1},
    'retrieved': datetime.date.today().isoformat(),
    'licence': 'Metadata: "USGS-authored or produced data and information are in the public domain from the U.S. Government and are freely redistributable with proper metadata and source attribution. Please recognize and acknowledge the U.S. Geological Survey and the University of Wyoming as the originators of the dataset and in products derived from these data."',
})
json.dump(meta, open(f'{OUT}/clips.json', 'w'), indent=1); open(f'{OUT}/clips.json', 'a').write('\n')
print('done')
