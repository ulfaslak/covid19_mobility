import pandas as pd
from os import listdir
import numpy as np

from io import BytesIO
from zipfile import ZipFile
from urllib.request import urlopen

from scipy import spatial
from tqdm import tqdm

import csv
from glob import iglob

import pycountry

import os
import pickle



def switch_denmark(data,adm):
    switch_dk = {'Capital Region':'Region Hovedstaden', 'Zealand':'Region Sjælland', 'Central Jutland':'Region Midtjylland',
             'South Denmark':'Region Syddanmark','North Denmark':'Region Nordjylland'}
    if adm==1:
        data['name'] = data['name'].replace(switch_dk)
    elif adm==2:
        data['name'] = data['name'].str.replace('Å','Aa').str.replace(' Kommune','').str.replace(' Municipality','')
    return data

def get_adm12(admin_code,country):
    """
    Description:
        Fetches the admin code to location references from geonames.org
        
    Input:
          Variable:         type:          description:
    
          admin_code        integer        An integer from 1-2 descibing the admin level desired
          country           string         Country code i.e. "DE" for germany
    
    Output:
    
          df_adm            pd dataframe   Pandas dataframe containing the connection between admin code and actual location
    
    """
    
    # Static variables from GeoNames.org
    header = ['code', 'name', 'name ascii', 'geonameid']
    urls = ["https://download.geonames.org/export/dump/admin1CodesASCII.txt","https://download.geonames.org/export/dump/admin2Codes.txt"]
    
    #Fetching the data and loading in to a pandas dataframe
    with urlopen(urls[admin_code-1]) as f:
        df_adm = pd.read_csv(f, sep='\t', header= None, low_memory=False,names=header,dtype={'code':str})
    
    #Remove all other countries that the desired and set the index of the dataframe to be the admin code
    split = df_adm['code'].str.split('.',expand=True)
    df_adm = df_adm.assign(**{'country':split[0],'adm':split[admin_code]})
    df_adm = df_adm[df_adm['country']==country].set_index('adm')
    
    return df_adm

def get_dat_and_kdtree(country_code,admin_code):
    """
    Description:
        Downloads country specific reference points and admin codes from geonames.org and computes a 
        kdtree that finds the closest location in those reference points.
        
    Input:
         Variable:         type:          description:

         country_code      string         Country code i.e. "DE" for germany
         admin_code        integer        An integer from 1-4 descibing the admin level desired

    Output:

         dat                pd dataframe   Pandas dataframe containing all the reference points and admin code
         dat_adm            pd dataframe   Pandas dataframe containing the connection between admin code and actual location
         kdtree             scipy kdtree   kdtree created from the locations of dat.

    """
    
    #Static variables from GeoNames.org
    admin_codes = ['admin1 code','admin2 code','admin3 code','admin4 code']
    header = ['geonameid', 'name', 'asciiname', 'alternatenames', 'latitude', 'longitude', 'feature class', 'feature code', 'country code', 'cc2',
     'admin1 code', 'admin2 code', 'admin3 code', 'admin4 code', 'population', 'elevation', 'dem', 'timezone', 'modification date']
    country_code = country_code.upper()
    
    #Downloading data from GeoNames.org and saving into pd dataframe
    resp = urlopen("https://download.geonames.org/export/dump/"+country_code+".zip")
    zipfile = ZipFile(BytesIO(resp.read()))
    file = country_code + '.txt'
    
    with zipfile.open(file) as f:
        #Also removing all locations with N/A in admin code
        dat = pd.read_csv(f, sep='\t', header= None, low_memory=False,names=header,dtype={'admin1 code':str,
                                        'admin2 code':str,'admin3 code':str,'admin4 code':str}).dropna(subset=[admin_codes[admin_code-1]])
    if dat.empty:
        return None
    
    
    
    #Removing "historic" admin locations  i.e. ADM3H and all admin codes which are '00' since it means that it does not
    #have an admin
    list_remove = [f'ADM{i}H' for i in range(4,admin_code-1,-1)]
    dat = dat[~dat['feature code'].isin(list_remove)].reset_index(drop=True)
    dat = dat[~(dat[f'admin{admin_code} code']=='00')].reset_index(drop=True)  ## '00' means it does not contain that admin, so we remove them
    dat = dat[dat[f'admin{admin_code} code'].isin(dat[dat['feature code']==f'ADM{admin_code}'][f'admin{admin_code} code'])]

    #Since admin to location references of admin levels <3 are stored in another file we check if we need to download
    # that file. 
    #We create a dataframe only containing the admin->location references and uses the admin codes as index
    if admin_code <3:
        dat_adm = get_adm12(admin_code,country_code)
    else:
        dat_adm = dat[dat['feature code'].isin([f'ADM{admin_code}'])].set_index(f'admin{admin_code} code')
    
    if country_code == 'DK':
        dat_adm = switch_denmark(dat_adm,admin_code)
    #Computes a kdtree of the reference locations
    list_of_points = [(point['latitude'],point['longitude']) for i,point in dat.iterrows()]
    kdtree = spatial.KDTree(list_of_points)
    return dat,dat_adm, kdtree

def latlon_from_geo(data):
    slonlat, elonlat = zip(*[
        geom[12:-1].split(", ")
        for geom in data.geometry
    ])
    slon, slat = zip(*[list(map(float, sll.split())) for sll in slonlat])
    elon, elat = zip(*[list(map(float, ell.split())) for ell in elonlat])

    data['start_lat'] = np.array(slat)
    data['start_lon'] = np.array(slon)
    data['end_lat'] = np.array(elat)
    data['end_lon'] = np.array(elon)
    return data

def reverse_geo_adm(df_face,df_geoname,df_geoname_adm,admin_code,kdtree,move=False):
    """
    Description:
        Updates a dataframe with the admin locations found from geonames.org
    
    Input:
         Variable:         type:          description:

         df_face           pd dataframe   pd dataframe from facebook 
         df_geoname        pd dataframe   pd dataframe generated from geonames.org of the given country
         df_geoname_adm    pd dataframe   pd dataframe of the connection between admin code and location name
         admin_code        integer        Integer containing the admin_code level
         kdtree            scipy kdtree   kdtree that computed the closest location of input to df_geoname

    Output:

         df_face           pd dataframe   pd dataframe from facebook with an updated column specifying the found location 


    """
    
    #Compute closest reference points of all the location
    if move != "move":
        kd_test = kdtree.query(df_face[['lat','lon']].values)
        new_adm_col = df_geoname_adm.loc[df_geoname[f'admin{admin_code} code'].iloc[kd_test[1]]]['name'].reset_index(drop=True)
        df_face = df_face.reset_index(drop=True).assign(**{f'adm{admin_code}':new_adm_col})
    else:
        kd_test_start = kdtree.query(df_face[['start_lat','start_lon']].values)
        new_adm_col = df_geoname_adm.loc[df_geoname[f'admin{admin_code} code'].iloc[kd_test_start[1]]]['name'].reset_index(drop=True)
        df_face = df_face.reset_index(drop=True).assign(**{f'start_adm{admin_code}':new_adm_col})
        
        
        kd_test_end   = kdtree.query(df_face[['end_lat','end_lon']].values)
        new_adm_col = df_geoname_adm.loc[df_geoname[f'admin{admin_code} code'].iloc[kd_test_end[1]]]['name'].reset_index(drop=True)
        df_face = df_face.reset_index(drop=True).assign(**{f'end_adm{admin_code}':new_adm_col})
    #Making a column of all the locations of the closest reference points.
    
    #Adding the location column to the dataframe
    #df_face = df_face[~df_face.n_baseline.str.contains('N')]
    
    return df_face


def check_update(path):
    files = []
    for file in iglob(path+"*.csv"):
        with open(file,encoding='iso-8859-1') as f:
            head = next(csv.reader(f),[])
        if len(head)==0:
            os.remove(file)
        elif not (("start_adm1" in head) | ("adm1" in head)):
            files.append(file.split('\\')[-1].split('/')[-1])
    return files
            
def Update_CSV(data_path,country_name,list_dat,save_path = None, dat_type = 'popu'):
    """
    Desciption:
        Updates facebook CSV files with admin levels. The saved files might be reduced due to removal of locations that are 
        not in the country are removed.
        
    Input:
         Variable:         type:          description:

         data_path         string         Path to directory of CSV files
         country           string         String specifying the shortname of the country, i.e. "DK" for Denmark
         country_name      string         String with the full name of the country, i.e. "Denmark"
         save_path         string         Path to the location where the updated CSV files should be saved.
         dat_type          string         Either "popu" or "move" depending on the data type from facebook

    Output:
         None
        
    """
    #Fetch a list of all the files
    files = check_update(data_path)
    
    #import pdb;pdb.set_trace()
    if len(files)==0:
        print('There is nothing to update')
        return None
    file = files[0]
    
    country = pycountry.countries.get(name=country_name).alpha_2
    
    #Get the information from GeoNames.org and the computed kdtree for each admin level
 #   list_dat = [get_dat_and_kdtree(country,i) for i in range(1,5)]
 #   list_dat = list(filter(None, list_dat))
    try:
        df_poputile = pd.DataFrame(pd.read_csv(data_path+file,float_precision='round_trip'))
        #Removing datapoints which are not from the desired country
        df_poputile = df_poputile[df_poputile['country']==country]
        
        if dat_type == "move":
            df_poputile = latlon_from_geo(df_poputile)
            
    except pd.errors.EmptyDataError:
        print('First file is empty. Deleting file: '+data_path+file)
        return None
        
    for adm, dat_kd in enumerate(list_dat):
        if dat_kd:
            df_poputile = reverse_geo_adm(df_poputile, dat_kd[0],dat_kd[1], adm+1, dat_kd[2],move=dat_type)
            
            
            
     #Saving the updated data
    if save_path:
        df_poputile.to_csv(save_path+file,index=False)
    else:
        df_poputile.to_csv(data_path+file,index=False)
    
    #Run through all files and add the location for each admin level
    for file in tqdm(files[1:]):

        try:
            df_poputile_new = pd.DataFrame(pd.read_csv(data_path+file,float_precision='round_trip'))
            #Removing datapoints which are not from the desired country
            df_poputile_new = df_poputile_new[df_poputile_new['country']==country]

        except pd.errors.EmptyDataError:
            continue
            
        if dat_type == "move":
            df_poputile_new = latlon_from_geo(df_poputile_new)
            adms_check_start = list(df_poputile.columns[df_poputile.columns.isin(['start_adm1', 'start_adm2', 'start_adm3', 'start_adm4'])])
            adms_check_end = list(df_poputile.columns[df_poputile.columns.isin(['end_adm1', 'end_adm2', 'end_adm3', 'end_adm4'])])
            df_poputile_new.drop(adms_check_start + adms_check_end, axis=1, errors='ignore',inplace=True)
            
            start_coord = ['start_lat','start_lon']
            end_coord = ['end_lat','end_lon']

            df_poputile_new = df_poputile_new.merge(df_poputile[start_coord+adms_check_start].drop_duplicates(subset=start_coord), on=start_coord,how='left')
            df_poputile_new = df_poputile_new.merge(df_poputile[end_coord+adms_check_end].drop_duplicates(subset=end_coord), on=end_coord,how='left')
            
        elif dat_type == "popu":
            #Check which admin codes are used
            adms_check = list(df_poputile.columns[df_poputile.columns.isin(['adm1','adm2','adm3','adm4'])])
            df_poputile_new.drop(adms_check, axis=1, errors='ignore', inplace=True)

            #Reuse already found locations from previous
            df_poputile_new = df_poputile_new.merge(df_poputile[['lat','lon']+adms_check], on=['lat','lon'],how='left')
        
        for adm, dat_kd in enumerate(list_dat):
            if (dat_kd) and (df_poputile_new.isnull().values.any()):
                df_kdout = reverse_geo_adm(df_poputile_new[df_poputile_new.isnull().any(axis=1)], dat_kd[0],dat_kd[1], 
                                           adm+1, dat_kd[2],move = dat_type)
                df_kdout = df_kdout.set_index(df_poputile_new[df_poputile_new.isnull().any(axis=1)].index)
                
                df_poputile_new.update(df_kdout)
                
                if dat_type == "popu":
                    df_poputile = df_poputile.append(df_kdout).drop_duplicates(subset=['lat','lon'])
                elif dat_type == "move":
                    df_poputile = df_poputile.append(df_kdout)
                
                
        #Saving the updated data
        if save_path:
            df_poputile_new.to_csv(save_path+file,index=False)
        else:
            df_poputile_new.to_csv(data_path+file,index=False)

def load_kdtree(country_name):
    country = pycountry.countries.get(name=country_name).alpha_2
    kd_file_name = 'utils/kdtrees/' + country_name + '.pkl'
    if os.path.isfile(kd_file_name):
        with open(kd_file_name, 'rb') as f:
            list_dat = pickle.load(f)
    else:
        list_dat = [peter_utils.get_dat_and_kdtree(country, i) for i in range(1, 5)]
        list_dat = list(filter(None, list_dat))
        with open(kd_file_name, 'wb') as f:
            pickle.dump(list_dat, f)
    return list_dat
