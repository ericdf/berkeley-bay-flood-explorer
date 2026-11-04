# Download ART's disconnected low-lying areas (SOURCE_NOTES H5) for the explorer's area, and, with
# --connected, ART's connected flooding for the levels the Caltrans service lacks.
#   python3 -I tools/fetch-art-dc.py                                  (run from the repository root)
#   python3 -I tools/fetch-art-dc.py --connected                      (all ten Alameda_inundation_poly_<N>)
#   python3 -I tools/fetch-art-dc.py --connected --levels 48,77,84 --out DIR    (some levels, to DIR)
# The connected clips are then simplified for size: node tools/simplify-art-dc.mjs 0.5
# data/raw/art-dc/inundation_*.json (14.1 MB for all ten, 24 MB before; 2026-11-04).
# Source: the ART Bay Shoreline Flood Explorer's Alameda County geodatabase,
# Alameda_SLR_ART_2017.gdb.zip (5.3 GB), served by https://explorer.adaptingtorisingtides.org/download.php
# (POST r=prep&f=Alameda_gdb, then POST r=fetch in the same session). The server honors HTTP Range
# requests, so only the zip's central directory and the ten Alameda_lowlying_poly_<N> feature
# classes (about 15 MB compressed) are downloaded, not the whole archive; the connected tables
# Alameda_inundation_poly_<N> are larger (10 to 77 MB compressed each; 48, 77 and 84 in: 150 MB).
# Writes data/raw/art-dc/lowlying_<N>.json (or, with --connected, inundation_<N>.json): every polygon ring of the layer whose bounding box meets
# the terrain grid (data/terrain/dem.json, with a 50 m margin), in the layer's coordinates, NAD83 /
# UTM zone 10N (EPSG:26910), meters, rounded to 0.1 m, with the layer's spatial reference as stored
# ("wkt": NAD_1983_UTM_Zone_10N, datum D_North_American_1983, no realization named). tools/build-art-dc.mjs
# transforms them to the grid's WGS 84 (tools/nad83.mjs) and rasterizes them.
# The FileGDB reader below handles only what these tables hold (polygons, and int16, int32, float,
# double, string and date fields).
import argparse, json, os, struct, subprocess, sys, time, zlib, datetime

URL = 'https://explorer.adaptingtorisingtides.org/download.php'
KEY = 'Alameda_gdb'
GDB = 'Alameda_SLR_ART_2017.gdb'
OUT = 'data/raw/art-dc'
COOKIES = os.path.join(OUT, '.cookies')

def curl(args):
    for k in range(5):
        r = subprocess.run(['curl', '-sS', '--fail', '-b', COOKIES, '-c', COOKIES, '--max-time', '900'] + args, capture_output=True)
        if r.returncode == 0: return r.stdout
        print('retry', r.stderr.decode()[:200], file=sys.stderr); time.sleep(2 ** k)
    raise SystemExit('download failed')

def prep():
    r = json.loads(curl(['-X', 'POST', '-d', f'r=prep&f={KEY}', URL]))
    if not r[0]: raise SystemExit(f'prep refused: {r}')
    return r[1], int(r[2])

def rng(a, b):
    prep()  # the server serves one fetch per prep
    d = curl(['-X', 'POST', '-d', 'r=fetch', '-H', f'Range: bytes={a}-{b}', URL])
    if len(d) != b - a + 1: raise SystemExit(f'short read {len(d)} of {b - a + 1}')
    return d

def central_directory(size):
    tail = rng(size - 65536, size - 1)
    j = tail.rfind(b'PK\x06\x06')  # zip64 end of central directory
    if j < 0: raise SystemExit('no zip64 directory')
    cdsize, cdoff = struct.unpack('<QQ', tail[j + 40:j + 56])
    cd = rng(cdoff, cdoff + cdsize - 1); i = 0; out = {}
    while cd[i:i + 4] == b'PK\x01\x02':
        meth, = struct.unpack('<H', cd[i + 10:i + 12]); csz, usz = struct.unpack('<II', cd[i + 20:i + 28])
        nl, el, cl = struct.unpack('<HHH', cd[i + 28:i + 34]); off, = struct.unpack('<I', cd[i + 42:i + 46])
        name = cd[i + 46:i + 46 + nl].decode(); ex = cd[i + 46 + nl:i + 46 + nl + el]; k = 0
        while k < len(ex):
            hid, hl = struct.unpack('<HH', ex[k:k + 4]); d = ex[k + 4:k + 4 + hl]; p = 0
            if hid == 1:
                if usz == 0xFFFFFFFF: usz, = struct.unpack('<Q', d[p:p + 8]); p += 8
                if csz == 0xFFFFFFFF: csz, = struct.unpack('<Q', d[p:p + 8]); p += 8
                if off == 0xFFFFFFFF: off, = struct.unpack('<Q', d[p:p + 8]); p += 8
            k += 4 + hl
        out[name] = (meth, csz, usz, off); i += 46 + nl + el + cl
    return out

def member(E, name):
    meth, csz, usz, off = E[name]
    h = rng(off, off + 29); nl, el = struct.unpack('<HH', h[26:30]); s = off + 30 + nl + el
    d = rng(s, s + csz - 1)
    d = zlib.decompress(d, -15) if meth == 8 else d
    if len(d) != usz: raise SystemExit(f'{name}: size {len(d)} != {usz}')
    return d

# --- FileGDB table reader (layout as documented by GDAL's OpenFileGDB driver) ---
def varuint(b, p):
    v = s = 0
    while True:
        c = b[p]; p += 1; v |= (c & 0x7f) << s; s += 7
        if not c & 0x80: return v, p

def varint(b, p):
    c = b[p]; p += 1; v = c & 0x3f; neg = c & 0x40; s = 6
    while c & 0x80: c = b[p]; p += 1; v |= (c & 0x7f) << s; s += 7
    return (-v if neg else v), p

def fields(d):
    F, = struct.unpack('<q', d[32:40]); nf, = struct.unpack('<h', d[F + 12:F + 14]); p = F + 14; out = []; geo = None
    for _ in range(nf):
        n = d[p]; p += 1; name = d[p:p + 2 * n].decode('utf-16-le'); p += 2 * n
        n = d[p]; p += 1 + 2 * n
        t = d[p]; p += 1; f = {'name': name, 'type': t, 'nullable': False}
        if t == 4: p += 4; f['nullable'] = bool(d[p] & 1); p += 1; dl, p = varuint(d, p); p += dl
        elif t == 6: p += 2
        elif t == 7:
            p += 1; f['nullable'] = bool(d[p] & 1); p += 1
            wl, = struct.unpack('<H', d[p:p + 2]); p += 2; wkt = d[p:p + wl].decode('utf-16-le'); p += wl
            gf = d[p]; p += 1; hasM = bool(gf & 2); hasZ = bool(gf & 4)
            xo, yo, xys = struct.unpack('<ddd', d[p:p + 24]); p += 24 + 16 * hasM + 16 * hasZ + 8 + 8 * hasM + 8 * hasZ + 32
            # then (zmin, zmax and an m range, when present), a byte, a uint32 count of spatial grid sizes, the sizes
            for skip in (0, 16, 32):
                q = p + skip
                if d[q] in (0, 1) and 1 <= struct.unpack('<I', d[q + 1:q + 5])[0] <= 3: p = q + 5 + 8 * struct.unpack('<I', d[q + 1:q + 5])[0]; break
            else: raise SystemExit('geometry field header not understood')
            geo = {'wkt': wkt, 'xo': xo, 'yo': yo, 'xys': xys}
        elif t in (8, 10, 11, 12): p += 1; f['nullable'] = bool(d[p] & 1); p += 1
        elif t in (0, 1, 2, 3, 5): p += 1; f['nullable'] = bool(d[p] & 1); p += 1; p += 1 + d[p]
        else: raise SystemExit(f'field type {t} not handled')
        out.append(f)
    return out, geo

def rows(d, tablx):
    fl, geo = fields(d); nb = (sum(f['nullable'] for f in fl) + 7) // 8
    _, nblk, _, osz = struct.unpack('<iiii', tablx[:16])
    for k in range(nblk * 1024):
        o = int.from_bytes(tablx[16 + k * osz:16 + (k + 1) * osz], 'little')
        if not o: continue
        sz, = struct.unpack('<i', d[o:o + 4]); b = d[o + 4:o + 4 + sz]; p = nb; j = 0; rec = {}
        for f in fl:
            if f['type'] == 6: continue
            if f['nullable']:
                isnull = (b[j >> 3] >> (j & 7)) & 1; j += 1
                if isnull: rec[f['name']] = None; continue
            t = f['type']
            if t == 0: rec[f['name']] = struct.unpack('<h', b[p:p + 2])[0]; p += 2
            elif t == 1: rec[f['name']] = struct.unpack('<i', b[p:p + 4])[0]; p += 4
            elif t == 2: rec[f['name']] = struct.unpack('<f', b[p:p + 4])[0]; p += 4
            elif t == 4: l, p = varuint(b, p); rec[f['name']] = b[p:p + l].decode('utf-8', 'replace'); p += l
            elif t == 5: rec[f['name']] = struct.unpack('<d', b[p:p + 8])[0]; p += 8
            elif t == 3: rec[f['name']] = struct.unpack('<d', b[p:p + 8])[0]; p += 8
            elif t == 7: l, p = varuint(b, p); rec[f['name']] = b[p:p + l]; p += l
            else: raise SystemExit(f'row field type {t} not handled')
        yield rec, geo

def rings(blob, geo):
    p = 0; gt, p = varuint(blob, p)
    if (gt & 0xff) not in (5, 15, 19, 25, 51): raise SystemExit(f'geometry type {gt}')
    npts, p = varuint(blob, p)
    if not npts: return []
    nparts, p = varuint(blob, p)
    if gt & 0x20000000: _, p = varuint(blob, p)
    for _ in range(4): _, p = varuint(blob, p)
    counts = []
    for _ in range(nparts - 1): c, p = varuint(blob, p); counts.append(c)
    counts.append(npts - sum(counts)); x = y = 0; out = []
    for c in counts:
        r = []
        for _ in range(c):
            dx, p = varint(blob, p); dy, p = varint(blob, p); x += dx; y += dy
            r.append((round(x / geo['xys'] + geo['xo'], 1), round(y / geo['xys'] + geo['yo'], 1)))
        out.append(r)
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--connected', action='store_true', help='read Alameda_inundation_poly_<N> (connected flooding) instead of the low-lying tables')
    ap.add_argument('--levels', help='comma-separated levels in inches above MHHW (default: all ten)')
    ap.add_argument('--out', default=OUT, help=f'output directory (default {OUT})')
    args = ap.parse_args()
    prefix, stem = ('Alameda_inundation_poly_', 'inundation') if args.connected else ('Alameda_lowlying_poly_', 'lowlying')
    want = {int(v) for v in args.levels.split(',')} if args.levels else None
    os.makedirs(OUT, exist_ok=True); os.makedirs(args.out, exist_ok=True)
    dem = json.load(open('data/terrain/dem.json')); M = 50
    X0, X1, Y0, Y1 = dem['xmin'] - M, dem['xmax'] + M, dem['ymin'] - M, dem['ymax'] + M
    zipname, size = prep(); print(zipname, size, 'bytes', flush=True)
    E = central_directory(size)
    cat = member(E, f'{GDB}/a00000001.gdbtable'); catx = member(E, f'{GDB}/a00000001.gdbtablx')
    # GDB_SystemCatalog: row k (1-based) names table a<k as 8 hex digits>.
    tables = {}
    fl, _ = fields(cat); nb = (sum(f['nullable'] for f in fl) + 7) // 8
    _, nblk, _, osz = struct.unpack('<iiii', catx[:16])
    for k in range(nblk * 1024):
        o = int.from_bytes(catx[16 + k * osz:16 + (k + 1) * osz], 'little')
        if not o: continue
        sz, = struct.unpack('<i', cat[o:o + 4]); b = cat[o + 4:o + 4 + sz]; l, p = varuint(b, nb)
        tables[b[p:p + l].decode()] = f'a{k + 1:08x}'
    retrieved = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'); log = []
    for name, tid in sorted(tables.items()):
        if not name.startswith(prefix): continue
        inches = int(name.rsplit('_', 1)[1])
        if want is not None and inches not in want: continue
        d = member(E, f'{GDB}/{tid}.gdbtable'); x = member(E, f'{GDB}/{tid}.gdbtablx')
        feats = []; nfeat = nring = 0; wkt = None
        for rec, geo in rows(d, x):
            nfeat += 1; wkt = geo['wkt']; keep = []
            for r in rings(rec['Shape'], geo):
                nring += 1; xs = [c[0] for c in r]; ys = [c[1] for c in r]
                if max(xs) < X0 or min(xs) > X1 or max(ys) < Y0 or min(ys) > Y1: continue
                keep.append(r)
            if keep: feats.append({'depth_ft': rec['DEPTH_FT'], 'rings': keep} if args.connected else {'gridcode': rec['gridcode'], 'rings': keep})
        del d, x
        if 'NAD_1983_UTM_Zone_10N' not in wkt: raise SystemExit(f'unexpected CRS {wkt[:80]}')
        json.dump({'layer': name, 'inches': inches, 'crs': 'EPSG:26910 (NAD83 / UTM zone 10N), meters', 'wkt': wkt, 'retrieved': retrieved,
                   'source': f'{zipname} from {URL} (dl-key {KEY}), table {tid}', 'features': feats},
                  open(f'{args.out}/{stem}_{inches}.json', 'w'), separators=(',', ':'))
        kept = sum(len(f['rings']) for f in feats)
        log.append(f'{name} ({tid}): {nfeat} features, {nring} rings in the county; {kept} rings kept')
        print(log[-1], flush=True)
    meaning = ('Layer meaning (ART GIS data catalog, http://www.adaptingtorisingtides.org/wp-content/uploads/2017/04/GIS_data_catalog.pdf, p. 2): "These polygons identify low-lying areas greater than one acre. '
               'They depict areas that are below the inundated water surface elevation, but are not hydraulically-connected to the inundated areas."\n') if not args.connected else \
              ('Layer meaning: ART\'s connected flooding (inundated area hydraulically connected to the Bay), one feature per depth class (DEPTH_FT, feet), from the same ART study as '
               'the Caltrans service CHhqenvi/DEA_BCDC_polygon_SLR, which serves seven of the ten levels and differs from these polygons in detail (SOURCE_NOTES H5, C1).\n')
    open(f'{args.out}/{stem}.retrieved', 'w').write(
        f'ART Bay Area Sea Level Rise and Shoreline Analysis Maps (AECOM 2017 for BCDC/MTC), Alameda County geodatabase {zipname} ({size} bytes).\n'
        f'Source: {URL}, POST r=prep&f={KEY} then r=fetch, HTTP Range requests for the zip directory and the {prefix}<N> tables only.\n'
        f'Retrieved {retrieved}. Rings whose bounding box meets the terrain grid plus 50 m are kept, coordinates EPSG:26910 rounded to 0.1 m.\n'
        + meaning + '\n'.join(log) + '\n')
    os.remove(COOKIES)

if __name__ == '__main__':
    main()
