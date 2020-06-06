# **Movements between municipalities**
{{< fontsize 14 >}}*Visualization and data analysis by [Ulf Aslak](mailto:ulfaslak@gmail.com) and [Peter Møllgaard](mailto:peter-em@hotmail.com).*{{< /fontsize >}}

{{< figures/globals >}}

<!-- {{< vspace 20 >}} -->

Using the Movement Maps we can visualize the distribution of the working population, and where people work relative to where they live.

The Movement Maps segment daily travel into three time windows. Specifically, for time window *t*, the travel count from region/tile *i* into *j* represents the number of active Facebook users that spend the majority of their time during time window *t* - 1 inside *i* and the majority of their time during time window *t* inside *j*.

As discussed in '**Data** > Movement Maps', this choice of aggregation from the Facebook Data for Good team costs us the ability to accurately assess the amount of travel happening between and within regions.

However, something we can reliably quantify is, on a given day, what share of the population **spends the working hours away from home**. Specifically, given the way travel is aggregated in the Movement Maps, travel counts into regions/tiles in the night hours (16–00 window) represents the number of people that spend the majority of their working hours (8—16) somewhere else. It is fair to believe that most of these travel counts represent people **going to work**.

**The map below** compares, how many people are going to work in each municipality before and after the lockdown. By default it displays *Change*, which is the percentage deviation between the size of the working population on the date selected with the slider, and the corresponding baseline (before lockdown). Clicking *On date* shows value for the date selected in the slider and *Baseline* for the corresponding baseline day. You can click any municipality to reveals where people who live there go to work.

A general pattern you will find is that people living in urban municipalities also work there, whereas people living in municipalities next to more urbanized municipalities will work in these.

When moving the slider through time you will see that the deviation—the *change*—between *Baseline* and *On date* decreases. This is the same pattern that we summarize in '**Visualizations** > Staying home' and '**Visualizations** > Going out'.

{{< figures/movements_between_admin_regions >}}

> **This figure is interactive!** You can:
> * **Hover** the curser over an administrative region to display the share of the Facebook population that makes daily journeys we assume represents work.
> * **Click** any administrative region to see where the population in that region goes to work.
> * **Drag** the time slider to display data for different dates.
> * **Select** either to display valus for the selected date (*On date*), the *Baseline* or the percentage deviation between these (*Change*).
> * **Hold** `shift` key after having selected (clicked) a region to display where people who work there live (as opposed to the default: where people who live there work).
> * **Press** the escape key to unselect a region.

*Note*: When clicking an administrative region, *Change* values displayed on other regions can be dramatically large. This is because, typically, only a small share of region populations work outside their home region, and because of the deviation calculation is as simple as (*A* - *B*) / *B*, they can blow up if *B* is small.