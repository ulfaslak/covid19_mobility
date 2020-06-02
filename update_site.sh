# Change dir
cd ~/HOPE/WorldCovid19/

# then build the website
cd covid19.compute.dtu.dk/public;
rsync -av --exclude 'data' * petem@thinlinc.compute.dtu.dk:/www/sites/covid19.compute.dtu.dk;
