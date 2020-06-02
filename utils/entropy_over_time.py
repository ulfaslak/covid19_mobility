import pandas as pd
import numpy as np
import os, json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm
import requests as rq

def run():
    def shannon_entropy(counts):
        """Compute shannon entropy of counts"""
        freq = np.array(counts) * 1.0 / np.sum(counts)
        return -np.sum([f * np.log2(f) for f in freq if f != 0])

    def gini_coefficient(x):
        """Compute Gini coefficient of array of values"""
        diffsum = 0
        for i, xi in enumerate(x[:-1], 1):
            diffsum += np.sum(np.abs(xi - x[i:]))
        return diffsum / (len(x)**2 * np.mean(x))

    def load_prepare(path):
        data = pd.read_csv(path)
        data = data[(data != "\\N").all(1)]
        data = data.loc[data.country == 'DK']
        data = data.drop([
            'country', 'date_time','ds', 'n_difference', 'density_baseline',
            'density_crisis', 'percent_change', 'clipped_z_score'
        ], axis=1)
        data = data.astype({'lat':float, 'lon':float, 'n_baseline':float, 'n_crisis':float})
        return data

    
    def percent_change(v0, v1):
        return (v1 - v0) / v0 * 100

    def getvalid(row):
        notnull = row.notnull()
        if notnull[0]:
            return row.values[0]
        if notnull[1]:
            return row.values[1]
        if notnull[2]:
            return row.values[2]



    # Data IO
    PATH_IN = 'Facebook/population_tile_admin/'
    PATH_OUT = 'covid19.compute.dtu.dk/static/data/'

    data_out = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    # usage: data_out['08']['country']['entropy_baseline'].append(value)

    def update_data_out(time, label, data):
        # Entropies
        data_out[time][label]['entropy_baseline'].append(
            shannon_entropy(data.n_baseline)
        )
        data_out[time][label]['entropy_lockdown'].append(
            shannon_entropy(data.n_crisis)
        )
        data_out[time][label]['entropy_percent_change'].append(
            percent_change(data_out[time][label]['entropy_baseline'][-1], data_out[time][label]['entropy_lockdown'][-1])
        )

        # Ginis
        data_out[time][label]['gini_baseline'].append(
            gini_coefficient(data.n_baseline.values)
        )
        data_out[time][label]['gini_lockdown'].append(
            gini_coefficient(data.n_crisis.values)
        )
        data_out[time][label]['gini_percent_change'].append(
            percent_change(data_out[time][label]['gini_baseline'][-1], data_out[time][label]['gini_lockdown'][-1])
        )

    fn_days = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN) if fn.endswith('.csv')]))
    for fn_day in tqdm(fn_days):
           
        data_day = []
        for fn_time in ['0000', '0800', '1600']:
           
            # Filter
            filename = fn_day + " " + fn_time + ".csv"
            data = load_prepare(PATH_IN + filename)
            data.index = data['lat'].round(3).astype(str) + "," + data['lon'].round(3).astype(str)
            #data['region'], tile_region_map, updated_region = get_update_region(data, tile_region_map, updated_region)
            data = data.drop(['lat', 'lon'], axis=1)
            data_day.append(data)
        
            # Add data to data_out
            update_data_out(fn_time[:2], 'country', data)
            for adm1 in set(data['adm1'].loc[data['adm1'].notnull()]):
                update_data_out(fn_time[:2], adm1, data.loc[data['adm1'] == adm1])
        
        # Concat
        data_allday = pd.concat(data_day, join="outer", axis=1)
        data = data_allday.copy()
        data = data.drop(['n_baseline', 'n_crisis', 'adm1'], axis=1)
        data['n_baseline'] = data_allday['n_baseline'].sum(1)
        data['n_crisis'] = data_allday['n_crisis'].sum(1)
        data['adm1'] = [getvalid(row) for _, row in data_allday['adm1'].iterrows()]
        
        # Add data to data_out
        update_data_out('allday', 'country', data)
        for adm1 in set(data['adm1'].loc[data['adm1'].notnull()]):
            update_data_out('allday', adm1, data.loc[data['adm1'] == adm1])
            
        # Time
        d = fn_day[-10:]
        data_out['_meta']['_meta']['datetime'].append(
            str(dt.datetime(int(d[:4]), int(d[5:7]), int(d[8:10])))
        )

    # Save data
    with open(f'{PATH_OUT}entropy_over_time.json', 'w') as fp:
        json.dump(data_out, fp)



if __name__ == "__main__":
    os.chdir("../")
    run()