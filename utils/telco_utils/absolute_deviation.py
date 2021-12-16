import pandas as pd
import os, json
import datetime as dt
from collections import defaultdict
from tqdm import tqdm

def run(country):
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


    def load_prepare(path,path_zips,ref_date):
        data = pd.read_csv(f'{path}df_safe.csv.gz', parse_dates=['date'],
                          dtype={'origin_area_code': 'int', 'destination_area_code': 'int'})
        #df2 = pd.read_csv(f'{path}df_safe_within.csv.gz', parse_dates=['date'],
        #                  dtype={'origin_area_code': 'int', 'destination_area_code': 'int'})
        data = compute_relative_change(data,ref_date)
        #df2 = compute_relative_change(df2,ref_date)
        #data = pd.concat([df1, df2])

        zips = pd.read_csv(f'{path_zips}zipcodes.csv')
        zips = zips.drop_duplicates(subset=['city_code', 'city']).set_index('city_code')
        zips['city'] = zips['city'].replace({"Aarhus":"Århus","Vesthimmerlands":"Vesthimmerland"}).str.replace('-',' ')


        data = pd.merge(data, zips[['city']], how='left', left_on='origin_area_code', right_on='city_code').rename(
            columns={'city': 'source_kommune'})
        data = pd.merge(data, zips[['city']], how='left', left_on='destination_area_code', right_on='city_code').rename(
            columns={'city': 'target_kommune'}).set_index('date')
        data = data.rename(columns={'all_ref': 'n_baseline', 'all': 'n_crisis', 'rel_change': 'percent_change'})

        return data

    def compute_relative_change(df,
                                ref_date=dt.datetime(2020, 3, 1)):

        # Relative change
        # import pdb;pdb.set_trace()
        # Compute total trips by origin
        trips_by_day_by_place = df.groupby(['date', 'origin_area_code', 'destination_area_code']).sum().reset_index()
        trips_by_day_by_place['weekday'] = trips_by_day_by_place['date'].apply(lambda x: x.weekday())

        # Compute the reference (median on that weekday in period before ref_data)
        tot_trips_ref = trips_by_day_by_place[trips_by_day_by_place.date < ref_date].groupby(
            ['weekday', 'origin_area_code', 'destination_area_code'])['all'].median().reset_index()

        # Merge with actual data on weekday
        df_change = pd.merge(trips_by_day_by_place, tot_trips_ref,
                             on=['weekday', 'origin_area_code', 'destination_area_code'],
                             how='left',
                             suffixes=['', '_ref']).fillna(5)

        # Compute relative change
        df_change['rel_change'] = (df_change['all'] - df_change['all_ref']) / df_change['all_ref']

        return df_change


    def defaultify(d, depth = 0):
        if isinstance(d, dict):
            if depth == 0:
                return defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: "undefined"))), {k: defaultify(v,depth+1) for k, v in d.items()})
            if depth ==1:
                return defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: "undefined")), {k: defaultify(v, depth + 1) for k, v in d.items()})
            if depth== 2:
                return defaultdict(lambda: defaultlist(lambda: "undefined"), {k: defaultify(v) for k, v in d.items()})
        if isinstance(d, list):
            tmp = defaultlist(lambda: "undefined")
            tmp.extend(d)
            return tmp
        else: 
            return d

    def percent_change(crisis, baseline):
        if baseline == 0:
            return 0
        return (crisis - baseline) / baseline



    def update_data_out(time, label, data, idx):
        data_out[time][label]['baseline'][idx] = int(sum(data.n_baseline))
        data_out[time][label]['crisis'][idx] = int(sum(data.n_crisis))
        #data_out[time][label]['percent_change'].append(float(data.percent_change.mean()))
        data_out[time][label]['percent_change'][idx] = percent_change(int(sum(data.n_crisis)),int(sum(data.n_baseline)))


    PATH_IN = f'/data/ctdk/raw/'
    PATH_IN_ZIPS = f'/data/ctdk/notebooks/'
    PATH_OUT = 'covid19.compute.dtu.dk/static/data/'
    start_date = dt.datetime(2020, 3, 1)

    path_boo = os.path.exists(f'{PATH_OUT}{country}_telco_change.json')

    if (path_boo):
        with open(f'{PATH_OUT}{country}_telco_change.json', 'r') as fp:
            data_out = json.load(fp)
            data_out = defaultify(data_out,0)
        start = len(data_out['_meta']['datetime'])
    else:
        data_out = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: "undefined"))))
        start = 0

    data_out['_meta']['defaults'] = {}
    data_out['_meta']['variables'] = {}
    data_out['_meta']['locations'] = []

    # usage: data_out1['08']['country'].append(value)
    # fn_days = sorted(set([fn[:-9] for fn in os.listdir(PATH_IN) if fn.endswith('.csv')]))
    data = load_prepare(PATH_IN,PATH_IN_ZIPS,start_date).dropna(subset=['source_kommune','target_kommune'])
    fn_days = data[data.index>start_date].index.unique().sort_values().strftime("%Y-%m-%d %H:%H:%H").to_list()

    #import pdb; pdb.set_trace()
    for idx, fn_day in tqdm(enumerate(fn_days[start:],start),total=len(fn_days[start:])):
        data_day = data.loc[fn_day]

        for fn_time in ['between','within']:
           
            # Filter
            if fn_time == 'between':
                data_day_type = data_day[data_day['origin_area_code'] != data_day['destination_area_code']]
            elif fn_time == 'within':
                data_day_type = data_day[data_day['origin_area_code'] == data_day['destination_area_code']]
            
            # Add data to data_out
            update_data_out(fn_time, 'all', data_day_type,idx)
            for adm2 in set(data_day_type['source_kommune']):
                update_data_out(fn_time, adm2, data_day_type[data_day_type['source_kommune'] == adm2],idx)



    # Time
    data_out['_meta']['datetime'] = fn_days

    # Save meta data
    big_location = max(data_out['within'], key=lambda key: data_out['within'][key]['baseline'])

    #Locations
    locations = sorted([*data_out['between']])
    locations.remove('all')
    data_out['_meta']['locations'] = ['all']+locations
    #data_out['_meta']['locations'] = sorted(data['source_kommune'].unique())

    #Defaults
    data_out['_meta']['defaults']['timeframe'] = 'between'
    data_out['_meta']['defaults']['level'] = big_location
    data_out['_meta']['defaults']['mode'] = 'relative'


    #Variables
    data_out['_meta']['variables']['startDate'] = "2020-02-18 00:00:00"
    data_out['_meta']['variables']['y_label_count'] = "Amount of trips"
    data_out['_meta']['variables']['y_label_relative'] = "Deviation from baseline"
    data_out['_meta']['variables']['title'] = "Change in amount of trips"
    data_out['_meta']['variables']['country_name'] = country.lower()

    #Extra
    data_out['_meta']['timeframes'] = ['within','between']


    # Save data
    with open(f'{PATH_OUT}{country}_telco_change.json', 'w') as fp:
        json.dump(data_out, fp)


if __name__ == "__main__":
    os.chdir("../../")
    run('Denmark')
