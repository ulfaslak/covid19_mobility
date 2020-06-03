import matplotlib.pylab as plt
import pandas as pd
import numpy as np
import os
import json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm
import requests as rq
from functools import partial
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
        data = data.drop([
            'country', 'date_time','start_polygon_id', 'end_polygon_id', 'n_difference',
            'tile_size', 'level', 'is_statistically_significant', 'percent_change',
            'z_score', 'start_lat', 'start_lon', 'end_lat', 'end_lon'
        ], axis=1)

        slonlat, elonlat = zip(*[
            geom[12:-1].split(", ")
            for geom in data.geometry
        ])
        
        slon, slat = zip(*[list(map(float, sll.split())) for sll in slonlat])
        elon, elat = zip(*[list(map(float, ell.split())) for ell in elonlat])

        data['source_tile'] = [f"{lat},{lon}" for lat, lon in zip(np.array(slat).round(3), np.array(slon).round(3))]
        data['target_tile'] = [f"{lat},{lon}" for lat, lon in zip(np.array(elat).round(3), np.array(elon).round(3))]

        data = data.drop(['geometry'], axis=1)

        return data

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


    def load_prepare_admin(path,iso):
        data = pd.read_csv(path)
        data = data.loc[data.country == iso]
        data = data.drop([
            'country', 'date_time','start_polygon_id', 'end_polygon_id', 'n_difference',
            'tile_size', 'level', 'is_statistically_significant', 'percent_change',
            'z_score', 'start_lat', 'start_lon', 'end_lat', 'end_lon', 'geometry'
        ], axis=1)
        return data



    def percent_change(crisis, baseline):
        return (crisis - baseline) / baseline

    # Global paths
    PATH_IN_TILE = f'Facebook/{country}/movement_tile/'
    PATH_IN_ADMIN = f'Facebook/{country}/movement_admin/'
    PATH_OUT = 'covid19.compute.dtu.dk/static/data/'


    # Danish population as of Thursday, April 16, 2020 (Worldometer)
    N_POP = CountryInfo(country).population()

    def update_data_out(level, idx, data):
        # `data_out`: total distance traveled per capita
        data_out['allday'][level]['baseline'][idx] = np.nan_to_num((data['length_km'] * data['n_baseline']).sum() / data['n_baseline'].sum())
        data_out['allday'][level]['crisis'][idx] = np.nan_to_num((data['length_km'] * data['n_crisis']).sum() / data['n_crisis'].sum())
        data_out['allday'][level]['percent_change'][idx] = np.nan_to_num(percent_change(data_out['allday'][level]['crisis'][idx], data_out['allday'][level]['baseline'][idx]))

    # Data out mobile
    path_boo = os.path.exists(f"{PATH_OUT}{country}_total_displacement.json")
    if path_boo:
        with open(f"{PATH_OUT}{country}_total_displacement.json", 'r') as fp:
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
    fn_days_tile = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN_TILE) if fn.endswith('.csv')]))
    fn_days_admin = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN_ADMIN) if fn.endswith('.csv')]))

    # Loop
    for idx, fn_day in tqdm(enumerate(fn_days_tile[start:]), total=len(fn_days_tile[start:])):
        # Get the actual id for the date
        idx_date = idx+start

        # Get weekday
        dt_obj = dt.datetime(year=int(fn_day[-10:-6]), month=int(fn_day[-5:-3]), day=int(fn_day[-2:]))
        weekday = dt_obj.weekday()
        window = '1600'

        
        # Load data
        filename = fn_day + "_" + window + ".csv"
        data_tile = load_prepare_tile(PATH_IN_TILE + filename,iso)
        filename = fn_days_admin[idx] + "_" + window + ".csv"
        data_admin = load_prepare_admin(PATH_IN_ADMIN + filename,iso)

        # Relabel
        data_tile['source_kommune'] = data_tile['start_'+adm_kommune]
        data_tile['target_kommune'] = data_tile['end_'+adm_kommune]
        data_admin['source_kommune'] = data_admin['start_'+adm_kommune]
        data_admin['target_kommune'] = data_admin['end_'+adm_kommune]
        
        # Keep only within-municipality flow in tile data
        data_tile = data_tile.loc[data_tile['source_kommune'] == data_tile['target_kommune']]

        # Keep only between-municipality flow in admin data
        data_admin = data_admin.loc[data_admin['source_kommune'] != data_admin['target_kommune']]

        # Merge data_tile and data_admin. Since we have removed within flow in admin and between
        # in tile, population counts should be preserved and no individual should be represnted
        # more than once in the data.
        data = pd.concat([data_tile, data_admin])
        
        # Renormalize to represent entire Danish population
        data['n_crisis'] *= N_POP / data.n_crisis.sum()
        data['n_baseline'] *= N_POP / data.n_baseline.sum()

        
        # Get list of municipalities
        data_nn = data.loc[(data.source_kommune.notnull()) & (data.target_kommune.notnull())]
        kommunes = sorted(set(data_nn.source_kommune.tolist() + data_nn.target_kommune.tolist()))
        
        # Update data_out
        update_data_out('all', idx_date, data)
        for kommune in kommunes:
            data_within_kommune = data.loc[data.target_kommune == kommune]
            update_data_out(kommune, idx_date, data_within_kommune)

    # Time
    data_out['_meta']['datetime'] = [str(dt.datetime(int(d[-10:-6]), int(d[-5:-3]), int(d[-2:]))) for d in fn_days_tile]

    # Locations
    locations = []
    for key, value in data_out['allday'].items():
        if key!='all':
            if ('undefined' not in value['percent_change']):
                if (sum(np.array(value['percent_change'])==0)<=2):
                    locations.append(key)

    data_out['_meta']['locations']=  ['all']+sorted(locations)

    #Defaults
    data_out['_meta']['defaults']['timeframe'] = 'allday'
    data_out['_meta']['defaults']['level'] = 'all'  #big lcoations
    data_out['_meta']['defaults']['mode'] = 'relative'

    #Variables
    data_out['_meta']['variables']['startDate'] = "2020-03-10 00:00:00"
    data_out['_meta']['variables']['y_label_count'] = "Daily dist. traveled [km]"
    data_out['_meta']['variables']['y_label_relative'] = "Deviation from baseline"
    data_out['_meta']['variables']['title'] = f"Per capita travel"
    data_out['_meta']['variables']['country_name'] = country.lower()

    #Extra
    data_out['_meta']['timeframes'] = ['allday']


    with open(f"{PATH_OUT}{country}_total_displacement.json", 'w') as fp:
        json.dump(data_out, fp)

if __name__ == "__main__":
    os.chdir("../")
    run()