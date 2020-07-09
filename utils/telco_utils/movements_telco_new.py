import pandas as pd
import matplotlib.pyplot as plt
import datetime
import json
from countryinfo import CountryInfo
from collections import defaultdict
from tqdm import tqdm
import os

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

    def percent_change(crisis, baseline):
        if baseline == 0:
            return 0
        return (crisis - baseline) / baseline

    def defaultify(d, depth = 0):
        if isinstance(d, dict):
            if depth == 0:
                return defaultdict(
                    lambda: defaultdict(
                        lambda: defaultlist(lambda: 0)
                    ),
                    {k: defaultify(v, depth + 1) for k, v in d.items()}
                )
            if depth == 1:
                return defaultdict(
                    lambda: defaultlist(lambda: 0),
                    {k: defaultify(v, depth + 1) for k, v in d.items()}
                )

        elif isinstance(d, list):
            tmp = defaultlist(lambda: 0)
            tmp.extend(d)
            return tmp
        else:
            return d


    def compute_relative_change(df,
                                ref_date=datetime.datetime(2020, 3, 1)):
        # Relative change
        # Compute total trips by origin
        trips_by_day_by_place = df.groupby(['date', 'origin_area_code', 'destination_area_code']).sum().reset_index()
        trips_by_day_by_place['weekday'] = trips_by_day_by_place['date'].apply(lambda x: x.weekday())

        # Compute the reference (median on that weekday in period before ref_data)
        tot_trips_ref = trips_by_day_by_place[trips_by_day_by_place.date < ref_date].groupby(
            ['weekday', 'origin_area_code', 'destination_area_code'])['all'].median().reset_index()
        # import pdb;pdb.set_trace()
        # Merge with actual data on weekday
        df_change = pd.merge(trips_by_day_by_place, tot_trips_ref,
                             on=['weekday', 'origin_area_code', 'destination_area_code'],
                             how='left',
                             suffixes=['', '_ref']).fillna(5)

        # Compute relative change
        # df_change['rel_change']=(df_change['all'] - df_change['all_ref'])/df_change['all_ref']

        return df_change


    def update_data_out(kommune, idx, data_):
        data = data_

        # import pdb;pdb.set_trace()

        # Compute flow into kommune. This counts how many from the kommune are going
        # to work in other kommunes
        data_kommune_is_target = data.loc[data.target_kommune == kommune]
        neighbors = set(data_kommune_is_target.source_kommune)
        if len(neighbors) > 0:
            neighbors = sorted(neighbors | {kommune})

        for neighbor in neighbors:  # putting `kommune` in here as a nighbor to `kommune` so if it has 0 within flow then that will show in the output data

            # Compute how many people that live in `kommune` and work in `neighbor`
            flow_from_neighbor = data_kommune_is_target.loc[data_kommune_is_target.source_kommune == neighbor].sum()
            data_out[kommune][neighbor][idx] += flow_from_neighbor.n_crisis

            # Add this flow to the total flow inside the kommune. This way, its count will
            # represent the number of people in that kommune that go to work *anywhere*
            data_out[kommune]["_" + kommune][idx] += flow_from_neighbor.n_crisis

        # Compute flow out of kommune. This counts how many people that live outside
        # of the kommune and go to work the kommune
        data_kommune_is_source = data.loc[data.source_kommune == kommune]
        neighbors = set(data_kommune_is_source.target_kommune)
        if len(neighbors) > 0:
            neighbors = sorted(neighbors | {kommune})

        for neighbor in neighbors:
            # Compute how many people that live elsewhere and work in `kommune`
            flow_to_neighbor = data_kommune_is_source.loc[data_kommune_is_source.target_kommune == neighbor].sum()
            data_out[kommune][neighbor][idx] += flow_to_neighbor.n_crisis

            # Add this flow to total outflow from kommune so it represents how many people
            # *from anywhere* that commute here during working hours
            data_out[kommune]["_" + kommune][idx] += flow_to_neighbor.n_crisis


    PATH_OUT = r"/home/petem/HOPE/WorldCovid19/covid19.compute.dtu.dk/static/data/telco_map_new.json"
    PATH_IN_ZIP = r"/data/ctdk/notebooks/"
    PATH_IN_DAT = r"/data/ctdk/raw/"

    # Load data
    df1 = pd.read_csv(PATH_IN_DAT + 'df_safe.csv.gz', parse_dates=['date'],
                      dtype={'origin_area_code': 'int', 'destination_area_code': 'int'})
    df2 = pd.read_csv(PATH_IN_DAT + 'df_safe_within.csv.gz', parse_dates=['date'],
                      dtype={'origin_area_code': 'int', 'destination_area_code': 'int'})

    df1 = compute_relative_change(df1)  # .set_index('date')
    df2 = compute_relative_change(df2)  # .set_index('date')
    data = pd.concat([df1, df2])
    date_min = max(df1.date.min(),df2.date.min())
    date_max = min(df1.date.max(),df2.date.max())

    zips = pd.read_csv(PATH_IN_ZIP + 'zipcodes.csv')
    zips = zips.drop_duplicates(subset=['city_code', 'city']).set_index('city_code')
    zips['city'] = zips['city'].replace({"Aarhus":"Århus","Vesthimmerlands":"Vesthimmerland"}).str.replace('-',' ')

    data = pd.merge(data, zips[['city']], how='left', left_on='origin_area_code', right_on='city_code').rename(
        columns={'city': 'source_kommune'})
    data = pd.merge(data, zips[['city']], how='left', left_on='destination_area_code', right_on='city_code').rename(
        columns={'city': 'target_kommune'}).set_index('date')
    data = data.rename(columns={'all_ref': 'n_baseline', 'all': 'n_crisis', 'rel_change': 'percent_change'})


    data.dropna(axis=0,inplace=True) # TODO: THIS IS A TEMPORARY FIX. ZIPCODE 411 IS MISSING FROM THE ZIPS FILE
    data = data[data.index <= date_max]
    data = data.astype({'n_crisis':'int'})

    path_boo = os.path.exists(PATH_OUT)
    if path_boo:
        with open(PATH_OUT, 'r') as fp:
            data_out = json.load(fp)
            data_out = defaultify(data_out, 0)
        start = len(data_out['_meta']['datetime'])
    else:
        data_out = defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: 0)))
        start = 0


    fn_days = data.index.unique().sort_values().strftime("%Y-%m-%d %H:%H:%H").to_list()

    for idx, fn_day in tqdm(enumerate(fn_days[start:], start), total=len(fn_days[start:])):
        data_ = data.loc[fn_day]

        # Get list of municipalities
        data_nn = data_.loc[(data_.source_kommune.notnull()) & (data_.target_kommune.notnull())]
        kommunes = sorted(set(data_nn.source_kommune.tolist() + data_nn.target_kommune.tolist()))

        # Filter list of names to remove inconsistencies.
        # kommunes = [k if k not in to_actual else to_actual[k] for k in kommunes]
        # data_pop = data_[['target_kommune', 'n_crisis', 'n_baseline']].groupby('target_kommune').sum()

        for kommune in kommunes:
            update_data_out(kommune, idx, data_)  # , data_pop)

    data_out['_meta']['defaults'] = {}
    data_out['_meta']['variables'] = {}
    data_out['_meta']['datetime'] = []

    # Time
    data_out['_meta']['datetime'] = data.index.unique().sort_values().strftime("%Y-%m-%d %H:%H:%H").to_list()

    # Get max values
    data_out['_meta']['variables']['Max'] = 0
    for source in data_out:
        if source == '_meta':
            continue
        for target, data in data_out[source].items():
            if "_" + source == target:
                data_out['_meta']['variables']['Max'] = max(
                    data_out['_meta']['variables']['Max'],
                    max(data) 
                )

    # Add to _meta
    data_out['_meta']['radioOptions'] = ['percent_change', 'crisis', 'baseline']
    data_out['_meta']['defaults']['radioOption'] = 'percent_change'
    data_out['_meta']['defaults']['t'] = len(fn_days)-1
    data_out['_meta']['defaults']['idx0or1'] = 0
    data_out['_meta']['variables']['legend_label_count'] = "Number of trips"
    data_out['_meta']['variables']['legend_label_relative'] = "Percent change"

    with open('/home/petem/HOPE/WorldCovid19/utils/data/country-bb.json') as fp:
        cbb = json.load(fp)['DK'][1]

    data_out['_meta']['defaults']['latMin'] = cbb[1]
    data_out['_meta']['defaults']['latMax'] = cbb[3]
    data_out['_meta']['defaults']['lonMin'] = cbb[0]
    data_out['_meta']['defaults']['lonMax'] = cbb[2]

    with open(PATH_OUT,'w') as f:
        json.dump(data_out,f)

if __name__ == "__main__":
    os.chdir("../../")
    run('Denmark')












