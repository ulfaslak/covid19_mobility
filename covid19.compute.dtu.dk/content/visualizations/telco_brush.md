# **Highly detailed travel data within Denmark**
{{< fontsize 14 >}}*Visualization, data analysis and data processing by [Ulf Aslak](mailto:ulfaslak@gmail.com), [Peter Møllgaard](mailto:peter-em@hotmail.com) and [Laura Alessandretti](mailto:l.alessandretti@gmail.com).*{{< /fontsize >}}

{{< figures/globals >}}

<!-- {{< vspace 20 >}} -->

When a person is active on their telecommunications device (like a smartphone) the cell tower is logged. Cell towers have known position, and as such people's movements can be recorded at large scale. This visualization plots the aggregated movements of ~5.600.000* telecommunications users, through a span of time that covers the 2020 coronavirus lockdown period and more.

{{< figures/movements_between_admin_regions_telco_brush >}}

> **This figure is interactive!**
> * **Hover** the curser over a municipality to display the number of movements from, to and within.
> * **Click** any municipality to see travel between it and other municipalities, then **hover** other municipalities to see the exact quantities.
> * **Drag** the time brush below or change its span to visualize travel in different time periods.
> * **Toggle** color scaling: linear (*lin*), square root (*sqrt*), or logarithmic(*log*). Use `shift` key to rotate between scalings or click the scaling buttons.
> * **Toggle** travel normalization: none (*no*), by local population count (*pop*), or by municipality area (*area*).
> * **Press** `esc` key or click the white areas to unselect.
> * **Scroll** on the map to zoom.
> * **Drag** the curser on the map to pan.


## Time series plot

Here is the same data plotted as a time series. A couple of things to note:
* In aggregate, travel within municipalities reaches baseline levels much earlier than travel between. But looking at major cities like København, Århus and Odense, this difference is not apparent. It appears to be a property of suburban non-holiday municipalities (try Ringsted, Silkeborg, Holstebro).
* Travel relative to the baseline peaks on weekends. But note that this is because the baseline is winter time, where people stay home more on weekends. In actuality, people travel much less on weekends (try clicking 'abs').
* In urban municipalities (København, Århus, Odense), mobility dropped significantly during the lockdown. In nature rich municipalities, the opposite occurred (Gribskov, Halsnæs, Frederikshavn).
* Since June where the summer holiday began for many, there is a large increase in local travel (click 'within'). This relative increase is highest in holiday destinations like Læsø, Samsø, Fanø, etc.

{{< figures/change_telco >}}


*\* Data comes from three major mobile phone operators. While ~5.600.000 is roughly 97% of the Danish populations this number does not take into account persons carrying multiple devices with a sim card or even dual sim devices.*