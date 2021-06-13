#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from pull_utils import data_updater
import os



def run():

    dl_folder = '/Users/petem/HOPE/covid19_mobility/Downloads'
    outdir = '/Users/petem/HOPE/covid19_mobility/Facebook'
    creds = '/Users/petem/.creds/fb.json'
    country_file = '/Users/petem/HOPE/covid19_mobility/pull_data/country_list.csv'
    driver_path = '/Users/petem/HOPE/covid19_mobility'
    updater = data_updater(download_folder=dl_folder, outdir=outdir,headless=False,path=country_file,creds=creds,driver_path=driver_path)
    updater.remove_empty_files(outdir)
    updater.download_countries(updater.data.index[1:])
    #updater.download_id('https://www.facebook.com/geoinsights-portal/downloads/?id=642750926308152&extra[crisis_name]=DK_NUTS3','Denmark','Movement_range')



    print('Success.')


if __name__ == "__main__":
    #_args = sys.argv
    os.chdir("../")
    run()
