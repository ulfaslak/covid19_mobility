#!/usr/bin/env python3

from pull_data import pull
import preprocess_everything
import os

os.chdir("/home/petem/Dropbox/Peter_Dropbox/HOPE/WorldCovid19/")
print('running')
pull.run()
preprocess_everything.run()
