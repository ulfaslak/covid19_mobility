import pandas as pd
import numpy as np
import os, json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm
import requests as rq
from countryinfo import CountryInfo
from .utils import defaultify, get_date_range

def run(country,iso,adm_region='adm1',adm_kommune='adm2'):
    def load_prepare(path,iso):
        data = pd.read_csv(path)
        data = data[(data != "\\N").all(1)]
        data = data.loc[data.country == iso]
        data = data.drop([
            'country', 'date_time','ds', 'n_difference',
            'density_baseline', 'density_crisis', 'percent_change', 'clipped_z_score'
        ], axis=1)
        data = data.astype({'lat':float, 'lon':float, 'n_baseline':float, 'n_crisis':float})
        return data



    def percent_change(v0, v1):
        return (v1 - v0) / v0


    if country == 'Czechia':
        N_POP = CountryInfo('Czech Republic').population()
    else:
        N_POP = CountryInfo(country).population()
        

    def update_data_out(level, data08, data16, idx):
        data_diff_b = (data08.n_baseline - data16.n_baseline)
        data_diff_c = (data08.n_crisis - data16.n_crisis)
        data_out['allday'][level]['baseline'][idx] = data_diff_b.loc[data_diff_b > 0].sum()
        data_out['allday'][level]['crisis'][idx] = data_diff_c.loc[data_diff_c > 0].sum()
        data_out['allday'][level]['percent_change'][idx] = np.nan_to_num(percent_change(data_out['allday'][level]['baseline'][idx], data_out['allday'][level]['crisis'][idx]))
        

    PATH_IN = f'Facebook/{country}/population_tile/'
    PATH_OUT = 'covid19.compute.dtu.dk/static/data/'

    path_boo = os.path.exists(f'{PATH_OUT}{country}_night_day_difference.json')
    if path_boo:
        with open(f'{PATH_OUT}{country}_night_day_difference.json', 'r') as fp:
            data_out = json.load(fp)
            data_out = defaultify(data_out,0)
        start = len(data_out['allday']['all']['baseline'])
    else:
        data_out = defaultify({},0)

    data_out['_meta']['defaults'] = {}
    data_out['_meta']['variables'] = {}
    data_out['_meta']['datetime'] = []
    data_out['_meta']['locations'] = []

    fn_days_exists = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN) if fn.endswith('.csv')]))
    fn_days = get_date_range(country, fn_days_exists)
    for idx, fn_day in tqdm(enumerate(fn_days), total=len(fn_days)):
        if fn_day not in fn_days_exists:
            continue
        if data_out['allday']['all']['baseline'][idx] != 'undefined':
            continue

           
        # Load and filter
        try:    
            data08 = load_prepare(PATH_IN + fn_day + "_" + "0800" + ".csv",iso)
            data16 = load_prepare(PATH_IN + fn_day + "_" + "1600" + ".csv",iso)
        except FileNotFoundError:
            continue
        data08.index = data08['lat'].round(3).astype(str) + "," + data08['lon'].round(3).astype(str)
        data08['kommune'] = data08[adm_kommune]
        data08['n_baseline'] *= N_POP / data08.n_baseline.astype(float).sum()
        data08['n_crisis'] *= N_POP / data08.n_crisis.astype(float).sum()
        data08 = data08.drop(['lat', 'lon'], axis=1)

        data16.index = data16['lat'].round(3).astype(str) + "," + data16['lon'].round(3).astype(str)
        data16['kommune'] = data16[adm_kommune]
        data16['n_baseline'] *= N_POP / data16.n_baseline.astype(float).sum()
        data16['n_crisis'] *= N_POP / data16.n_crisis.astype(float).sum()
        data16 = data16.drop(['lat', 'lon'], axis=1)

        #import pdb; pdb.set_trace()

        data08_nn = data08.loc[data08.kommune.notnull()]
        data16_nn = data16.loc[data16.kommune.notnull()]
        kommunes = sorted(set(data08_nn.kommune.tolist() + data16_nn.kommune.tolist()))

        # Add data to data_out
        update_data_out('all', data08, data16, idx)
        for kommune in kommunes:
            data08_kommune = data08.loc[data08.kommune == kommune]
            data16_kommune = data16.loc[data16.kommune == kommune]
            update_data_out(kommune, data08_kommune, data16_kommune, idx)
            

    # Time
    data_out['_meta']['datetime'] = [str(dt.datetime(int(d[-10:-6]), int(d[-5:-3]), int(d[-2:]))) for d in fn_days]


    locations = []
    for key, value in data_out['allday'].items():
        if key!='all':
            if ('undefined' not in value['percent_change']):
                if (sum(np.array(value['percent_change']) == 0) <= 2) & (np.all(np.array(value['percent_change'])<1000000)):
                    locations.append(key)

    data_out['_meta']['locations'] = ['all']+sorted(locations)

    # Defaults
    data_out['_meta']['defaults']['level'] = 'all'
    data_out['_meta']['defaults']['mode'] = 'relative'
    data_out['_meta']['defaults']['timeframe'] = 'allday'

    # Variables
    data_out['_meta']['variables']['startDate'] = "2020-02-18 00:00:00"
    data_out['_meta']['variables']['y_label_count'] = "Number of people"
    data_out['_meta']['variables']['y_label_relative'] = "Deviation from baseline"
    data_out['_meta']['variables']['title'] = f"Going out during working hours"
    data_out['_meta']['variables']['country_name'] = country.lower()

    #Extra
    data_out['_meta']['timeframes'] = ['allday']

    # Save data
    with open(f'{PATH_OUT}{country}_night_day_difference.json', 'w') as fp:
        json.dump(data_out, fp)

if __name__ == "__main__":
    os.chdir("../")
    run()
