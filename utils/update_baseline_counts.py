import pandas as pd
import numpy as np
import os
import json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm
from json.decoder import JSONDecodeError

def run(country,iso,adm_region='adm1',adm_kommune='adm2'):
    def load_prepare(path,iso):
        data = pd.read_csv(path)
        data = data[(data != "\\N").all(1)]
        data = data.loc[data.country == iso]
        data = data.drop([
            'country', 'date_time','ds', 'n_difference', 'density_baseline',
            'density_crisis', 'percent_change', 'clipped_z_score'
        ], axis=1)
        data = data.astype({'lat':float, 'lon':float, 'n_baseline':float, 'n_crisis':float})
        return data

    def default_to_regular(d):
        """Recursively convert nested defaultdicts to nested dicts."""
        if isinstance(d, defaultdict):
            d = {k: default_to_regular(v) for k, v in d.items()}
        return d

    PATH = f'Facebook/{country}/population_tile/'

    try:
        with open(f'utils/globals/{country}_tile_baseline.json','r+') as fp:
            tile_baseline = json.load(fp)
    except FileNotFoundError:
            tile_baseline = {}
    #import pdb;pdb.set_trace()
    fn_days = sorted(set([fn[:-9] for fn in os.listdir(PATH) if fn.endswith('.csv')]))
    for fn_day in tqdm(fn_days):
        dt_obj = dt.datetime(year=int(fn_day[-10:-6]), month=int(fn_day[-5:-3]), day=int(fn_day[-2:]))
        weekday = dt_obj.weekday()
        for window in ['0000', '0800', '1600']:
            # Filter
            filename = fn_day + "_" + window + ".csv"
            data = load_prepare(PATH + filename,iso)
            
            # Update tile_baseline
            for _, row in data.iterrows():
                latlon = f"{round(row.lat,3)}, {round(row.lon,3)}"
                if latlon not in tile_baseline:
                	tile_baseline[latlon] = defaultdict(dict)
                elif weekday not in tile_baseline[latlon]:
                	tile_baseline[latlon][weekday] = dict()
                tile_baseline[latlon][weekday][window] = row['n_baseline']

    with open(f'utils/globals/{country}_tile_baseline.json', 'w') as fp:
        json.dump(tile_baseline, fp)

if __name__ == "__main__":
    os.chdir("../")
    run()