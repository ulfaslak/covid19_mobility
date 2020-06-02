---
title: Travel and mobility
type: post
---

# **Traveling patterns and mobility**

{{< fontsize 14 >}}*Report by [Ulf Aslak](mailto:ulfaslak@gmail.com) and [Sune Lehmann](mailto:sljo@dtu.dk).*{{< /fontsize >}} {{< lastmod >}}

{{< figures/globals >}}

Human mobility is a proxy of overall activity within a country. As Denmark reopens, we gain insight to a number of important trends by carefully monitoring the state of mobility:

* How fast is activity returning to normal levels?
* Can we see change points in the data as a result of new policies?
* How is mobility between municipalities changing?
* How much activity is there inside different regions? Is there any correlation between activity and disease spread?

This (continuously updated) report adresses these questions. Data for this report are *Movement Maps* and were provided by the Facebook's [Data for Good](https://dataforgood.fb.com/) initiative; please see the section *Data description* at the bottom of this page for descriptive details.

## **Analyses**

In the Movement Maps, the country is gridded into small tiles that are around 2.8 kilometers long and wide. Each day, in turn is split into three time intervals: 0–8, 8–16, and 16–24 (GMT). For each active user a line is drawn between the tile in which they spent most time in the last eight-hour time bin and the current eight-hour time bin. Facebook then aggregates these lines giving us the flow of people between tiles.

## **Distance traveled**
By averaging the length of trips between tiles we get an estimate of the average distance traveled each day by users in the dataset. During the lockdown we should expect this quantity to be significantly reduced, primarily because people work from home.

{{< figures/total_displacement >}}

Plotting this data reveals, as expected, a significant reduction in mobility. 


## **Staying near home**

{{< figures/total_stationarity >}}

## **Mapping movements between municipalities**

{{< figures/movements_between_admin_regions >}}


## **Data description**
Data was made available through Facebook's [Data for Good](https://dataforgood.fb.com/) initiative. The earliest data made available starts March 28; at the lowest level it details population counts in geographical tiles up to 3 km by 3 km in size in three timebines each day (0–8, 8–16, and 16–24 GMT). For this report we combine two aggregated datasets: mobility within municipalities tracks movements between tiles, and mobility between municipalities tracks movements between municipalities. The movements measured between tiles are much sparser due to Facebooks privacy preservation preprocessing steps. **For privacy preservation**, data is unavailale in tiles/municipalties where at a given time < 10 people are present. This introduces an important limitation: It significantly reduces the amount of available data, because if for a given movement there is less than 10 active users present in either the source tile or the destination tile (which is likely), the movement is not reported. Therefore, in municipalies with little movement within, almost no data is available. Moreover, it biases *Distance traveled* (negatively) and *Staying near home* (positively).