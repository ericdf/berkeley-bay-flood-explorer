# Download the ART flooding polygons that touch the explorer area (SOURCE_NOTES H5), one GeoJSON
# per water level, clipped by polygon bounding box. Writes art_<layer>.geojson in the current
# directory; tools/build-art.mjs rasterizes them. Run: python3 -I tools/fetch-art.py
import json,urllib.request,time,sys
B='https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhqenvi/DEA_BCDC_polygon_SLR/MapServer'
BB=(-122.345,37.835,-122.27,37.91)
def get(u):
    for i in range(4):
        try: return json.load(urllib.request.urlopen(u,timeout=300))
        except Exception as e: print('retry',e,file=sys.stderr); time.sleep(2**i)
    raise SystemExit('fail '+u)
info=get(B+'?f=json'); out={}
import os
for L in info['layers']:
    if os.path.exists(f"art_{L['id']}.geojson"): continue
    for _ in range(4):
        r=get(f"{B}/{L['id']}/query?where=1%3D1&geometry=-122.345,37.838,-122.28,37.905&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&returnIdsOnly=true&f=json")
        ids=r.get('objectIds')
        if ids is not None: break
        print('no ids',r,file=sys.stderr); time.sleep(5)
    ids=ids or []
    print(L['name'],'ids',len(ids),flush=True)
    feats=[]
    for oid in ids:
        d=get(f"{B}/{L['id']}/query?where=OBJECTID%3D{oid}&outFields=*&outSR=4326&maxAllowableOffset=0.00002&geometryPrecision=6&f=geojson")
        for f in d['features']:
            g=f['geometry']; polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
            keep=[]
            for p in polys:
                xs=[c[0] for c in p[0]];ys=[c[1] for c in p[0]]
                if max(xs)<BB[0] or min(xs)>BB[2] or max(ys)<BB[1] or min(ys)>BB[3]: continue
                keep.append(p)
            if keep: feats.append({'type':'Feature','properties':{'layer':L['name'],'depth_ft':f['properties'].get('DEPTH_FT')},'geometry':{'type':'MultiPolygon','coordinates':keep}})
        print(L['name'],oid,len(feats),flush=True)
    out[L['name']]=feats
    json.dump({'type':'FeatureCollection','features':feats},open(f"art_{L['id']}.geojson",'w'))
print('done')
