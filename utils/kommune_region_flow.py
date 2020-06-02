import matplotlib.pylab as plt
import pandas as pd
import numpy as np
import os
import json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm
import requests as rq

from utils.utils import defaultlist

def run():
    def load_prepare(path):
        data = pd.read_csv(path)
        data = data.loc[data.country == 'DK']
        data = data.drop([
            'country', 'date_time','start_polygon_id', 'end_polygon_id', 'n_difference',
            'tile_size', 'level', 'is_statistically_significant', 'length_km', 'percent_change',
            'geometry', 'z_score', 'start_lat', 'start_lon', 'end_lat', 'end_lon'
        ], axis=1)
        return data

    updates_kommune = 0
    def get_update_region(kommunes, kommune_region_map):
        regions = []
        for kommune in kommunes:
            if kommune in kommune_region_map:
                regions.append(kommune_region_map[kommune])
            else:
                res = rq.get(f'https://dawa.aws.dk/kommuner/autocomplete?q={kommune}').json()
                region = res[0]['kommune']['region']['navn']
                kommune_region_map[kommune] = region
                regions.append(region)
                updates_kommune += 1
        return regions, kommune_region_map

    def percent_change(datum):
        return (datum['count_crisis'] - datum['count_baseline']) / datum['count_baseline'] * 100

    # Load global variable
    with open("utils/globals/kommune_region_map.json") as fp:
    	kommune_region_map = json.load(fp)

    # Global path
    PATH_IN = 'Facebook/movement_admin/'
    PATH_OUT = 'covid19.compute.dtu.dk/static/data/'

    data_out = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: np.nan)))))
    # usage: data_out['intraflow']['city_level']['København']['percent_change'][idx] = val

    fn_days = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN) if fn.endswith('.csv')]))
    for idx, fn_day in tqdm(enumerate(fn_days), total=len(fn_days)):
           
        data = []
        for fn_time in ['0000', '0800', '1600']:
           
            # Filter
            filename = fn_day + " " + fn_time + ".csv"
            data_ = load_prepare(PATH_IN + filename)
            
            data_.index = [
                f"{source} → {target}" if source != target else source
                for source, target in
                zip(data_['start_polygon_name'], data_['end_polygon_name'])
            ]
            data_ = data_.drop(['start_polygon_name', 'end_polygon_name'], axis=1)
            
            data.append(data_)
        
        # Concat
        data = pd.concat(data, join="outer", axis=1)
        
        # Aggregate
        data['count_crisis'] = data['n_crisis'].sum(1)
        data['count_baseline'] = data['n_baseline'].sum(1)
        data = data.drop(['n_crisis', 'n_baseline'], axis=1)
        
        # Add source/target columns...
        source_kommune, target_kommune = zip(*[v.split(" → ") if "→" in v else [v, v] for v in data.index])
        
        # ... for kommune
        data['source_kommune'] = source_kommune
        data['target_kommune'] = target_kommune
        
        # ... for region
        data['source_region'], kommune_region_map = get_update_region(source_kommune, kommune_region_map)
        data['target_region'], kommune_region_map = get_update_region(target_kommune, kommune_region_map)
        
        # Time #
        # ---- #
        d = fn_day[-10:]
        data_out['_meta']['_meta']['_meta']['datetime'].append(
            str(dt.datetime(int(d[:4]), int(d[5:7]), int(d[8:10])))
        )
        
        # Kommune level #
        # ------------- #
        
        # Get list of all kommunes
        kommunes = sorted(kommune_region_map.keys())
        
        # Intra-flow
        for kommune in kommunes:
            if kommune in data.index:
                datum = data.loc[kommune]
                data_out['intraflow']['kommune_level'][kommune]['count_baseline'][idx] = datum['count_baseline']
                data_out['intraflow']['kommune_level'][kommune]['count_crisis'][idx] = datum['count_crisis']
                data_out['intraflow']['kommune_level'][kommune]['percent_change'][idx] = percent_change(datum)
        
        # Out-flow
        data_grouped = data.loc[data.source_kommune != data.target_kommune].groupby('source_kommune').sum()
        for kommune in kommunes:
            if kommune in data_grouped.index:
                datum = data_grouped.loc[kommune]
                data_out['outflow']['kommune_level'][kommune]['count_baseline'][idx] = datum['count_baseline']
                data_out['outflow']['kommune_level'][kommune]['count_crisis'][idx] = datum['count_crisis']
                data_out['outflow']['kommune_level'][kommune]['percent_change'][idx] = percent_change(datum)
                
        # In-flow
        data_grouped = data.loc[data.source_kommune != data.target_kommune].groupby('target_kommune').sum()
        for kommune in kommunes:
            if kommune in data_grouped.index:
                datum = data_grouped.loc[kommune]
                data_out['inflow']['kommune_level'][kommune]['count_baseline'][idx] = datum['count_baseline']
                data_out['inflow']['kommune_level'][kommune]['count_crisis'][idx] = datum['count_crisis']
                data_out['inflow']['kommune_level'][kommune]['percent_change'][idx] = percent_change(datum)

                
        # Region level #
        # ------------ #
        
        # Get list of all regions
        regions = sorted(set(kommune_region_map.values()))
        
        # Intra-flow
        data_grouped = data.loc[data.source_region == data.target_region].groupby('source_region').sum()
        for region in regions:
            if region in data_grouped.index:
                datum = data_grouped.loc[region]
                data_out['intraflow']['region_level'][region]['count_baseline'][idx] = datum['count_baseline']
                data_out['intraflow']['region_level'][region]['count_crisis'][idx] = datum['count_crisis']
                data_out['intraflow']['region_level'][region]['percent_change'][idx] = percent_change(datum)
                
        # Out-flow
        data_grouped = data.loc[data.source_region != data.target_region].groupby('source_region').sum()
        for region in regions:
            if region in data_grouped.index:
                datum = data_grouped.loc[region]
                data_out['outflow']['region_level'][region]['count_baseline'][idx] = datum['count_baseline']
                data_out['outflow']['region_level'][region]['count_crisis'][idx] = datum['count_crisis']
                data_out['outflow']['region_level'][region]['percent_change'][idx] = percent_change(datum)
                
        # In-flow
        data_grouped = data.loc[data.source_region != data.target_region].groupby('target_region').sum()
        for region in regions:
            if region in data_grouped.index:
                datum = data_grouped.loc[region]
                data_out['inflow']['region_level'][region]['count_baseline'][idx] = datum['count_baseline']
                data_out['inflow']['region_level'][region]['count_crisis'][idx] = datum['count_crisis']
                data_out['inflow']['region_level'][region]['percent_change'][idx] = percent_change(datum)

    # Save global variable loaded at script start
    if updates_kommune > 0:
        with open("utils/globals/kommune_region_map.json", 'w') as fp:
        	json.dump(kommune_region_map, fp)

    # Save data
    with open(f"{PATH_OUT}kommune_region_flow.json", 'w') as fp:
    	json.dump(data_out, fp)

if __name__ == "__main__":
    os.chdir("../")
    run()