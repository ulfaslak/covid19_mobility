import os
import pandas as pd
import numpy as np
import json
import requests as rq
from tqdm import tqdm
from countryinfo import CountryInfo

def run(country,iso,adm_region='adm1',adm_kommune='adm2'):
    def tile_points(coord, dlat, dlon):
        dlat_ = dlat[coord[0]]
        return [
            [round(coord[0] + dlat_/2, 6), round(coord[1] + dlon/2, 6)][::-1],
            [round(coord[0] - dlat_/2, 6), round(coord[1] + dlon/2, 6)][::-1],
            [round(coord[0] - dlat_/2, 6), round(coord[1] - dlon/2, 6)][::-1],
            [round(coord[0] + dlat_/2, 6), round(coord[1] - dlon/2, 6)][::-1],
            [round(coord[0] + dlat_/2, 6), round(coord[1] + dlon/2, 6)][::-1]
        ]



    def percent_change(row):
        return (row['n_crisis'] - row['n_baseline']) / row['n_baseline']


#   # TILE TO MUNICIPALITY MAP
#   with open('utils/globals/tile_kommune_map.json') as fp:
#       tile_kommune_map = json.load(fp)
    
    if country == 'Czechia':
        N_POP = CountryInfo('Czech Republic').population()
    else:
        N_POP = CountryInfo(country).population()
        

    # PATHS
    PATH_IN = f"Facebook/{country}/population_tile/"
    PATH_OUT = "covid19.compute.dtu.dk/static/data/tile_vis/"
    #PATH_OUT = "/Users/ulfaslak/Documents/git/popdensv/public/data/"

    # FILES
    files = os.listdir(PATH_IN)
    files = [f for f in files if f.endswith(".csv")]
    N_files = len(files)
    files = [f for f in files if f[:-4] + ".json" not in os.listdir(PATH_OUT)]

    #print("Processing:")

    for f in tqdm(files):


        print(f"    ...{f[-20:]} (...)", end=" ")

        # Load and filter
        #import pdb;pdb.set_trace()
        data = pd.read_csv(PATH_IN + f)
        data = data.loc[data.n_crisis != "\\N"]
        data = data.loc[data.country == iso]

        # Adjust population counts
        data['n_baseline'] = data.n_baseline.astype(float) * N_POP / data.n_baseline.astype(float).sum()
        data['n_crisis'] = data.n_crisis.astype(float) * N_POP / data.n_crisis.astype(float).sum()
        #import pdb; pdb.set_trace()
        # Get tile sizes
        sorted_lats = np.sort(data['lat'].unique())
        latdiffs = sorted_lats[1:] - sorted_lats[:-1]
        #latdiffs_old = [v for v in latdiffs if v < min(latdiffs)*2]
        #latdiffs = [v for v in latdiffs if v < 0.015]
        tmp = []
        for i, v in enumerate(latdiffs):
            if (len(tmp) == 0):
                if (v<min(latdiffs)*1.9):
                    tmp.append(v)
            elif v < tmp[-1]*1.9:
                tmp.append(v)
        latdiffs = tmp
        dlat = dict(zip(sorted_lats, np.linspace(latdiffs[0], latdiffs[-1], len(sorted_lats))))
        sorted_lons = np.sort(data['lon'].unique())
        londiffs = sorted_lons[1:] - sorted_lons[:-1]
        dlon = min(londiffs)

        # Construct geojson object
        geojson = {
            "type": "FeatureCollection",
            "features": []
        }

        for _, row in data.iterrows():
            geojson['features'].append({
                "type":"Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        tile_points([row['lat'], row['lon']], dlat, dlon)
                    ]},
                "properties": {
                    "bl": round(float(row['n_baseline']), 1),
                    "gr": round(percent_change(row), 3),
                    "lo": round(float(row['n_crisis']), 1),
                    "ko": row[adm_kommune]
                }
            })

        # Save as file
        with open(f"{PATH_OUT}{f[:-4]}.json", 'w', encoding="utf-8") as fp:
            json.dump(geojson, fp)

        print("done!")

#   with open('utils/globals/tile_kommune_map.json', 'w') as fp:
#       json.dump(tile_kommune_map, fp)  

    with open(f"{PATH_OUT}meta.json", 'w', encoding="utf-8") as fp:
        json.dump({'n_files': N_files}, fp)

if __name__ == "__main__":
    os.chdir("../")
    run()
