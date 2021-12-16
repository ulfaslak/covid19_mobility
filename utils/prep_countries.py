from utils import utils
from importlib import reload
import pandas as pd
import numpy as np
import os
import pycountry




def run(path):
    
    #import pdb; pdb.set_trace()
    country_list = os.listdir(path)
    for country_name in ['Denmark','Sweden']: #country_list:
        if country_name == 'Ireland':
            adm = 'adm1'
        else:
            adm = 'adm2'
        # Make into a function

        print(f'Preprocessing {country_name}')
        data_path = f'{path}{country_name}/population_tile/'
        utils.Update_CSV(data_path, country_name, dat_type="popu",adm=adm)

        data_path = f'{path}{country_name}/movement_tile/'
        utils.Update_CSV(data_path, country_name, dat_type='move',adm=adm)

        data_path = f'{path}{country_name}/movement_admin/'
        utils.Update_CSV(data_path, country_name, dat_type='move',adm=adm)


if __name__ == "__main__":
    os.chdir("../")
    run(data)
