import pandas as pd
import os
import json
import datetime as dt
from tqdm import tqdm

def run(country,iso):
    PATH = f'Facebook/{country}/population_tile/'

    with open(f'utils/globals/{country}_tile_baseline.json') as fp:
        tile_baseline = json.load(fp)

    fn_days = sorted(set([fn[:-9] for fn in os.listdir(PATH) if fn.endswith('.csv')]))
    for fn_day in tqdm(fn_days):
        dt_obj = dt.datetime(year=int(fn_day[-10:-6]), month=int(fn_day[-5:-3]), day=int(fn_day[-2:]))
        weekday = dt_obj.weekday()
        
        for window in ['0000', '0800', '1600']:        
            
            # Load
            filename = fn_day + "_" + window + ".csv"
            data = pd.read_csv(PATH + filename)

            if data.loc[(data.n_baseline != "\\N") & (data.density_baseline == "\\N")].shape[0] > 0:
                break
        
            # Loop through 
            for idx, row in data.loc[(data.country == iso) & (data.n_baseline == "\\N")].iterrows():
                latlon = f"{round(row.lat, 3)}, {round(row.lon, 3)}"

                if latlon in tile_baseline and \
                    weekday in tile_baseline[latlon] and \
                    window in tile_baseline[latlon][weekday]:

                    data.loc[idx, 'n_baseline'] = tile_baseline[latlon][weekday][window]
                    data.loc[idx, 'n_crisis'] = data.loc[idx, 'n_baseline'] * (1 + data.loc[idx, 'percent_change'] / 100)
                    data.loc[idx, 'n_difference'] = data.loc[idx, 'n_crisis'] - data.loc[idx, 'n_baseline']

            data.to_csv(PATH + filename, index=False)

if __name__ == "__main__":
    os.chdir("../")
    run()