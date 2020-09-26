import pandas as pd
import numpy as np
import os, json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm
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

    def load_prepare(path,iso):
        data = pd.read_csv(path)
        data = data[(data != "\\N").all(1)]
        data = data.loc[data.country == iso]
        data = data.drop([
            'country', 'date_time','ds', 'n_difference',#'n_baseline', 'n_crisis',
            'density_baseline', 'density_crisis', 'percent_change', 'clipped_z_score'
        ], axis=1)
        data = data.astype({'lat':float, 'lon':float,'n_baseline':float, 'n_crisis':float})
        return data


    def percent_change(v0, v1):
        if (v0 != 'undefined') and (v1 != 'undefined'):
            return (v1 - v0) / v0
        else:
            return 'undefined'

    def get_date_range(country,days):
        start_date = dt.datetime.strptime(days[0][len(country)+1:],"%Y_%m_%d")
        end_date = dt.datetime.strptime(days[-1][len(country)+1:],"%Y_%m_%d")
        t_diff = (end_date - start_date).days
        days = [(start_date+dt.timedelta(days=i)).strftime(f"{country}_%Y_%m_%d") for i in range(t_diff+1)]
        return days

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

    if country == "Czechia":
        N_POP = CountryInfo('Czech Republic').population()
    else:
        N_POP = CountryInfo(country).population()  # Danish population as of Thursday, April 16, 2020 (Worldometer)

    def update_data_out1(time, label, data):
        data_out1[time][label][idx] = (sum(abs(data.n_crisis - data.n_baseline)) / 2) / sum(data.n_baseline)

    def update_data_out2(time, label, data,idx):
        data_out2[time][label]['baseline'][idx] = sum(data.n_baseline)
        data_out2[time][label]['crisis'][idx] = sum(data.n_crisis)
        data_out2[time][label]['percent_change'][idx] = percent_change(data_out2[time][label]['baseline'][idx], data_out2[time][label]['crisis'][idx])



    PATH_IN = f'Facebook/{country}/population_tile/'
    PATH_OUT = 'covid19.compute.dtu.dk/static/data/'

    path1_boo = os.path.exists(f'{PATH_OUT}{country}_difference.json')
    path2_boo = os.path.exists(f'{PATH_OUT}{country}_change.json')

    if (path1_boo) & (path2_boo):
        with open(f'{PATH_OUT}{country}_difference.json', 'r') as fp:
            data_out1 = json.load(fp)
            data_out1 = defaultify(data_out1,1)
        with open(f'{PATH_OUT}{country}_change.json', 'r') as fp:
            data_out2 = json.load(fp)
            data_out2 = defaultify(data_out2,0)
        start = len(data_out1['allday']['country'])
    else:
        data_out1 = defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: "undefined")))
        data_out2 = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: "undefined"))))
        start = 0

    data_out2['_meta']['defaults'] = {}
    data_out2['_meta']['variables'] = {}
    data_out2['_meta']['locations'] = []

    data_out1['_meta']['defaults'] = {}
    data_out1['_meta']['variables'] = {}
    data_out1['_meta']['locations'] = []

    # usage: data_out1['08']['country'].append(value)
    fn_days_exists = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN) if fn.endswith('.csv')]))
    fn_days = get_date_range(country,fn_days_exists)
    for idx, fn_day in tqdm(enumerate(fn_days), total=len(fn_days)):
        if fn_day not in fn_days_exists:
            continue
        data_day = []
        data = None
        allday_check = np.any([(data_out1[fn_time[:2]]['country'][idx] == 'undefined') for fn_time in ['0000', '0800', '1600']])
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

            data['n_baseline'] *= N_POP / data.n_baseline.astype(float).sum()
            data['n_crisis'] *= N_POP / data.n_crisis.astype(float).sum()
            data_day.append(data)
             
            # Add data to data_out
            #import pdb;pdb.set_trace()
            update_data_out1(fn_time[:2], 'country', data)
            for adm2 in set(data[adm_kommune].loc[data[adm_kommune].notnull()]):
                update_data_out2(fn_time[:2], adm2, data.loc[data[adm_kommune] == adm2],idx)
        
        if not allday_check:
            continue
        # Concat
        data_allday = pd.concat(data_day, join="outer", axis=1)
        data = data_allday.copy()
        data = data.drop(['n_baseline', 'n_crisis', adm_region, adm_kommune], axis=1)
        if len(data_day)>1:
            data['n_baseline'] = data_allday['n_baseline'].mean(1)
            data['n_crisis'] = data_allday['n_crisis'].mean(1)
            data[adm_region] = [getvalid(row) for _, row in data_allday[adm_region].iterrows()]
            data[adm_kommune] = [getvalid(row) for _, row in data_allday[adm_kommune].iterrows()]
        elif len(data_day) == 1:
            data['n_baseline'] = data_allday['n_baseline']
            data['n_crisis'] = data_allday['n_crisis']
            data[adm_region] = data_allday[adm_region]
            data[adm_kommune] = data_allday[adm_kommune]
        else:
            continue

        # Add data to data_out
        update_data_out1('allday', 'country', data)
        for adm2 in set(data[adm_kommune].loc[data[adm_kommune].notnull()]):
            update_data_out2('allday', adm2, data.loc[data[adm_kommune] == adm2],idx)


    # Time
    data_out1['_meta']['datetime'] = [str(dt.datetime(int(d[-10:-6]), int(d[-5:-3]), int(d[-2:]))) for d in fn_days]
    data_out2['_meta']['datetime'] = [str(dt.datetime(int(d[-10:-6]), int(d[-5:-3]), int(d[-2:]))) for d in fn_days]

    # Save meta data
    big_location = max(data_out2['allday'], key=lambda key: [x for x in data_out2['allday'][key]['baseline'] if x != 'undefined'])

    #Locations
    data_out2['_meta']['locations'] = sorted([*data_out2['00']])
    data_out1['_meta']['locations'] = sorted([*data_out1['00']])

    #Defaults
    data_out2['_meta']['defaults']['timeframe'] = 'allday'
    data_out2['_meta']['defaults']['level'] = big_location
    data_out2['_meta']['defaults']['mode'] = 'relative'

    data_out1['_meta']['defaults']['timeframe'] = 'allday'
    data_out1['_meta']['defaults']['level'] = 'country'


    #Variables
    data_out2['_meta']['variables']['startDate'] = "2020-02-18 00:00:00"
    data_out2['_meta']['variables']['y_label_count'] = "Population size"
    data_out2['_meta']['variables']['y_label_relative'] = "Deviation from baseline"
    data_out2['_meta']['variables']['title'] = "Change in population size"
    data_out2['_meta']['variables']['country_name'] = country.lower()

    data_out1['_meta']['variables']['startDate'] = "2020-02-18 00:00:00"
    data_out1['_meta']['variables']['y_label'] = "Share of population"
    data_out1['_meta']['variables']['title'] = "Share of population relocated"
    data_out1['_meta']['variables']['country_name'] = country.lower()

    #Extra
    data_out2['_meta']['timeframes'] = ['allday', '08', '16']
    data_out1['_meta']['timeframes'] = ['allday', '08', '16']


    # Save data
    with open(f'{PATH_OUT}{country}_difference.json', 'w') as fp:
        json.dump(data_out1, fp)
    with open(f'{PATH_OUT}{country}_change.json', 'w') as fp:
        json.dump(data_out2, fp)


if __name__ == "__main__":
    os.chdir("../")
    run()
