---
title: What's happening in my city?
type: post
---

# **How new corona cases impact travel**

{{< fontsize 14 >}}*Post by [Ulf Aslak](mailto:ulfaslak@gmail.com). Published: Aug, 13, 2020.*{{< /fontsize >}}

{{< figures/globals >}}

There have been two recent outbreaks of COVID-19 in Denmark; one in Aarhus and another in Ringsted. They started around the same time, approximately on July 28. Both are highly local, one among workers at a butchery and another among visitors to a Somali cultural center. We call these "superspreading events", and they are entirely expected based on how we understand viruses spread when very few people are infected.

Both spreading events have received a large amount of media attention, and with case numbers going up on the affected and nearby regions, new lockdown restrictions are being advertised by government and municipalities. As we learned early on, lockdown has a huge effect on travel patterns. And though they have been advertised, no serious restrictions have been imposed yet. Any sign of behavioral change we can detect in our data is, therefore, mostly due to people's own choices.

In this blog post we investigate what impact the new corona cases and renewed media attention have on travel inside different municipalities of the country.

The first media mention of new corona cases [occured on July 29](https://www.dr.dk/nyheder/indland/stor-stigning-i-antallet-af-smittede-paa-dansk-slagteri) in connection to the Ringsted outbreak. Later on August 3, [a soccer win celebration in Aarhus](https://www.dr.dk/nyheder/indland/det-er-nok-en-supersprednings-begivenhed-smittetal-i-aarhus-mangedoblet-over) was connected to rapidly rising case numbers.

## A look at case numbers

The figure below shows the number of newly infected since July 28 per 100.000 inhabitants, for the five most affected municipalities.

{{< figure src="/change_in_infected.png" caption="***Relative case number increase since July 28*** *in the five most affected municipalities. Shaded regions indicate new cases since last reading. Aarhus and Ringsted, where initial superspreading occured, stand apart but other municipalities like Silkeborg (neighbor of Aarhus), and Ishøj and Brøndby (near Copenhagen) have increasing number of infected.*">}}

Since almost all media attention has been on Aarhus and Ringsted, this figure is somewhat reassuring. **Aarhus and Ringsted visibly stand apart in case numbers.** Note also that case number increase has stabilized to a linear increase in these places, and has seemingly ceased in Ringsted.


## How is mobility impacted?

The most interesting measure of travel to inspect in relation to growing case numbers, is the degree to which people stay at home during the day. Read about how we measure this in the [Going out](http://localhost:1313/visualizations/where_people_are_going_out/) visualization page. The two plots below are screenshots from that section of our website. Note that the curves are smoothened to a seven-day average to reveal trends.

Looking at how much people leave their home during daytime in Aarhus, Ringsted and Ishøj compared to the whole country as a baseline, it is clear that, following July 28, a collective drop seems to occur. This is good news. Aarhus and Ringsted have received most of the medias attention, and this seems to have had an effect on the people's behavior.

{{< figure src="/travel_divergence.png" caption="***Deviation in how much people leave home during the day in Aarhus, Ringsted and Ishøj***. *The vertical dashed line indicates July 28 where case numbers suddenly rose.*">}}

Reversely, when we visualize the same metric for Silkeborg and Brøndby who are also in the top five of affected municipalities the opposite happens. Here, the number of people that spend time outside of their homes during the day appears to increase.

{{< figure src="/travel_divergence_bad.png" caption="***Deviation in daily distance traveled for people in Brøndby and Silkeborg***.">}}


## Differences in how municipalities react

To get an overview of how people in different parts of the country react to information about new case numbers, we visualize how their "going out during the day" behavior changes over time as case numbers increase. Each circle is a municipality, and its size corresponds to the total (cumulative) number of cases in that municipality on the given date. As you drag the time-slider, starting July 28, you see case numbers increase (circles moving upwards) and mobility behavior change (move left or right). **Ideally, we should observe that municipalities move left as they go upwards in this plot.** This means that their inhabitants react to information about new cases of COVID-19 and self-quarantine accordingly.

{{< figures/case_numbers_vs_travel >}}