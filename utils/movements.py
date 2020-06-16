import matplotlib.pylab as plt
import pandas as pd
import numpy as np
import os, sys
import json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm
import requests as rq
from functools import partial
from countryinfo import CountryInfo

def run(country, iso, adm_region='adm1', adm_kommune='adm2'):

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

    def load_prepare_tile(path, iso):
        data = pd.read_csv(path)
        data = data.loc[data.country == iso]
        slon = data['start_lon'].to_list()
        slat = data['start_lat'].to_list()
        elon = data['end_lon'].to_list()
        elat = data['end_lat'].to_list()

        data = data.drop([
            'country', 'date_time','start_polygon_id', 'end_polygon_id', 'n_difference',
            'tile_size', 'level', 'is_statistically_significant', 'percent_change',
            'z_score', 'start_lat', 'start_lon', 'end_lat', 'end_lon','geometry'
        ], axis=1,errors = 'ignore')


        data['source_tile'] = [f"{lat},{lon}" for lat, lon in zip(np.array(slat).round(3), np.array(slon).round(3))]
        data['target_tile'] = [f"{lat},{lon}" for lat, lon in zip(np.array(elat).round(3), np.array(elon).round(3))]

        return data

    def defaultify(d, depth=0):
        if isinstance(d, dict):
            if depth == 0:
                return defaultdict(
                    lambda: defaultdict(
                        lambda: defaultdict(
                            lambda: defaultlist(lambda: [0, 0]))
                    ),
                    {k: defaultify(v, depth + 1) for k, v in d.items()}
                )
            if depth == 1:
                return defaultdict(
                    lambda: defaultdict(
                        lambda: defaultlist(lambda: [0, 0])
                    ), 
                    {k: defaultify(v, depth + 1) for k, v in d.items()}
                )
            if depth == 2:
                return defaultdict(
                    lambda: defaultlist(lambda: [0, 0]),
                    {k: defaultify(v) for k, v in d.items()}
                )
        elif isinstance(d, list):
            tmp = defaultlist(lambda: [0, 0])
            tmp.extend(d)
            return tmp
        else:
            return d


    def load_prepare_admin(path, iso):
        data = pd.read_csv(path)
        data = data.loc[data.country == iso]
        data = data.drop([
            'country', 'date_time','start_polygon_id', 'end_polygon_id', 'n_difference',
            'tile_size', 'level', 'is_statistically_significant', 'percent_change',
            'z_score', 'start_lat', 'start_lon', 'end_lat', 'end_lon', 'geometry'
        ], axis=1, errors = 'ignore')
        return data

    def getvalid(row):
        notnull = row.notnull()
        for i in range(len(row)):
            if notnull[i]:
                return row.values[i]

    def percent_change(crisis, baseline):
        if baseline == 0:
            return 0
        return (crisis - baseline) / baseline

    # Name inconsistency map
    to_actual = {'Nordfyn': 'Nordfyns'}

    # Global paths
    PATH_IN_TILE = f'Facebook/{country}/movement_tile/'
    PATH_IN_ADMIN = f'Facebook/{country}/movement_admin/'
    PATH_OUT = 'covid19.compute.dtu.dk/static/data/'


    # Danish population as of Thursday, April 16, 2020 (Worldometer)
    N_POP = CountryInfo(country).population()

    def update_data_out(kommune, idx, data_, data_pop):
        # Remove 0 length trips
        data = data_.loc[data_.length_km > 0]

        # Compute flow into kommune. This counts how many from the kommune are going
        # to work in other kommunes
        data_kommune_is_target = data.loc[data.target_kommune == kommune]
        neighbors = set(data_kommune_is_target.source_kommune)
        if len(neighbors) > 0:
            neighbors = sorted(neighbors | {kommune})

        for neighbor in neighbors:  # putting `kommune` in here as a nighbor to `kommune` so if it has 0 within flow then that will show in the output data

            # Compute how many people that live in `kommune` and work in `neighbor`
            flow_from_neighbor = data_kommune_is_target.loc[data_kommune_is_target.source_kommune == neighbor].sum()
            data_out[kommune][neighbor]['baseline'][idx][0] = flow_from_neighbor.n_baseline / data_pop.loc[kommune, 'n_baseline']
            data_out[kommune][neighbor]['crisis'][idx][0] = flow_from_neighbor.n_crisis / data_pop.loc[kommune, 'n_crisis']
            data_out[kommune][neighbor]['percent_change'][idx][0] = percent_change(
                data_out[kommune][neighbor]['crisis'][idx][0], data_out[kommune][neighbor]['baseline'][idx][0]
            )

            # Add this flow to the total flow inside the kommune. This way, its count will
            # represent the number of people in that kommune that go to work *anywhere*
            data_out[kommune]["_" + kommune]['baseline'][idx][0] += data_out[kommune][neighbor]['baseline'][idx][0]
            data_out[kommune]["_" + kommune]['crisis'][idx][0] += data_out[kommune][neighbor]['crisis'][idx][0]

        # Compute flow out of kommune. This counts how many people that live outside 
        # of the kommune and go to work the kommune
        data_kommune_is_source = data.loc[data.source_kommune == kommune]
        neighbors = set(data_kommune_is_source.target_kommune)
        if len(neighbors) > 0:
            neighbors = sorted(neighbors | {kommune})
            if not kommune in data_pop.index:
                neighbors = []
            
        for neighbor in neighbors:

            # Compute how many people that live elsewhere and work in `kommune`
            flow_to_neighbor = data_kommune_is_source.loc[data_kommune_is_source.target_kommune == neighbor].sum()
            data_out[kommune][neighbor]['baseline'][idx][1] = flow_to_neighbor.n_baseline / data_pop.loc[neighbor, 'n_baseline']
            data_out[kommune][neighbor]['crisis'][idx][1] = flow_to_neighbor.n_crisis / data_pop.loc[neighbor, 'n_crisis']
            data_out[kommune][neighbor]['percent_change'][idx][1] = percent_change(
                data_out[kommune][neighbor]['crisis'][idx][1], data_out[kommune][neighbor]['baseline'][idx][1]
            )

            # Add this flow to total outflow from kommune so it represents how many people
            # *from anywhere* that commute here during working hours
            data_out[kommune]["_" + kommune]['baseline'][idx][1] += data_out[kommune][neighbor]['baseline'][idx][1]
            data_out[kommune]["_" + kommune]['crisis'][idx][1] += data_out[kommune][neighbor]['crisis'][idx][1]

        # Recompute percent change for 'how many people go to work' for the kommune
        if data_kommune_is_target.shape[0] > 0:
            data_out[kommune]["_" + kommune]['percent_change'][idx][0] = percent_change(
                data_out[kommune]["_" + kommune]['crisis'][idx][0],
                data_out[kommune]["_" + kommune]['baseline'][idx][0]
            )
        # Recompute percent change for 'how many people work here' for the kommune
        if data_kommune_is_source.shape[0] > 0:
            data_out[kommune]["_" + kommune]['percent_change'][idx][1] = percent_change(
                data_out[kommune]["_" + kommune]['crisis'][idx][1],
                data_out[kommune]["_" + kommune]['baseline'][idx][1]
            )


    # Data out mobile
    path_boo = os.path.exists(f"{PATH_OUT}{country}_movements_between_admin_regions.json")
    if path_boo:
        with open(f"{PATH_OUT}{country}_movements_between_admin_regions.json", 'r') as fp:
            data_out = json.load(fp)
            data_out = defaultify(data_out, 0)
        start = len(data_out['_meta']['datetime'])
    else:
        data_out = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: [0, 0]))))
        start = 0
    
    #data_out['_meta']['datetime'] = defaultlist(lambda: 'undefined')

    data_out['_meta']['defaults'] = {}
    data_out['_meta']['variables'] = {}
    data_out['_meta']['datetime'] = []

    # Filenames
    fn_days_tile = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN_TILE) if fn.endswith('.csv')]))
    fn_days_admin = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN_ADMIN) if fn.endswith('.csv')]))


    # Check to make sure the it is the same dates for each data set.
    if fn_days_admin[0]!=fn_days_tile[0]:
        if fn_days_admin[0] in fn_days_tile:
            start_idx = fn_days_tile.index(fn_days_admin[0])
            fn_days_tile = fn_days_tile[start_idx:]
        elif fn_days_tile[0] in fn_days_admin:
            start_idx = fn_days_admin.index(fn_days_tile[0])
            fn_days_admin= fn_days_admin[start_idx:]

    end_idx = min(len(fn_days_tile),len(fn_days_admin))


    # Loop
    for idx, fn_day in tqdm(enumerate(fn_days_tile[start:end_idx], start), total=len(fn_days_tile[start:end_idx])):
        
        # Get weekday
        dt_obj = dt.datetime(year=int(fn_day[-10:-6]), month=int(fn_day[-5:-3]), day=int(fn_day[-2:]))
        weekday = dt_obj.weekday()
        window = "1600"


        # Load data
        filename = fn_day + "_" + window + ".csv"
        data_tile = load_prepare_tile(PATH_IN_TILE + filename, iso)
        filename = fn_days_admin[idx] + "_" + window + ".csv"
        data_admin = load_prepare_admin(PATH_IN_ADMIN + filename, iso)

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

        # Filter list of names to remove inconsistencies
        kommunes = [k if k not in to_actual else to_actual[k] for k in kommunes]
        
        data_pop = data[['target_kommune', 'n_crisis', 'n_baseline']].groupby('target_kommune').sum()

        # Update data_out
        for kommune in kommunes:
            update_data_out(kommune, idx, data, data_pop)

    # Time
    data_out['_meta']['datetime'] = [
        str(dt.datetime(int(d[-10:-6]), int(d[-5:-3]), int(d[-2:])))
        for d in fn_days_tile[:end_idx]
    ]

    # Get max values
    data_out['_meta']['variables']['inMax'] = 0
    data_out['_meta']['variables']['outMax'] = 0
    data_out['_meta']['variables']['betweenMax'] = 0
    for source in data_out:
        if source == '_meta':
            continue
        for target, data in data_out[source].items():
            baseline_in, baseline_out = zip(*data['baseline'])
            crisis_in, crisis_out = zip(*data['crisis'])
            if "_" + source == target:
                data_out['_meta']['variables']['inMax'] = max(
                    data_out['_meta']['variables']['inMax'],
                    max(crisis_in), max(baseline_in)
                )
                data_out['_meta']['variables']['outMax'] = max(
                    data_out['_meta']['variables']['outMax'],
                    max(crisis_out), max(baseline_out)
                )
            else:
                data_out['_meta']['variables']['betweenMax'] = max(
                    data_out['_meta']['variables']['betweenMax'],
                    max(baseline_in), max(baseline_out),
                    max(crisis_in), max(crisis_out)
                )

    # Add to _meta
    data_out['_meta']['radioOptions'] = ['percent_change', 'crisis', 'baseline']
    data_out['_meta']['defaults']['radioOption'] = 'percent_change'
    data_out['_meta']['defaults']['t'] = len(fn_days_tile[:end_idx])-1
    data_out['_meta']['defaults']['idx0or1'] = 0
    data_out['_meta']['variables']['legend_label_count'] = "Going to work"
    data_out['_meta']['variables']['legend_label_relative'] = "Percent change"

    with open('utils/data/country-bb.json') as fp:
        cbb = json.load(fp)[iso][1]

    data_out['_meta']['defaults']['latMin'] = cbb[1]
    data_out['_meta']['defaults']['latMax'] = cbb[3]
    data_out['_meta']['defaults']['lonMin'] = cbb[0]
    data_out['_meta']['defaults']['lonMax'] = cbb[2]


    with open(f"{PATH_OUT}{country}_movements_between_admin_regions.json", 'w') as fp:
        json.dump(data_out, fp)

if __name__ == "__main__":
    os.chdir("../")
    _, country, iso, adm_region, adm_kommune = sys.argv
    run(country, iso, adm_region, adm_kommune)
    # e.g. python movements.py Denmark DK adm1 adm2

















