---
title: Population redistribution
type: post
---

# **Population re-distributed!**
{{< fontsize 14 >}}*Post by [Sune Lehmann](mailto:sljo@dtu.dk) and [Laura Alessandretti](mailto:l.alessandretti@gmail.com). Published: May 12, 2020.*{{< /fontsize >}}

The lockdown presented a massive disruption to daily lives in Denmark. 

As discussed in the [Population Landscape](/posts/population_landscape/) post, we observed a massive decrease of the number of people in the central districts of cities and airports. We can see this quite clearly in the screenshot from the [Landscape visualization](/mobility/popdensevis/index.html), which shows Copenhagen during Easter.

{{< columns >}}
![img](/cph_empty_center.png)
<--->
*A view of Copenhagen during Easter. We see that urban centers which are normally full of people are deserted (indicated by red colors). While vacation areas along the coasts experience a massive increase of visitors (shown in green).*
{{< /columns >}}

But we can't learn everything from beautiful pictures of single cities. One thing that this type of viz is not good at showing, is **changes over time**. To get at those changes, we want to construct measures which summarize the overall difference from a normal state-of-affairs. And then study this measure as it changes over time.

We have created two visualizations to study how "spread out" the population is -- and how that changes over time. You can find the two visualizations and ask your own questions [here](/visualizations/where_people_are_population_concentration/). Below, we discuss some of our most important findings from these visualizations.


#### **~4% of Danes are not where they were before lockdown**

The share of population relocated (see Figure below) corresponds to the fraction of individuals that are to be found in a different area compared to before lockdown. 
At the end of March, that was the case for 4.4% of Danes. During Easter, the population relocated increased up to 7.2%, and then, by the end of April, its value has dropped down to approximately 3.4%.


![img](/pop_relocated.png)

<!-- ### **Raw relocation**
Any {{< color color="#c0392b" >}}positive{{< /color >}} or {{< color color="#009432" >}}negative{{< /color >}} deviation observed in tiles means someone is not where they usually are. By averaging the total amount of positive and negative deviation we can assess the share of people that—relative to the given timeframe—*have relocated*.

*Question: How many people are not in their usual place?*


**Observation 1:** *2–4% of the population has temporarily moved away from their home.* The relocation we observe during afternoon and night (select 18–02) equates to the number of people that are not at home at night. Relocation peaks at 5% on Friday of Easter. We expect this to decrease to 0% when society has fully reopened, but at the current time *[written: May 4]* there does not appear to be a decrease compared to the earliest recorded week of lockdown.

**Observation 2:** *5-7% are displaced during working hours*. Selecting the time window 10–18 we observe that people have relocated work to other places—like home—and are, therefore, not in their usual place–their workplace. For the reason mentioned under *Leaving home during the day* we can only take the values on the y-axis as a lower bound. But we do observe that a decreasing proportion of the population keeps away from work. -->




### **Gini index**
The [Gini Index](https://en.wikipedia.org/wiki/Gini_coefficient) is a nerdy index, which measures how *unevenly distributed* (or *concentrated*) a distribution is and can, therefore, inform us about trends in how the population spreads out across the country. As we can see from the giant peaks of cities in the Population density maps visualization, the population is usually very unevenly distributed. We observe in the same map visualization that people spread out during the lockdown, distributing themselves more evenly throughout the country.

The Gini Index ranges from zero to one. If the population spreads out perfectly such that every tile contains the same number of people, the Gini Index will be zero. If all of Denmark concentrates in a single tile it will be one. You can explore the interactive version of the visualization [here](/mobility/popdensevis/index.html)

#### **Absolute values of Gini Index**
So the first (and trivial) thing to notice can be seen clearly in the figure below. Within the *Capital region* shown on the right, the population is very unevenly distributed (cf. the "mountains" in the image above), so the Gini Index is close to one. Instead, within *Zealand* shown on the left, the population is more spread out, and therefore the Gini coefficient is lower. In both plots we see a small upwards trend over time, indicating that the population concentration is increasing.


{{< columns >}}
*Zealand*
![img](/gini_abs_sjaelland.png)
<--->
*Capital region*
![img](/gini_abs_hovedstaden.png)
{{< /columns >}}


#### **Relative changes of the Gini Index**

By looking at the relative values of the Gini Index, we can see how much the current spread of population differs from what we would observe in "normal" times (specifically, we took the month before the lockdown as a reference). We can observe that, across Denmark, the concentration of the population has decreased by approximately 2%. The population was particularly spread out during Easter, when the Gini coefficient was 5% lower than usual. 
During April, the Gini coefficient has stayed approximately constant, suggesting that, when it comes to the overall spread of the population in Denmark, we do not yet see things going back to normal.

![img](/gini_all_rel.png)



<!-- >
**Observation 3:** *Population concentration has decreased by 6-1%*. This is in terms of the Gini index. This concentration decrease (or "spreading out") peaks over Easter which supports our observations above.

**Observation 3:** *Population concentration is slowly increasing*. On week 14 during weekdays (March 30–April 3) the average deviation from baseline was -2.8%. By week 18 the weekday average deviation from baseline was -2.1%.-->


<!-- > THE OVERALL STORY TO BE WRITTEN: There are major changes to where people stay both during the night and during the day throughout the lockdown. Here we describe these changes quantitatively, that is, how many people are in a different place than they would otherwise be if the lockdown had not occurred. Knowing that these changes amount to a more evenly spread out (or less concentrated) population, we quantify this effect using the Gini coefficient (note by Ulf: because it is nicely bounded between 0 and 1 so it is good for comparing distributions with differernt number of states), and find...
>
> Below is text copied from legacy reports: -->