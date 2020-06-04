#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from pull_utils import data_updater
import os



def run():

    dl_folder = '/home/petem/Downloads/'
    outdir = '/home/petem/HOPE/WorldCovid19/Facebook'
    creds = '/home/petem/.creds/fb.json'
    country_file = '/home/petem/HOPE/WorldCovid19/pull_data/country_list.csv'
    driver_path = '/home/petem/HOPE/WorldCovid19/'
    updater = data_updater(download_folder=dl_folder, outdir=outdir,headless=True,path=country_file,creds=creds,driver_path=driver_path)
    #import pdb;pdb.set_trace()
    updater.remove_empty_files(outdir)
    updater.download_countries(updater.data.index[1:])
    #updater.download_id('https://www.facebook.com/geoinsights-portal/downloads/?id=642750926308152&extra[crisis_name]=DK_NUTS3','Denmark','Movement_range')



    print('Success.')


if __name__ == "__main__":
    #_args = sys.argv
    os.chdir("../")
    run()
