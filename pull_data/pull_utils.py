#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from selenium.webdriver.common.keys import Keys
import time
import pandas as pd
import os
from selenium.webdriver import Chrome
from selenium.webdriver.chrome import webdriver as chrome_webdriver
import sys
import numpy as np
import glob
import shutil
import operator
import json
from tqdm import tqdm
import re

class data_updater:

    def __init__(self, download_folder, outdir, path=None, headless=False, creds=False,driver_path=False):

        #         self.outdir = '../Facebook/'
        self.outdir = outdir
        with open(creds) as fp:
            self.keys = json.load(fp)
        self.download_folder = download_folder
        self.headless = headless
        self.driver_path = driver_path
        self.data_types = ['Movement between Admin', 'Movement between Tiles', 'Facebook Population (Admin',
                          'Facebook Population (Tile']
        self.load_data(path)

    def load_data(self, path):
        # Load data containing country facebook IDs or create an empty dataframe
        if path:
            self.data = pd.read_csv(path)
            self.data = self.data.set_index('Index')
        else:
            df = pd.DataFrame(columns=self.data_types)
            df.loc['folder'] = ['movement_admin', 'movement_tile', 'population_admin', 'population_tile']
            df.index.names = ['Index']
            self.data = df

    def save_data(self, path_out):
        # Save country dataframe
        self.data.to_csv(path_out)

    def login(self):
        # Login to facebook
        self.driver.get('https://www.facebook.com/login/?next=https%3A%2F%2Fwww.facebook.com%2Fgeoinsights-portal%2F')
        self.driver.find_element_by_xpath('//*[@id="email"]').send_keys(self.keys[0])
        self.driver.find_element_by_xpath('//*[@id="pass"]').send_keys(self.keys[1])
        self.driver.find_element_by_xpath('//*[@id="loginbutton"]').click()

    def add_countries(self, countries):
        # Adds country IDs to the data
        self.start_driver()
        self.login()
        for country in countries:
            time.sleep(1)
            ids = []
            self.driver.get(
                'https://www.facebook.com/login/?next=https%3A%2F%2Fwww.facebook.com%2Fgeoinsights-portal%2F')
            ele = self.driver.find_element_by_xpath('//*[@id="js_3"]')
            ele.send_keys(country)
            time.sleep(1)
            ele.send_keys(" Coronavirus Disease Prevention")
            time.sleep(3)
            ele.send_keys(Keys.DOWN)

            while True:
                text = self.driver.find_element_by_xpath('//span[contains(text(),"Search")]').text
                if text == f'Search: "{country + " Coronavirus Disease Prevention"}"':
                    break
                time.sleep(1)
                ele.send_keys(Keys.ENTER)

            time.sleep(3)
            for dat_type in self.data_types:
                elements = self.driver.find_elements_by_xpath(f'//div[contains(text(),"{dat_type}")]')
                for ele in elements:
                    page_id = ele.find_element_by_tag_name('a').get_attribute('href').split('=')[-1]
                    out = self.open_and_check(f'https://www.facebook.com/geoinsights-portal/downloads/?id={page_id}',
                                              country + " Corona")
                    if out:
                        break
                ids.append(page_id)
            self.data.loc[country] = ids
        self.close_driver()

    def download_countries(self, countries):
        self.start_driver()
        self.login()
        time.sleep(3)
        for country in countries:
            print(f'{country}')
            for i in self.data.loc[['folder', country]].items():
                links, text = self.get_links(f'https://www.facebook.com/geoinsights-portal/downloads/?id={i[1][1]}')
                print(f'Downloading {i[1][0]}')
                self.download_links(links,text,f'{self.outdir}/{country}/{i[1][0]}',country)
            print('')

        self.driver.quit()

    def download_id(self, id_web_link, country, folder_name):
        self.start_driver()
        self.login()
        time.sleep(3)

        print(f'Downloading files for {country}')
        links, text = self.get_links(id_web_link)
        print(f'Downloading {folder_name}')
        self.download_links(links,text, f'{self.outdir}/{country}/{folder_name}', country)
        print('')
        self.driver.quit()

    def get_links(self, path):
        self.driver.get(path)
        ele = self.driver.find_elements_by_tag_name('li')
        links = [date.find_element_by_tag_name('a').get_attribute('href') for date in ele if len(date.text) > 0]
        text = [date.text.replace('-','_').replace(' ','_') for date in ele if len(date.text) > 0]
        return links, text

    def download_links(self, links, text, outdir,country):

        dates = [country + '_' + date + '.csv' for date in text]
        self.try_mkdir_silent(f'{outdir}')
        dl_links = np.array(links)[~np.isin(dates, os.listdir(f'{outdir}'))]


        wait_time = 1
        while len(dl_links) > 0:
            for link in tqdm(dl_links):
                self.driver.get(link)
                time.sleep(wait_time)
            wait_time += 10
            self.move_most_recent_files(outdir, links,country)
            dl_links = np.array(links)[~np.isin(dates, os.listdir(f'{outdir}'))]

    def open_and_check(self, link, contains):
        main_window = self.driver.current_window_handle
        self.driver.execute_script(f'''window.open("{link}","_blank");''')
        self.driver.switch_to.window(self.driver.window_handles[1])
        ele = self.driver.find_elements_by_xpath(f'//*[contains(text(),"{contains}")]')
        if len(ele)>0:
            output = ele[0].text
        else:
            output = None
        time.sleep(1)
        self.driver.close()
        self.driver.switch_to.window(main_window)
        return output

    ######################### Moving files ##################################
    def try_mkdir_silent(self,path):
        # Silently making dir if it doesn't exist
        try:
            os.makedirs(path, exist_ok=True)
        except:
            pass


    def rename_and_move(self,old_fn: str, old_dir: str, new_fn: str, new_dir: str):
        # Renaming and moving the files
        os.rename(old_dir + '/' + old_fn, old_dir + '/' + new_fn)

        shutil.move(old_dir + '/' + new_fn, new_dir + '/' + new_fn)

    def get_new_file_name(self,file: str, country: str):
        # Changing default names to COUNTRY_DATE.csv
        regex = re.search(r'\d{4}[_-]\d{2}[_-]\d{2}([-_ +]\d{4})?', file).group()
        date = re.sub("[^0-9a-zA-Z]+","_",regex)

        return (country + '_' + date + '.csv')

    def move_most_recent_files(self,outdir: str, urls: list, country: str):
        '''
        Get the most recent files form the download directory, rename them, and put them in the destination directory
        '''

        self.try_mkdir_silent(outdir)

        csv_files = {}
        # import pdb; pdb.set_trace()
        for f in glob.glob(self.download_folder + '/*.csv'):
            csv_files[f] = os.path.getctime(f)

        sorted_files = [f[0] for f in sorted(csv_files.items(), key=operator.itemgetter(1), reverse=True)[:len(urls)]]

        new_fns = [self.get_new_file_name(file,country) for file in sorted_files]

        for i, sorted_file in enumerate(sorted_files):
            self.rename_and_move(sorted_file.split('/')[-1].split('\\')[-1], self.download_folder, new_fns[i], outdir)

    def remove_empty_files(self,start_dir):
        for root, dirs, files in os.walk(start_dir):
            for file in files:
                file_path = os.path.join(root, file)
                if (os.path.getsize(file_path) == 0) & (file_path.endswith('00.csv')):
                    os.remove(file_path)
            ######################### Initialize driver ##############################

    def start_driver(self):
        self.driver = self.get_driver(self.download_folder, headless=self.headless,
                                      driver_path=self.driver_path + '/chromedriver')

    def close_driver(self):
        self.driver.quit()

    def get_driver(self, download_location=None, headless=False, driver_path=None):

        driver = self._get_chrome_driver(download_location, headless, driver_path)

        driver.set_window_size(1400, 700)

        return driver

    def _get_chrome_driver(self, download_location, headless, driver_path):
        chrome_options = chrome_webdriver.Options()
        if download_location:
            prefs = {'download.default_directory': download_location,
                     'download.prompt_for_download': False,
                     'download.directory_upgrade': True,
                     'safebrowsing.enabled': False,
                     'safebrowsing.disable_download_protection': True}

            chrome_options.add_experimental_option('prefs', prefs)

        if headless:
            chrome_options.add_argument("--headless")

        if sys.platform.startswith("win"):
            driver_path += ".exe"

        driver = Chrome(executable_path=driver_path, options=chrome_options)

        if headless:
            self.enable_download_in_headless_chrome(driver, download_location)

        return driver

    def enable_download_in_headless_chrome(self, driver, download_dir):
        """
        there is currently a "feature" in chrome where
        headless does not allow file download: https://bugs.chromium.org/p/chromium/issues/detail?id=696481
        This method is a hacky work-around until the official chromedriver support for this.
        Requires chrome version 62.0.3196.0 or above.
        """

        # add missing support for chrome "send_command"  to selenium webdriver
        driver.command_executor._commands["send_command"] = ("POST", '/session/$sessionId/chromium/send_command')

        params = {'cmd': 'Page.setDownloadBehavior', 'params': {'behavior': 'allow', 'downloadPath': download_dir}}
        command_result = driver.execute("send_command", params)