import pandas as pd
import numpy as np
import os, json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm
import requests as rq
from countryinfo import CountryInfo

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

    def defaultify(d, depth=0):
        if isinstance(d, dict):
            if depth == 0:
                return defaultdict(lambda: defaultdict(lambda: defaultdict(list)),
                                   {k: defaultify(v, depth + 1) for k, v in d.items()})
            if depth == 1:
                return defaultdict(lambda: defaultdict(list), {k: defaultify(v, depth + 1) for k, v in d.items()})
            if depth == 2:
                return defaultdict(list, {k: v for k, v in d.items()})



    N_POP = CountryInfo(country).population()  # Danish population as of Thursday, April 16, 2020 (Worldometer)

    def update_data_out(level, data08, data16):
        data_diff_b = (data08.n_baseline - data16.n_baseline)
        data_diff_c = (data08.n_crisis - data16.n_crisis)
        data_out['allday'][level]['baseline'].append(data_diff_b.loc[data_diff_b > 0].sum())
        data_out['allday'][level]['crisis'].append(data_diff_c.loc[data_diff_c > 0].sum())
        data_out['allday'][level]['percent_change'].append(
            np.nan_to_num(percent_change(data_out['allday'][level]['baseline'][-1], data_out['allday'][level]['crisis'][-1]))
        )

    PATH_IN = f'Facebook/{country}/population_tile/'
    PATH_OUT = 'covid19.compute.dtu.dk/static/data/'

    path_boo = os.path.exists(f'{PATH_OUT}{country}_night_day_difference.json')
    if path_boo:
        with open(f'{PATH_OUT}{country}_night_day_difference.json', 'r') as fp:
            data_out = json.load(fp)
            data_out = defaultify(data_out)
        start = len(data_out['allday']['all']['baseline'])
    else:
        data_out = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
        start = 0

    data_out['_meta']['defaults'] = {}
    data_out['_meta']['variables'] = {}
    data_out['_meta']['datetime'] = []
    data_out['_meta']['locations'] = []

    fn_days = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN) if fn.endswith('.csv')]))
    for fn_day in tqdm(fn_days[start:]):

           
        # Load and filter
        data08 = load_prepare(PATH_IN + fn_day + "_" + "0800" + ".csv",iso)
        data08.index = data08['lat'].round(3).astype(str) + "," + data08['lon'].round(3).astype(str)
        data08['kommune'] = data08[adm_kommune]
        data08['n_baseline'] *= N_POP / data08.n_baseline.astype(float).sum()
        data08['n_crisis'] *= N_POP / data08.n_crisis.astype(float).sum()
        data08 = data08.drop(['lat', 'lon'], axis=1)

        data16 = load_prepare(PATH_IN + fn_day + "_" + "1600" + ".csv",iso)
        data16.index = data16['lat'].round(3).astype(str) + "," + data16['lon'].round(3).astype(str)
        data16['kommune'] = data16[adm_kommune]
        data16['n_baseline'] *= N_POP / data16.n_baseline.astype(float).sum()
        data16['n_crisis'] *= N_POP / data16.n_crisis.astype(float).sum()
        data16 = data16.drop(['lat', 'lon'], axis=1)

        data08_nn = data08.loc[data08.kommune.notnull()]
        data16_nn = data16.loc[data16.kommune.notnull()]
        kommunes = sorted(set(data08_nn.kommune.tolist() + data16_nn.kommune.tolist()))

        # Add data to data_out
        update_data_out('all', data08, data16)
        for kommune in kommunes:
            data08_kommune = data08.loc[data08.kommune == kommune]
            data16_kommune = data16.loc[data16.kommune == kommune]
            update_data_out(kommune, data08_kommune, data16_kommune)
            

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
