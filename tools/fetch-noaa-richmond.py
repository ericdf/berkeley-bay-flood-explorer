"""Measured water levels at NOAA's Richmond gauge (9414863), in ft NAVD88, for how long and how often
the Bay stands above a level (SOURCE_NOTES W19, C26).
   python3 tools/fetch-noaa-richmond.py      writes data/raw/noaa/richmond-hourly.csv,
                                             richmond-highlow.csv and richmond.retrieved
NOAA CO-OPS data API, verified products: hourly heights and daily highs and lows, 2016 through 2025,
one request per year; public domain."""
import urllib.request, json, datetime, sys, time

API = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter'
COMMON = 'station=9414863&datum=NAVD&units=english&time_zone=lst_ldt&format=json&application=berkeley-bay-flood-explorer'

def get(product, y):
    url = f'{API}?product={product}&begin_date={y}0101&end_date={y}1231&{COMMON}'
    for t in range(4):
        try:
            j = json.load(urllib.request.urlopen(url, timeout=120))
            if 'error' in j: sys.exit(f'{product} {y}: {j["error"]}')
            return j['data']
        except Exception as e:
            print('retry', product, y, e, file=sys.stderr); time.sleep(2 ** (t + 1))
    sys.exit(f'failed: {url}')

with open('data/raw/noaa/richmond-hourly.csv', 'w') as h, open('data/raw/noaa/richmond-highlow.csv', 'w') as hl:
    h.write('time_lst_ldt,ft_navd88\n'); hl.write('time_lst_ldt,ft_navd88,type\n')
    for y in range(2016, 2026):
        for r in get('hourly_height', y):
            if r['v'] != '': h.write(f"{r['t']},{r['v']}\n")
        for r in get('high_low', y):
            if r['v'] != '': hl.write(f"{r['t']},{r['v']},{r['ty'].strip()}\n")
        print(y, file=sys.stderr)
open('data/raw/noaa/richmond.retrieved', 'w').write(
    f'{API}, station 9414863, products hourly_height and high_low, datum NAVD, units english, 2016-01-01 to 2025-12-31 '
    + datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ') + '\n')
