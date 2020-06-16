import fiona.io
from os import path
import geopandas as gpd
import requests
import json
import numpy as np
import pycountry


def poly_convert(polygon):
    all_coords = []
    if polygon.boundary.geometryType() == 'MultiLineString':
        for b in polygon.boundary:
            coords = np.dstack(b.coords.xy).tolist()
            all_coords.append(*coords)
    else:
        coords = np.dstack(polygon.boundary.coords.xy).tolist()
        all_coords.append(*coords)
    return all_coords

# def inconsistency_map(name):
#     incmap = {
#         'Århus': 'Aarhus',
#         'Høje Taastrup': 'Høje-Taastrup'
#     }
#     if name in incmap:
#         return incmap[name]
#     return name

# Example that creates shape_file and saves it in current directory:  create_shape_file('Denmark',adm = 2,save_dir='')
def create_shape_file(country, adm, save_dir=False, file_return=True, return_geo_pd = False,exists_skip = True):
    if save_dir != False:
        full_path = save_dir + country.title() + '_geojson.json'
    else:
        full_path = ''
    if (path.exists(full_path)) and (exists_skip):
        return None
    else:
        if country == "Britain":
            iso3 = pycountry.countries.get(name="United Kingdom").alpha_3
        else:
            iso3 = pycountry.countries.get(name=country).alpha_3


        #iso3 = pycountry.countries.get(name=country).alpha_3
        response = requests.get(f"https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_{iso3}_shp.zip")
        data_bytes = response.content
                
        with fiona.io.ZipMemoryFile(data_bytes) as zip_memory_file:
            with zip_memory_file.open(f"gadm36_{iso3}_{adm}.shp") as collection:
                geodf = gpd.GeoDataFrame.from_features(collection, crs="epsg:4326")
                columns_replace = geodf.columns[geodf.columns.str.startswith('NAME_')]
                for column in columns_replace:
                    geodf[column] = geodf[column].str.replace('\W+',' ').str.strip()
                geodf = geodf.dropna(subset=columns_replace)

                if return_geo_pd:
                    return geodf
                geodf.geometry = geodf.geometry.simplify(0.001)

    shape_file = [{'kommune': loc['NAME_2'], 'polygons': poly_convert(loc['geometry'])} for i, loc in geodf.iterrows()]
    if save_dir != False:
        full_path = save_dir + country.title() + '_geojson.json'
        with open(full_path, 'w') as f:
            json.dump(shape_file, f)
    if file_return:
        return shape_file

if __name__ == '__main__':
    create_shape_file('Denmark', adm=2, save_dir='/Users/ulfaslak/Documents/git/covid19_mobility/covid19.compute.dtu.dk/static/data/')
