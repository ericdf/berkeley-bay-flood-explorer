"""Rail lines in the explorer's area from the OpenStreetMap API (© OpenStreetMap contributors, ODbL).
   python3 tools/fetch-rail.py     writes data/raw/osm/rail.geojson and rail.retrieved

The Overpass API dropped every connection from the build environment on 2026-11-04, so this reads
the main API's /map call in small tiles over the corridor west of San Pablo Ave and keeps every way
tagged railway=*. tools/build-rail.mjs then keeps the main line."""
import urllib.request, xml.etree.ElementTree as ET, json, time, sys, datetime

TILES_LON = [-122.320 + 0.01 * i for i in range(4)]   # -122.32 to -122.28
TILES_LAT = [37.838 + 0.0135 * j for j in range(5)]   # 37.838 to 37.9055
UA = {'User-Agent': 'berkeley-bay-flood-explorer build script'}
nodes, ways = {}, {}
for lo in TILES_LON:
    for la in TILES_LAT:
        url = f'https://api.openstreetmap.org/api/0.6/map?bbox={lo:.4f},{la:.4f},{lo + 0.01:.4f},{la + 0.0135:.4f}'
        for t in range(4):
            try:
                body = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read(); break
            except Exception as e:
                print('retry', url, e, file=sys.stderr); time.sleep(2 ** (t + 1))
        else:
            sys.exit(f'failed: {url}')
        root = ET.fromstring(body)
        for n in root.iter('node'): nodes[n.get('id')] = (float(n.get('lon')), float(n.get('lat')))
        for w in root.iter('way'):
            tags = {t.get('k'): t.get('v') for t in w.iter('tag')}
            if 'railway' in tags: ways[w.get('id')] = {'tags': tags, 'nds': [nd.get('ref') for nd in w.iter('nd')]}
        time.sleep(1)
feats = [{'type': 'Feature', 'id': f'way/{wid}', 'properties': w['tags'],
          'geometry': {'type': 'LineString', 'coordinates': [nodes[n] for n in w['nds'] if n in nodes]}} for wid, w in sorted(ways.items())]
json.dump({'type': 'FeatureCollection', 'features': feats}, open('data/raw/osm/rail.geojson', 'w'))
open('data/raw/osm/rail.retrieved', 'w').write(
    'https://api.openstreetmap.org/api/0.6/map, 20 tiles from -122.32 to -122.28 and 37.838 to 37.9055; ways tagged railway=* '
    + datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ') + '\n')
print(len(feats), 'ways')
