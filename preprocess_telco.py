#!/usr/bin/env python3
from joblib import Parallel, delayed
import os
import json

from utils.telco_utils import movements_telco_new , absolute_deviation
from utils.geo_utils import create_shape_file

def run():
    # Then run in parallel
    print('\n-----------\nrun in parallel:\n----------------')
    country = 'Denmark'
    pscripts = [absolute_deviation, movements_telco_new]
    Parallel(n_jobs=min(8, len(pscripts)))(delayed(lambda x: x.run(country))(x) for x in pscripts)
            

if __name__ == "__main__":
    run()
