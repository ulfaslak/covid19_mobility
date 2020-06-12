import matplotlib.pylab as plt
import pandas as pd
import numpy as np
import os
import json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm
import requests as rq
from countryinfo import CountryInfo

def run(country,iso,adm_region='adm1',adm_kommune='adm2'):

    class defaultlist(list):
        def __init__(self, fx):
            self._fx = fx
        def _fill(self, index):
            while len(self) <= index:
                self.append(self._fx())
        def __setitem__(self, index, value):
            self._fill(index)
            list.__setitem__(self, index, value)
        def __getitem__(self, index):
            self._fill(index)
            return list.__getitem__(self, index)

    def load_prepare_tile(path,iso):
        data = pd.read_csv(path)
        data = data.loc[data.country == iso]
        slon = data['start_lon'].to_list()
        slat = data['start_lat'].to_list()
        elon = data['end_lon'].to_list()
        elat = data['end_lat'].to_list()

        data = data.drop([
            'country', 'date_time','start_polygon_id', 'end_polygon_id', 'n_difference',
            'tile_size', 'level', 'is_statistically_significant', 'percent_change',
            'z_score', 'start_lat', 'start_lon', 'end_lat', 'end_lon', 'geometry'
        ], axis=1,errors = 'ignore')


        data['source_tile'] = [f"{lat},{lon}" for lat, lon in zip(np.array(slat).round(3), np.array(slon).round(3))]
        data['target_tile'] = [f"{lat},{lon}" for lat, lon in zip(np.array(elat).round(3), np.array(elon).round(3))]

        return data

#     def get_update_kommune(tiles, tile_kommune_map, updated_kommune):
#         kommunes = []
#         for idx in tiles:
#             if idx in tile_kommune_map:
#                 kommunes.append(tile_kommune_map[idx])
#             else:
#                 lat, lon = idx.split(",")
#                 res = rq.get(f'https://dawa.aws.dk/kommuner?x={lon}&y={lat}', headers={'User-agent': str(np.random.randint(100000))}).json()
#                 if len(res) == 0:
#                     kommune = np.nan
#                 else:
#                     kommune = res[0]['navn']
#                 tile_kommune_map[idx] = kommune
#                 kommunes.append(kommune)
#                 updated_kommune = True
#         return kommunes, tile_kommune_map, updated_kommune

    def defaultify(d, depth=0):
        if isinstance(d, dict):
            if depth == 0:
                return defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: "undefined"))),
                                   {k: defaultify(v, depth + 1) for k, v in d.items()})
            if depth == 1:
                return defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: "undefined")), {k: defaultify(v, depth + 1) for k, v in d.items()})
            if depth == 2:
                return defaultdict(lambda: defaultlist(lambda: "undefined"), {k: defaultify(v) for k, v in d.items()})
        elif isinstance(d, list):
            tmp = defaultlist(lambda: "undefined")
            tmp.extend(d)
            return tmp
        else:
            return d

    def percent_change(crisis, baseline):
        return (crisis - baseline) / baseline

    # Global paths
    PATH_IN = f'Facebook/{country}/movement_tile/'
    PATH_OUT = 'covid19.compute.dtu.dk/static/data/'


    # Danish population as of Thursday, April 16, 2020 (Worldometer)
    N_POP = CountryInfo(country).population()
        
    def update_data_out(level, idx, data):
        # `data_out`: fraction of population that remains stationary
        data_stat = data.loc[data.length_km == 0]
        data_out['allday'][level]['baseline'][idx] = np.nan_to_num(data_stat.n_baseline.sum() / data.n_baseline.sum())
        data_out['allday'][level]['crisis'][idx] = np.nan_to_num(data_stat.n_crisis.sum() / data.n_crisis.sum())
        data_out['allday'][level]['percent_change'][idx] = np.nan_to_num(percent_change(data_out['allday'][level]['crisis'][idx], data_out['allday'][level]['baseline'][idx]))

    # Data out stationary
    path_boo = os.path.exists(f"{PATH_OUT}{country}_total_stationarity.json")
    if path_boo:
        with open(f"{PATH_OUT}{country}_total_stationarity.json", 'r') as fp:
            data_out = json.load(fp)
            data_out = defaultify(data_out,0)
        start = len(data_out['allday']['all']['baseline'])
    else:
        data_out = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: "undefined"))))
        start = 0


    data_out['_meta']['defaults'] = {}
    data_out['_meta']['variables'] = {}
    data_out['_meta']['datetime'] = []
    data_out['_meta']['locations'] = []

    # Filenames
    fn_days = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN) if fn.endswith('.csv')]))

    # Loop
    for idx, fn_day in tqdm(enumerate(fn_days[start:]), total=len(fn_days[start:])):

        # Get the actual id for the date
        idx_date = idx + start
        
        # Get weekday
        dt_obj = dt.datetime(year=int(fn_day[-10:-6]), month=int(fn_day[-5:-3]), day=int(fn_day[-2:]))
        window = '1600'
        

        # Load and prepare data # 
        # --------------------- #

        filename = fn_day + "_" + window + ".csv"
        data = load_prepare_tile(PATH_IN + filename,iso)
    
        # Reindex for join
        data.index = [
            f"{source} → {target}" if source != target else f"{source}"
            for source, target in
            zip(data['source_tile'], data['target_tile'])
        ]

        # Renormalize to represent entire Danish population
        data['n_crisis'] *= N_POP / data.n_crisis.sum()
        data['n_baseline'] *= N_POP / data.n_baseline.sum()

        # Enrich data
#         data['source_kommune'], tile_kommune_map, updated_kommune = get_update_kommune(
#             data['source_tile'], tile_kommune_map, updated_kommune)
#         data['target_kommune'], tile_kommune_map, updated_kommune = get_update_kommune(
#             data['target_tile'], tile_kommune_map, updated_kommune)
        data['source_kommune'] = data['start_'+adm_kommune]
        data['target_kommune'] = data['end_'+adm_kommune]
        

        # Time #
        # ---- #

        #d = fn_day[-10:]
        #tstring = str(dt.datetime(int(d[:4]), int(d[5:7]), int(d[8:10])))
        #data_out['_meta']['datetime'][idx_date] = tstring
        
        # Get list of municipalities
        data_nn = data.loc[(data.source_kommune.notnull()) & (data.target_kommune.notnull())]
        kommunes = sorted(set(data_nn.source_kommune.tolist() + data_nn.target_kommune.tolist()))
        
        # Update data_out
        update_data_out('all', idx_date, data)
        for kommune in kommunes:
            data_kommune = data.loc[data.target_kommune == kommune]
            update_data_out(kommune, idx_date, data_kommune)




    # Time
    data_out['_meta']['datetime'] = [str(dt.datetime(int(d[-10:-6]), int(d[-5:-3]), int(d[-2:]))) for d in fn_days]

    locations = []
    for key, value in data_out['allday'].items():
        if key!='all':
            if ('undefined' not in value['percent_change']):
                if (sum(np.array(value['percent_change']) == 0) <= 2):
                    locations.append(key)

    data_out['_meta']['locations'] = ['all']+sorted(locations)

    # Defaults
    data_out['_meta']['defaults']['timeframe'] = 'allday'
    data_out['_meta']['defaults']['level'] = 'all'
    data_out['_meta']['defaults']['mode'] = 'relative'

    # Variables
    data_out['_meta']['variables']['startDate'] = "2020-02-18 00:00:00"
    data_out['_meta']['variables']['y_label_count'] = "Share of population"
    data_out['_meta']['variables']['y_label_relative'] = "Deviation from baseline"
    data_out['_meta']['variables']['title'] = f"Staying at (or near) home"
    data_out['_meta']['variables']['country_name'] = country.lower()

    #Extra
    data_out['_meta']['timeframes'] = ['allday']

    with open(f"{PATH_OUT}{country}_total_stationarity.json", 'w') as fp:
        json.dump(data_out, fp)

if __name__ == "__main__":
    os.chdir("../")
    run()