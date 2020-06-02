# Change dir
cd ~/Dropbox/Peter_Dropbox/HOPE/WorldCovid19/

# execute all python scripts
/home/petem/Applications/anaconda3/bin/python3 pull_data/pull.py
/home/petem/Applications/anaconda3/bin/python3 preprocess_everything.py;

# then build the website
cd covid19.compute.dtu.dk;
/usr/local/bin/hugo;
cd public;
rsync -av * petem@thinlinc.compute.dtu.dk:/www/sites/covid19.compute.dtu.dk;
