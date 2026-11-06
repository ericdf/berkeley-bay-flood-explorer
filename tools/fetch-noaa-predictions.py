"""NOAA hourly tide predictions at Richmond (9414863) for the king tide field windows
(SOURCE_NOTES E10, W14). Predictions are astronomical only: they leave out wind and
atmospheric pressure.
   python3 tools/fetch-noaa-predictions.py   writes data/raw/noaa/richmond-predictions-kingtide.csv
                                             and richmond-predictions-kingtide.retrieved"""
import urllib.request, json, datetime, sys, time

API = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter'
WINDOWS = [('20261124', '20261126'), ('20261223', '20261225'), ('20270121', '20270122')]
COMMON = 'station=9414863&product=predictions&interval=h&datum=NAVD&units=english&time_zone=lst_ldt&format=json&application=berkeley-bay-flood-explorer'

def get(begin, end):
    url = f'{API}?begin_date={begin}&end_date={end}&{COMMON}'
    for t in range(4):
        try:
            j = json.load(urllib.request.urlopen(url, timeout=120))
            if 'error' in j: sys.exit(f'{begin}-{end}: {j["error"]}')
            return j['predictions']
        except Exception as e:
            print('retry', begin, end, e, file=sys.stderr); time.sleep(2 ** (t + 1))
    sys.exit(f'failed: {url}')

with open('data/raw/noaa/richmond-predictions-kingtide.csv', 'w') as f:
    f.write('time_lst_ldt,ft_navd88\n')
    for b, e in WINDOWS:
        for r in get(b, e):
            f.write(f"{r['t']},{r['v']}\n")
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
open('data/raw/noaa/richmond-predictions-kingtide.retrieved', 'w').write(
    f'{API}, station 9414863, product predictions, interval h, datum NAVD, units english, time_zone lst_ldt; '
    f'windows {", ".join(b + "-" + e for b, e in WINDOWS)}; retrieved {stamp}\n')
