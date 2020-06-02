from utils import utils
from importlib import reload
import pandas as pd
import numpy as np
import os
import pycountry




def run(path):
    
    #import pdb; pdb.set_trace()
    country_list = os.listdir(path)
    for country_name in country_list:

        # Make into a function
        list_dat = utils.load_kdtree(country_name)

        print(f'Preprocessing {country_name}')
        data_path = f'{path}{country_name}/population_tile/'
        utils.Update_CSV(data_path, country_name, list_dat, dat_type="popu")

        data_path = f'{path}{country_name}/movement_tile/'
        utils.Update_CSV(data_path, country_name, list_dat, dat_type='move')

        data_path = f'{path}{country_name}/movement_admin/'
        utils.Update_CSV(data_path, country_name, list_dat, dat_type='move')


if __name__ == "__main__":
    os.chdir("../")
    run(data)