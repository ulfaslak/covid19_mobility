import fiona.io
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

# Example that creates shape_file and saves it in current directory:  create_shape_file('Denmark',adm = 2,save_dir='')
def create_shape_file(country, adm, save_dir=False, file_return=True):
    iso3 = pycountry.countries.get(name=country).alpha_3
    response = requests.get(f"https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_{iso3}_shp.zip")
    data_bytes = response.content

    with fiona.io.ZipMemoryFile(data_bytes) as zip_memory_file:
        with zip_memory_file.open(f"gadm36_{iso3}_{adm}.shp") as collection:
            geodf = gpd.GeoDataFrame.from_features(collection, crs=collection.crs)

    shape_file = [{'kommune': loc['NAME_2'], 'polygons': poly_convert(loc['geometry'])} for i, loc in geodf.iterrows()]
    if save_dir != False:
        full_path = save_dir + country.capitalize() + '_geojson.json'
        with open(full_path, 'w') as f:
            json.dump(shape_file, f)
    if file_return:
        return shape_file