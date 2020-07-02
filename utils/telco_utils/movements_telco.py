import pandas as pd
import matplotlib.pyplot as plt
import datetime
import json
from countryinfo import CountryInfo
from collections import defaultdict
from tqdm import tqdm

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


def compute_relative_change(df,
                            ref_date=datetime.datetime(2020, 3, 1)):
    # Relative change
    # import pdb;pdb.set_trace()
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
        data_out[kommune][neighbor]['baseline'][idx][
            0] = flow_from_neighbor.n_baseline  # / data_pop.loc[kommune, 'n_baseline']
        data_out[kommune][neighbor]['crisis'][idx][
            0] = flow_from_neighbor.n_crisis  # / data_pop.loc[kommune, 'n_crisis']
        data_out[kommune][neighbor]['percent_change'][idx][0] = percent_change(
            data_out[kommune][neighbor]['crisis'][idx][0], data_out[kommune][neighbor]['baseline'][idx][0]
        )

        # Add this flow to the total flow inside the kommune. This way, its count will
        # represent the number of people in that kommune that go to work *anywhere*
        data_out[kommune]["_" + kommune]['baseline'][idx][0] += data_out[kommune][neighbor]['baseline'][idx][0]
        data_out[kommune]["_" + kommune]['crisis'][idx][0] += data_out[kommune][neighbor]['crisis'][idx][0]

    # Compute flow out of kommune. This counts how many people that live outside
    # of the kommune and go to work the kommune
    data_kommune_is_source = data.loc[data.source_kommune == kommune]
    neighbors = set(data_kommune_is_source.target_kommune)
    if len(neighbors) > 0:
        neighbors = sorted(neighbors | {kommune})

    for neighbor in neighbors:
        # Compute how many people that live elsewhere and work in `kommune`
        flow_to_neighbor = data_kommune_is_source.loc[data_kommune_is_source.target_kommune == neighbor].sum()
        data_out[kommune][neighbor]['baseline'][idx][
            1] = flow_to_neighbor.n_baseline  # / data_pop.loc[neighbor, 'n_baseline']
        data_out[kommune][neighbor]['crisis'][idx][
            1] = flow_to_neighbor.n_crisis  # / data_pop.loc[neighbor, 'n_crisis']
        data_out[kommune][neighbor]['percent_change'][idx][1] = percent_change(
            data_out[kommune][neighbor]['crisis'][idx][1], data_out[kommune][neighbor]['baseline'][idx][1]
        )

        # Add this flow to total outflow from kommune so it represents how many people
        # *from anywhere* that commute here during working hours
        data_out[kommune]["_" + kommune]['baseline'][idx][1] += data_out[kommune][neighbor]['baseline'][idx][1]
        data_out[kommune]["_" + kommune]['crisis'][idx][1] += data_out[kommune][neighbor]['crisis'][idx][1]

    # Recompute percent change for 'how many people go to work' for the kommune
    if data_kommune_is_target.shape[0] > 0:
        data_out[kommune]["_" + kommune]['percent_change'][idx][0] = percent_change(
            data_out[kommune]["_" + kommune]['crisis'][idx][0],
            data_out[kommune]["_" + kommune]['baseline'][idx][0]
        )
    # Recompute percent change for 'how many people work here' for the kommune
    if data_kommune_is_source.shape[0] > 0:
        data_out[kommune]["_" + kommune]['percent_change'][idx][1] = percent_change(
            data_out[kommune]["_" + kommune]['crisis'][idx][1],
            data_out[kommune]["_" + kommune]['baseline'][idx][1]
        )


country = 'Denmark'
PATH_OUT = r"/home/petem/HOPE/WorldCovid19/covid19.compute.dtu.dk/static/data/"
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

zips = pd.read_csv(PATH_IN_ZIP + 'zipcodes.csv')
zips = zips.drop_duplicates(subset=['city_code', 'city']).set_index('city_code')
zips['city'] = zips['city'].replace({"Aarhus":"Århus","Vesthimmerlands":"Vesthimmerland"})

data = pd.merge(data, zips[['city']], how='left', left_on='origin_area_code', right_on='city_code').rename(
    columns={'city': 'source_kommune'})
data = pd.merge(data, zips[['city']], how='left', left_on='destination_area_code', right_on='city_code').rename(
    columns={'city': 'target_kommune'}).set_index('date')
data = data.rename(columns={'all_ref': 'n_baseline', 'all': 'n_crisis', 'rel_change': 'percent_change'})

data_out = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultlist(lambda: [0, 0]))))
start = 0
N_POP = CountryInfo(country).population()
fn_days = data.index.unique().sort_values().strftime("%Y-%m-%d %H:%H:%H").to_list()

for idx, fn_day in tqdm(enumerate(fn_days), total=len(fn_days)):
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
data_out['_meta']['variables']['inMax'] = 0
data_out['_meta']['variables']['outMax'] = 0
data_out['_meta']['variables']['betweenMax'] = 0
for source in data_out:
    if source == '_meta':
        continue
    for target, data in data_out[source].items():
        baseline_in, baseline_out = zip(*data['baseline'])
        crisis_in, crisis_out = zip(*data['crisis'])
        if "_" + source == target:
            data_out['_meta']['variables']['inMax'] = max(
                data_out['_meta']['variables']['inMax'],
                max(crisis_in), max(baseline_in)
            )
            data_out['_meta']['variables']['outMax'] = max(
                data_out['_meta']['variables']['outMax'],
                max(crisis_out), max(baseline_out)
            )
        else:
            data_out['_meta']['variables']['betweenMax'] = max(
                data_out['_meta']['variables']['betweenMax'],
                max(baseline_in), max(baseline_out),
                max(crisis_in), max(crisis_out)
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

with open(PATH_OUT + 'telco_map.json','w') as f:
    json.dump(data_out,f)












