# Mean impervious surface (percent) per City watershed, from the NLCD 2021 impervious raster
# (MRLC GeoServer WCS, EPSG:5070, 30 m). Writes data/raw/nlcd/impervious-by-watershed.json.
# Run: python3 -I tools/fetch-impervious.py   (needs numpy and Pillow)
import json, math, urllib.request, io
import numpy as np
from PIL import Image

def albers(lon, lat):  # EPSG:5070, NAD83 / Conus Albers (GRS80), Snyder 1987 eqs. 14-3..14-6
    a, f = 6378137.0, 1 / 298.257222101; e2 = f * (2 - f); e = math.sqrt(e2)
    p1, p2, p0, l0 = map(math.radians, (29.5, 45.5, 23.0, -96.0))
    m = lambda p: math.cos(p) / math.sqrt(1 - e2 * math.sin(p) ** 2)
    q = lambda p: (1 - e2) * (math.sin(p) / (1 - e2 * math.sin(p) ** 2) - (1 / (2 * e)) * math.log((1 - e * math.sin(p)) / (1 + e * math.sin(p))))
    n = (m(p1) ** 2 - m(p2) ** 2) / (q(p2) - q(p1)); C = m(p1) ** 2 + n * q(p1)
    rho = lambda p: a * math.sqrt(C - n * q(p)) / n
    th = n * (math.radians(lon) - l0)
    return rho(math.radians(lat)) * math.sin(th), rho(p0) - rho(math.radians(lat)) * math.cos(th)

ws = json.load(open('data/raw/city/watersheds.geojson'))['features']
lons = [c[0] for f in ws for p in ([f['geometry']['coordinates']] if f['geometry']['type'] == 'Polygon' else f['geometry']['coordinates']) for c in p[0]]
lats = [c[1] for f in ws for p in ([f['geometry']['coordinates']] if f['geometry']['type'] == 'Polygon' else f['geometry']['coordinates']) for c in p[0]]
corners = [albers(lo, la) for lo in (min(lons), max(lons)) for la in (min(lats), max(lats))]
x0 = math.floor(min(c[0] for c in corners) / 30) * 30 - 60; x1 = math.ceil(max(c[0] for c in corners) / 30) * 30 + 60
y0 = math.floor(min(c[1] for c in corners) / 30) * 30 - 60; y1 = math.ceil(max(c[1] for c in corners) / 30) * 30 + 60
url = ('https://www.mrlc.gov/geoserver/ows?service=WCS&version=2.0.1&request=GetCoverage'
       f'&coverageId=mrlc_download__NLCD_2021_Impervious_L48&subset=X({x0},{x1})&subset=Y({y0},{y1})&format=image/geotiff')
img = np.array(Image.open(io.BytesIO(urllib.request.urlopen(url, timeout=180).read()))).astype(float)
H, W = img.shape; rx, ry = (x1 - x0) / W, (y1 - y0) / H
def inpoly(x, y, g):
    for p in ([g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']):
        r = p[0]; c = False
        for i in range(len(r)):
            xa, ya = r[i]; xb, yb = r[i - 1]
            if (ya > y) != (yb > y) and x < (xb - xa) * (y - ya) / (yb - ya) + xa: c = not c
        if c: return True
    return False
out = {}
for f in ws:
    g = f['geometry']; vals = []
    glons = [c[0] for p in ([g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']) for c in p[0]]
    glats = [c[1] for p in ([g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']) for c in p[0]]
    for la in np.arange(min(glats), max(glats), 0.0003):
        for lo in np.arange(min(glons), max(glons), 0.0003):
            if not inpoly(lo, la, g): continue
            x, y = albers(lo, la); c, r = int((x - x0) / rx), int((y1 - y) / ry)
            if 0 <= r < H and 0 <= c < W and img[r, c] <= 100: vals.append(img[r, c])
    out[f['properties']['NAME']] = {'imperviousPct': round(float(np.mean(vals)), 1), 'samples': len(vals)}
json.dump({'source': 'NLCD 2021 Percent Developed Imperviousness (CONUS), MRLC GeoServer WCS, coverage mrlc_download__NLCD_2021_Impervious_L48', 'url': url,
           'method': 'mean over sample points every 0.0003 degrees (about 30 m) inside each City watershed (data/raw/city/watersheds.geojson)', 'watersheds': out},
          open('data/raw/nlcd/impervious-by-watershed.json', 'w'), indent=1)
print(json.dumps(out, indent=0))
