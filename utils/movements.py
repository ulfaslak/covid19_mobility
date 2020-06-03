import matplotlib.pylab as plt
import pandas as pd
import numpy as np
import os
import json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm
import requests as rq

def run():

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

    def load_prepare_tile(path):
        data = pd.read_csv(path)
        data = data.loc[data.country == 'DK']
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


    def load_prepare_admin(path):
        data = pd.read_csv(path)
        data = data.loc[data.country == 'DK']
        data = data.drop([
            'country', 'date_time','start_polygon_id', 'end_polygon_id', 'n_difference',
            'tile_size', 'level', 'is_statistically_significant', 'percent_change',
            'z_score', 'start_lat', 'start_lon', 'end_lat', 'end_lon', 'geometry'
        ], axis=1)
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
    PATH_IN_TILE = 'Facebook/Denmark/movement_tile/'
    PATH_IN_ADMIN = 'Facebook/Denmark/movement_admin/'
    PATH_OUT = 'covid19.compute.dtu.dk/static/data/'

    # Boolean to check if `kommune_region_map` was updated
    updated_region = False
    updated_kommune = False

    # Danish population as of Thursday, April 16, 2020 (Worldometer)
    N_POP = 5_787_997

    def update_data_out(kommune, idx, data_):
        # Get population count inside kommune and remove 0 length trips
        n_pop_baseline = data_.loc[data_.target_kommune == kommune].n_baseline.sum()
        n_pop_crisis = data_.loc[data_.target_kommune == kommune].n_crisis.sum()
        data = data_.loc[data_.length_km > 0]

        # Compute flow into kommune. This counts how many from the kommune are going
        # to work in other kommunes
        data_kommune_is_target = data.loc[data.target_kommune == kommune]
        for neighbor in sorted(set(data_kommune_is_target.source_kommune)):

            # Compute how many people that live in `kommune` and work in `neighbor`
            flow_from_neighbor = data_kommune_is_target.loc[data_kommune_is_target.source_kommune == neighbor].sum()
            data_out[kommune][neighbor]['baseline'][idx][0] = flow_from_neighbor.n_baseline / n_pop_baseline
            data_out[kommune][neighbor]['crisis'][idx][0] = flow_from_neighbor.n_crisis / n_pop_crisis
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
        for neighbor in sorted(set(data_kommune_is_source.target_kommune)):

            # Compute how many people that live elsewhere and work in `kommune`
            flow_to_neighbor = data_kommune_is_source.loc[data_kommune_is_source.target_kommune == neighbor].sum()
            data_out[kommune][neighbor]['baseline'][idx][1] = flow_to_neighbor.n_baseline / n_pop_baseline
            data_out[kommune][neighbor]['crisis'][idx][1] = flow_to_neighbor.n_crisis / n_pop_crisis
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
    data_out = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: [0, 0]))))
    # data_out['Copenhagen']['Roskilde']['baseline'][idx] = [in, out]  # in: number of people that live here and go work anywhere; out: number of people that live anywhere and go to work here
    # data_out['Copenhagen']['Copenhagen']['baseline'][idx] = [within, within]
    data_out['_meta']['datetime'] = defaultlist(lambda: 'undefined')
    
    # I could come up with a more memory efficient data structure, because here,
    # each flow is written twice. A cleverer way, though more complicated, is to
    # sort each pair of destinations by initial letter, then sort names when
    # querying. But this might cost some computation in the browser...

    # Filenames
    fn_days_tile = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN_TILE) if fn.endswith('.csv')]))
    fn_days_admin = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN_ADMIN) if fn.endswith('.csv')]))

    # Loop
    for idx, fn_day in tqdm(enumerate(fn_days_tile), total=len(fn_days_tile)):
        
        # Get weekday
        dt_obj = dt.datetime(year=int(fn_day[-10:-6]), month=int(fn_day[-5:-3]), day=int(fn_day[-2:]))
        weekday = dt_obj.weekday()

        window = "1600"

        # Load data
        filename = fn_day + "_" + window + ".csv"
        data_tile = load_prepare_tile(PATH_IN_TILE + filename)
        filename = fn_days_admin[idx] + "_" + window + ".csv"
        data_admin = load_prepare_admin(PATH_IN_ADMIN + filename)

        # Relabel
        data_tile['source_kommune'] = data_tile['start_polygon_name']
        data_tile['target_kommune'] = data_tile['end_polygon_name']
        data_admin['source_kommune'] = data_admin['start_polygon_name']
        data_admin['target_kommune'] = data_admin['end_polygon_name']
        
        # Keep only within-municipality flow in tile data
        data_tile = data_tile.loc[data_tile['source_kommune'] == data_tile['target_kommune']]

        # Keep only between-municipality flow in admin data
        data_admin = data_admin.loc[data_admin['source_kommune'] != data_admin['target_kommune']]

        # Index
        data_tile.index = [
            f"{source} → {target}" if source != target else f"{source}"
            for source, target in
            zip(data_tile['source_tile'], data_tile['target_tile'])
        ]
        data_admin.index = [
            f"{source} → {target}"
            for source, target in
            zip(data_admin['source_kommune'], data_admin['target_kommune'])
        ]

        # Merge data_tile and data_admin. Since we have removed within flow in admin and between
        # in tile, population counts should be preserved and no individual should be represnted
        # more than once in the data.
        data = pd.concat([data_tile, data_admin])
        
        # Renormalize to represent entire Danish population
        data['n_crisis'] *= N_POP / data.n_crisis.sum()
        data['n_baseline'] *= N_POP / data.n_baseline.sum()
        
        # # Get max values
        # inMax = data.groupby('end_polygon_name').sum()[['n_baseline', 'n_crisis']].max().max()
        # outMax = data.loc[data.source_kommune != data.target_kommune].groupby('source_kommune').sum()[['n_baseline', 'n_crisis']].max().max()
        # betweenMax = data.loc[data.source_kommune != data.target_kommune][['n_baseline', 'n_crisis']].max().max()
        # data_out['_meta']['inMax'] = max(inMax, data_out['_meta']['inMax'])
        # data_out['_meta']['outMax'] = max(outMax, data_out['_meta']['outMax'])
        # data_out['_meta']['betweenMax'] = max(betweenMax, data_out['_meta']['betweenMax'])

        # Time #
        # ---- #
        d = fn_day[-10:]
        tstring = str(dt.datetime(int(d[:4]), int(d[5:7]), int(d[8:10])))
        data_out['_meta']['datetime'][idx] = tstring
        
        # Get list of municipalities
        data_nn = data.loc[(data.source_kommune.notnull()) & (data.target_kommune.notnull())]
        kommunes = sorted(set(data_nn.source_kommune.tolist() + data_nn.target_kommune.tolist()))

        # Filter list of names to remove inconsistencies
        kommunes = [k if k not in to_actual else to_actual[k] for k in kommunes]
        
        # Update data_out
        for kommune in kommunes:
            update_data_out(kommune, idx, data)

    # Get max values
    data_out['_meta']['inMax'] = 0
    data_out['_meta']['outMax'] = 0
    data_out['_meta']['betweenMax'] = 0
    for source in data_out:
        if source == '_meta':
            continue
        for target, data in data_out[source].items():
            baseline_in, baseline_out = zip(*data['baseline'])
            crisis_in, crisis_out = zip(*data['crisis'])
            if "_" + source == target:
                data_out['_meta']['inMax'] = max(
                    data_out['_meta']['inMax'],
                    max(crisis_in), max(baseline_in)
                )
                data_out['_meta']['outMax'] = max(
                    data_out['_meta']['outMax'],
                    max(crisis_out), max(baseline_out)
                )
            else:
                data_out['_meta']['betweenMax'] = max(
                    data_out['_meta']['betweenMax'],
                    max(baseline_in), max(baseline_out),
                    max(crisis_in), max(crisis_out)
                )


    # Add to _meta
    data_out['_meta']['radioOptions'] = ['percent_change', 'crisis', 'baseline']
    data_out['_meta']['defaults']['radioOption'] = 'percent_change'
    data_out['_meta']['defaults']['t'] = 0
    data_out['_meta']['defaults']['latMin'] = 54.53   # DEBUG: These should be infered from data
    data_out['_meta']['defaults']['latMax'] = 57.82   # DEBUG: These should be infered from data
    data_out['_meta']['defaults']['lonMin'] = 7.9     # DEBUG: These should be infered from data
    data_out['_meta']['defaults']['lonMax'] = 12.81   # DEBUG: These should be infered from data
    data_out['_meta']['variables']['legend_label_count'] = "Going to work"
    data_out['_meta']['variables']['legend_label_relative'] = "Percent change"

    with open(f"{PATH_OUT}Denmark_movements_between_admin_regions.json", 'w') as fp:
        json.dump(data_out, fp)

if __name__ == "__main__":
    os.chdir("../")
    run()

















