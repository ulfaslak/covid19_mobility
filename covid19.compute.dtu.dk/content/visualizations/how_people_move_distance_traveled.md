# **Distance traveled**
{{< fontsize 14 >}}*Visualization and data analysis by [Ulf Aslak](mailto:ulfaslak@gmail.com) and [Peter Møllgaard](mailto:peter-em@hotmail.com).*{{< /fontsize >}}

{{< figures/globals >}}

By averaging the length of trips between tiles we get an estimate of the average distance traveled each day by users in the dataset. During the lockdown we should expect this quantity to be significantly reduced, primarily because people work from home.

Note that this is *an extremely conservative lower bound* on mobility. The shortest distance we can measure is 2.63 km, and we only have information about trips if they start and end in different time windows (eight hours apart), in different places where the user spent large amounts of time. For example, if someone leaves their home in the suburbs during working hours (10–18) to spend the afternoon in the city yet overall spent most of that time window at home (not an unlikely scenario for a shopping trip on the weekend), the entire movement goes unrecorded, and it will appear as if the user stayed in at home the whole time. It is only if the user went to the city—or other place different than where they would spend the afternoon and night—for the majority part of the time window that the trip is recorded.

As a result, **seeing the distance rise even a small amount, is a strong signal that people are going back to work.**

It should, at the same time, be understood that this *daily distance traveled per capita* measure cannot be taken at face value, as it is in reality much higher. The most insightful measure in this plot is therefore the relative deviation from the baseline, a reflection of how the curve is changing compared to the baseline. Toggle **rel**{{< color color="white" >}}/{{< /color >}}abs to see the plot of *daily distance traveled per capita* relative to the baseline, which measures activity before the lockdown.

Note that there is also a significant portion of municipalities that are not available for inspection. This is because there is not enough data inside these. See '**Data** > Movement Maps' for notes on data loss due to privacy.

{{< figures/total_displacement >}}

> **This figure is interactive!** You can:
> * Change the municipality displayed using the **dropdown menu**.
> * Toggle whether the y-axis displays the absolute measurements (rel{{< color color="white" >}}/{{< /color >}}**abs**) or the deviation from the baseline (**rel**{{< color color="white" >}}/{{< /color >}}abs).
> * **Hover** the curves to see precise values.
> * **Hover** the marks on the x-axis to see events.