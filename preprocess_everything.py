#!/usr/bin/env python3
from joblib import Parallel, delayed
import os
import pycountry
import json

from utils import prep_countries
from utils import absolute_deviation
from utils import gini_over_time
from utils import establish_flow_baseline
from utils import fill_baseline
#from utils import kommune_region_flow
from utils import mobility
from utils import movements
from utils import stationarity
from utils import night_day_difference
from utils import tile_csv_to_geojson
from utils import update_baseline_counts
from utils.geo_utils import create_shape_file

def run():
    path = r'Facebook/'
    country_list = os.listdir(path)
    data_path = r'covid19.compute.dtu.dk/static/data/'
    with open(data_path + 'countries.json','w') as f:
        json.dump(country_list,f)


    # First run serially
    print("Adding the admin locations to the CSV files:")
    prep_countries.run(path)
    # Then run in parallel
    print('\n-----------\nrun in parallel:\n----------------')
    for country in ['Denmark','Sweden']: #country_list:
        print(f'Processing {country}')
        if country == 'Ireland':
            adm_kommune = 'adm1'
            adm_region = 'adm1'
            create_shape_file(country,1,data_path)
        else:
            adm_kommune = 'adm2'
            adm_region = 'adm1'
            create_shape_file(country,2,data_path)
        iso = pycountry.countries.get(name=country).alpha_2
        #night_day_difference.run(country,iso,adm_region,adm_kommune)
        #movements.run(country,iso,adm_region,adm_kommune)
        #continue
        if country in ['Denmark','Sweden']:
            pscripts = [
                absolute_deviation,
                gini_over_time,
                tile_csv_to_geojson,
                mobility,
                stationarity,
                night_day_difference,
                movements
            ]
        else:
            continue
            pscripts = [
                absolute_deviation,
                gini_over_time,
                #tile_csv_to_geojson,
                mobility,
                stationarity,
                night_day_difference,
                movements
            ]
        Parallel(n_jobs=min(8, len(pscripts)))(delayed(lambda x: x.run(country,iso,adm_region,adm_kommune))(x) for x in pscripts)

if __name__ == "__main__":
    run()
