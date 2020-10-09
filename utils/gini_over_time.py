import pandas as pd
import numpy as np
import os, json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm
import requests as rq
from countryinfo import CountryInfo
from .utils import get_date_range

def run(country,iso,adm_region='adm1',adm_kommune='adm2'):
    def gini_coefficient(x):
        """Compute Gini coefficient of array of values"""
        diffsum = 0
        for i, xi in enumerate(x[:-1], 1):
            diffsum += np.sum(np.abs(xi - x[i:]))
        return diffsum / (len(x)**2 * np.mean(x))

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
    

    def percent_change(v0, v1):
        return (v1 - v0) / v0

    def getvalid(row):
        notnull = row.notnull()
        if notnull[0]:
            return row.values[0]
        if notnull[1]:
            return row.values[1]
        if notnull[2]:
            return row.values[2]


    def defaultify(d, depth = 0):
        if isinstance(d, dict):
            if depth == 0:
                return defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: "undefined"))), {k: defaultify(v,depth+1) for k, v in d.items()})
            if depth ==1:
                return defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: "undefined")), {k: defaultify(v, depth + 1) for k, v in d.items()})
            if depth== 2:
                return defaultdict(lambda: defaultlist(lambda: "undefined"), {k: defaultify(v) for k, v in d.items()})
        elif isinstance(d, list):
            tmp = defaultlist(lambda: "undefined")
            tmp.extend(d)
            return tmp
        else:
            return d

    # Data IO
    PATH_IN = f'Facebook/{country}/population_tile/'
    PATH_OUT = 'covid19.compute.dtu.dk/static/data/'

    path_boo = os.path.exists(f'{PATH_OUT}{country}_gini_over_time.json')
    if path_boo:
        with open(f'{PATH_OUT}{country}_gini_over_time.json', 'r') as fp:
            data_out = json.load(fp)
            data_out = defaultify(data_out,2)
        start = len(data_out['allday']['country']['baseline'])
    else:
        data_out = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: "undefined"))))
        start = 0
    # usage: data_out['08']['country']['entropy_baseline'].append(value)
    data_out['_meta']['defaults'] = {}
    data_out['_meta']['variables'] = {}
    data_out['_meta']['datetime'] = []
    data_out['_meta']['locations'] = []

    def update_data_out(time, label, data, idx):
        # Ginis
        data_out[time][label]['baseline'][idx]=gini_coefficient(data.n_baseline.values)
        data_out[time][label]['crisis'][idx]=gini_coefficient(data.n_crisis.values)
        data_out[time][label]['percent_change'][idx]=percent_change(data_out[time][label]['baseline'][idx], data_out[time][label]['crisis'][idx])

    fn_days_exists = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN) if fn.endswith('.csv')]))
    fn_days = get_date_range(country, fn_days_exists)
    for idx, fn_day in tqdm(enumerate(fn_days), total=len(fn_days)):
        if fn_day not in fn_days_exists:
            continue
        data_day = []
        allday_check = np.any([(data_out[fn_time[:2]]['country']['baseline'][idx]=='undefined') for fn_time in ['0000', '0800', '1600']])
        for fn_time in ['0000', '0800', '1600']:
            if not allday_check:
                continue
           
            # Filter
            filename = fn_day + "_" + fn_time + ".csv"
            try:
                data = load_prepare(PATH_IN + filename,iso)
            except FileNotFoundError:
                continue
            data.index = data['lat'].round(3).astype(str) + "," + data['lon'].round(3).astype(str)
            data = data.drop(['lat', 'lon'], axis=1)
            data_day.append(data)
            # Add data to data_out
            update_data_out(fn_time[:2], 'country', data, idx)
        
        if not allday_check:
            continue
        # Concat
        data_allday = pd.concat(data_day, join="outer", axis=1)
        data = data_allday.copy()
        data = data.drop(['n_baseline', 'n_crisis', adm_region], axis=1)
        if len(data_day) > 1:
            data['n_baseline'] = data_allday['n_baseline'].sum(1)
            data['n_crisis'] = data_allday['n_crisis'].sum(1)
            data[adm_region] = [getvalid(row) for _, row in data_allday[adm_region].iterrows()]
        elif len(data_day) == 1:
            data['n_baseline'] = data_allday['n_baseline']
            data['n_crisis'] = data_allday['n_crisis']
            data[adm_region] = data_allday[adm_region]
        else:
            continue
        
        # Add data to data_out
        update_data_out('allday', 'country', data, idx)
            


    # Time
    data_out['_meta']['datetime'] = [str(dt.datetime(int(d[-10:-6]), int(d[-5:-3]), int(d[-2:]))) for d in fn_days]

    # Save a list of the locations
    # locations = [*data_out['00']]
    # data_out['_meta']['locations'] = sorted(locations)
    data_out['_meta']['locations'] = ['country']

    #Defaults
    data_out['_meta']['defaults']['timeframe'] = 'allday'
    data_out['_meta']['defaults']['level'] = 'country'
    data_out['_meta']['defaults']['mode'] = 'relative'

    #Variables
    data_out['_meta']['variables']['startDate'] = "2020-02-18 00:00:00"
    data_out['_meta']['variables']['y_label_count'] = "Gini index"
    data_out['_meta']['variables']['y_label_relative'] = "Deviation from baseline"
    data_out['_meta']['variables']['title'] = f"Change in population distribution across {country}"
    data_out['_meta']['variables']['country_name'] = country.lower()

    # Extra
    data_out['_meta']['timeframes'] = ['allday', '08', '16']

    # Save data
    with open(f'{PATH_OUT}{country}_gini_over_time.json', 'w') as fp:
        json.dump(data_out, fp)



if __name__ == "__main__":
    os.chdir("../")
    run()
