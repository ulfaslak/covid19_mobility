# **Staying home**
{{< fontsize 14 >}}*Visualization and data analysis by [Ulf Aslak](mailto:ulfaslak@gmail.com) and [Peter Møllgaard](mailto:peter-em@hotmail.com).*{{< /fontsize >}}

{{< figures/globals >}}

In the Movement maps dataset, one movement is recorded for each active user. A movement is registered when in time window *t* - 1 a user spends most of their time in location *A*, then in time window *t* spends most of their time in location *B*, and *A* ≠ *B*. If this condition is not met, either because the time of the stay was too short of the user simply didn't move, the length of the movement is set to 0 km.

It is, therefore, clear that the most likely type of movement to be recorded in the Movement maps are trips between home and work.

For this visualization we have counted the fraction of the population that spent most of their time during working (10–18) and late-afternoon hours (18–02) in the same tile. Given the constraints in the data due to preprocessing by Facebook, it is best interpreted as **a conservative upper bound on the number of individuals that do not go to work** during the day.

As such, it says nothing about how people are moving around near their homes. It also does not represent most of the people that work very close to home. Therefore, it is important to reference this figure with care and to understand that it is primarily the relative change compared to the baseline that offers insight.

Note that there is also a significant portion of municipalities that are not available for inspection. This is because there is not enough data inside these. See '**Data** > Movement Maps' for notes on data loss due to privacy.

Also note that this figure is similar to the the one presented in '**Visualizations** > *Where people stay* > Going out'. The figures measure essentially the same thing, but from different perspectives using different datasets.

{{< figures/total_stationarity >}}

> **This figure is interactive!** You can:
> * Change the municipality displayed using the **dropdown menu**.
> * Toggle whether the y-axis displays the absolute measurements (rel{{< color color="white" >}}/{{< /color >}}**abs**) or the deviation from the baseline (**rel**{{< color color="white" >}}/{{< /color >}}abs).
> * **Hover** the curves to see precise values.
> * **Hover** the marks on the x-axis to see events.