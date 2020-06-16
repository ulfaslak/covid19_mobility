"""This scripts runs through all existing flow data to collect baseline flow
counts between and within as many municipalities as possible. The purpose of
this is to have a good universal baseline that all time-series data can be
compared to. Baseline CSVs are stored in utils/globals/.

Assumes that `update_baseline_counts` and `fill_baseline` have run such that
baseline values for files in Facebook/population_tile are up
to date.
"""
import pandas as pd
import numpy as np
import os
import json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm
from countryinfo import CountryInfo

def run(country,iso,adm_region='adm1',adm_kommune='adm2'):
    def load_prepare(path):
        data = pd.read_csv(path)
        data = data.drop([
            'country', 'date_time','start_polygon_id', 'end_polygon_id', 'n_difference', 'n_crisis',
            'tile_size', 'level', 'is_statistically_significant', 'percent_change',
            'z_score','geometry'
        ], axis=1, errors='ignore')
        

        data[['start_lat','start_lon','end_lat','end_lon']] = data[['start_lat','start_lon','end_lat','end_lon']].round(3)
        
        return data

    def load_prepare_pop(path,iso):
        data = pd.read_csv(path)
        data = data[(data != "\\N").all(1)]
        data = data.loc[data.country == iso]
        data = data.drop([
            'country', 'date_time','ds', 'n_difference', 'n_crisis',
            'density_baseline', 'density_crisis', 'percent_change', 'clipped_z_score'
        ], axis=1)
        data = data.astype({'lat':float, 'lon':float, 'n_baseline':float})
        return data
    

    def getvalid(row):
        notnull = row.notnull()
        for i in range(len(row)):
            if notnull[i]:
                return row.values[i]

#     # Load global variable
#     with open("../utils/globals/kommune_region_map.json") as fp:
#         kommune_region_map = json.load(fp)

    PATH_IN = f'Facebook/{country}/movement_admin/'
    PATH_IN_POP = f'Facebook/{country}/population_tile/'
    PATH_OUT = f'utils/globals/{country}_'

    N_POP = CountryInfo(country).population()  # Danish population as of Thursday, April 16, 2020 (Worldometer)

    # Aggregate
    weekday_window_data = defaultdict(lambda: defaultdict(list))
    fn_days = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN) if fn.endswith('.csv')]))
    fn_days_pop = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN_POP) if fn.endswith('.csv')]))
    for idx, fn_day in tqdm(enumerate(fn_days), total=len(fn_days)):
        dt_obj = dt.datetime(year=int(fn_day[-10:-6]), month=int(fn_day[-5:-3]), day=int(fn_day[-2:]))
        weekday = dt_obj.weekday()
        for window in ['0000', '0800', '1600']:

            # Filter
            filename = fn_day + "_" + window + ".csv"
            filename_pop = fn_days_pop[idx] + "_" + window + ".csv"
            data = load_prepare(PATH_IN + filename)
            data_pop = load_prepare_pop(PATH_IN_POP + filename_pop,iso)


            data.index = [
                f"({slat},{slon}) → ({elat},{elon})" if (slat, slon) != (elat, elon) else f"({slat},{slon})"
                for slat, slon, elat, elon in
                zip(data['start_lat'], data['start_lon'], data['end_lat'], data['end_lon'])
            ]
            data['n_baseline'] *= N_POP / data_pop.n_baseline.astype(float).sum()
            weekday_window_data[weekday][window].append(data)
            
            
    # Concat
    for weekday, window_data in tqdm(weekday_window_data.items()):
        for window, data_ in window_data.items():

            # Concat, copy and aggregate columns
            data_ = pd.concat(data_, join="outer", axis=1)
            data = pd.DataFrame(index=data_.index)
            data['length_km'] = data_[['length_km']].mean(1)
            data['n_baseline'] = data_[['n_baseline']].sum(1)
            
            source_tile, target_tile = zip(*[v.split(" → ") if "→" in v else [v, v] for v in data.index])
            data['source_tile'] = source_tile
            data['target_tile'] = target_tile

            data['source_kommune'] = [getvalid(row) for _, row in data_['start_'+adm_kommune].iterrows()]
            data['target_kommune'] = [getvalid(row) for _, row in data_['end_'+adm_kommune].iterrows()]
            
            data['source_region'] = [getvalid(row) for _, row in data_['start_'+adm_region].iterrows()]
            data['target_region'] = [getvalid(row) for _, row in data_['end_'+adm_region].iterrows()]
            
            
            data = data.sort_values(['source_region', 'source_kommune', 'source_tile', 'target_region', 'target_kommune', 'target_tile'])

            data.to_csv(PATH_OUT + str(weekday) + "_" + window + ".csv")



if __name__ == "__main__":
    os.chdir("../")
    run()
