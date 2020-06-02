---
title: Population Density Maps
type: post
---

# Population Density Maps

For understanding *Where people are* we use "Population Density Maps", which are provided by the Facebook's [Data for Good](https://dataforgood.fb.com/) initiative. Specifically, we use Population density maps at the tile level (see *Granularity*).

**Description**: A Population density map seperates the country into different areas, and for each it counts the number of users that spend most of their time there, for three eight hour time windows each day. For example, for the 10–18 (working hours) time window on May 4, there may be 52.1k active Facebook users that spend most of their time inside a certain area of Copenhagen. Because data is aggregated like this, there is no information left to identify individuals and privacy is thus preserved (see *Privacy and data loss* below).

**Time**: The earliest data made available starts March 28. We continuously receive new data with \~1.5 days delay. For each day, three data files are provided; one for each of the time windows 0–8, 8–16, and 16–24 GMT. In Denmark from March 29 to October 25 (DST), time windows in local time are 02–10, 10–18 and 18–02.

**Granularity**: Population density maps splits the country into different areas. We gain access to two different levels of granularity. Level (1) describes population counts at the lowest *administrative* level, which for Denmark is municipalities. Level (2) describes population counts inside geographical *tiles* up to 1.5 km by 1.5 km in size. The administrative level maps are aggregates of the tile level maps, but they differ in a systematic way due to privacy preservation (see *Privacy and data loss* below).

{{< columns >}}
Granularity: **Administrative regions**
![img](/data_description_population_admin.png)
<--->
Granularity: **Tiles**
![img](/data_description_population_tile.png)
{{< /columns >}}

**Baseline**: For each count (whether it is for a tile or an administrative region) a corresponding *baseline* count is provided. The baseline is the average count for the same day of the week and time window over the 45 days prior to data generation. It is important to note, that since data generation starts on March 28 but lockdown starts on March 16, around two weeks of the 45 baseline days span into the lockdown period. Therefore, by comparing to this baseline *reported effects may be as much as 33% smaller* than those we might have obtained if comparing to a baseline that did not include lockdown.

**Crisis and baseline counts for an administrative region**
![img](/data_description_population_baseline.png)

**Further preprocessing**:
In any given time interval, the total number of counted individuals across the whole country is between 344k and 540k (*mean*: 459k; *median*: 447k; typically lowest between 0–8 GMT). These are Facebook users with location tracking enabled that actively use the Facebook mobile app at some time during a given interval. To offer realistic population counts, we factor into these user counts the ratio between the total number of people in Denmark (5.787.997, as of Thursday, April 16, 202; source: [Worldometer](https://www.worldometers.info/world-population/denmark-population/)) and the number of active users in a given time interval. This ratio varies between 10.7 and 16.8. Although Facebook provides precomputed percentage change values between baseline and crisis, the percentage changes we report are computed *after* factoring in this ratio, seperately for crisis and baseline. This recalibration assumes that active Facebook users are distributed evenly throughout the population.

**Privacy and data loss**: Counts are made unavailale in tiles/municipalties at times when there are less than 10 active users. This causes a systematic underreporting of population counts from very low-density rural regions. This is especially a problem in the tile-level maps where it is more likely that an area has few users. Thus, there is a trade-off between granularity and data availablity. The average data loss in tile level maps compared to administrative region level maps is 82% (±11%), and loss is greater in rural than in urban regions of the country.