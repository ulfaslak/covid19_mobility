# **Population distribution**
{{< fontsize 14 >}}*Visualization and data analysis by [Ulf Aslak](mailto:ulfaslak@gmail.com) and [Peter Møllgaard](mailto:peter-em@hotmail.com).*{{< /fontsize >}}

{{< figures/globals >}}

The figure below displays the **fraction of people that have changed location** compared to a similar time frame before the lockdown. We estimate this variable by summing the positive and absolute negative baseline population deviation across all tiles and dividing my two. Simply, this corresponds to averaging the amount of red and green in the [Landscape visualization](/mobility/popdensevis/index.html), which signals that someone is not where they usually are during this time of the week.

Note that the change we see here is *a lower bound* of the actual movement because we can assume there are cases where pairs of people (coincidentally) trade places, which cancels out any measurable deviation in the population distribution. This point is important in interpreting the figure.

{{< figures/difference >}}

> **The figure is interactive!** You can:
> * Change the region displayed using the **dropdown menu**.
> * Toggle the time window to display results for `all day`, `10-18` or `18-02`.
> * **Hover** the curves to see precise values.
> * **Hover** the marks on the x-axis to see events.

The [Gini Index](https://en.wikipedia.org/wiki/Gini_coefficient) is another way of visualizing these changes. This index measures how *unevenly distributed* (or *concentrated*) a distribution is and can, therefore, inform us about trends in how the population spreads out across the country. As we can see from the giant peaks of cities in the Population density maps visualization (see *Visualizing population distribution*), the population is usually very unevenly distributed. We observe in the same map visualization that people spread out during the lockdown, distributing themselves more evenly throughout the country.

The Gini Index ranges from zero to one. If the population spreads out perfectly such that every tile contains the same number of people, the Gini Index will be zero. If all of Denmark concentrates in a single tile it will be one. In the figure below you can select different timeframes for different parts of the country. The figure below display the Gini Index over time.

{{< figures/gini >}}

> **The figure is interactive!** You can:
> * Change the region displayed using the **dropdown menu**.
> * Toggle the time window to display results for `all day`, `10-18` or `18-02`..
> * Toggle whether the y-axis displays the absolute measurements (rel{{< color color="white" >}}/{{< /color >}}**abs**) or the deviation from the baseline (**rel**{{< color color="white" >}}/{{< /color >}}abs).
> * **Hover** the curves to see precise values.
> * **Hover** the marks on the x-axis to see events.

