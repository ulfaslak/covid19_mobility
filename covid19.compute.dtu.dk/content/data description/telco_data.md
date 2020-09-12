---
title: Telco data description
type: post
---
# Movement maps using telco data

These data show the number of daily trips between Danish Municipalities, estimated from aggregated mobile phone data 
provided by four large telecommunication companies. 
It is not possible to infer individual mobility from this dataset.
Data covers the 
period from 1. February of 2020.

## Origin of data

The data set was delivered by four major Danish telcos to [Statistics Denmark](https://www.dst.dk/da/) (DST) to help the Danish [State Serum Institute](https://en.wikipedia.org/wiki/Statens_Serum_Institut) (SSI) - the Danish equivalent to the US's CDC - to model the spread of COVID-19 and understand population behavior in response to various lock-down/mitigation measures. 
The dataset was officially requested by SSI and the legality of its use was ensured by the [Ministry of Industry, Business, and Financial Affairs](https://eng.em.dk).
To release the data from DST, we have removed a small amount of data to ensure the origin of the data (which operator) is confidential, see below.
We are currently working on releasing the full data set in downloadable form.

The data includes the daily number of trips between pairs of municipalities. Each entry consists of: 
* Unix timestamp
* Origin: the KOMKODE of the Danish municipality where trips start
* Destination: the KOMKODE of the Danish municipality where trips end
* Counts: estimated number of trips between origin and destination

## Statistical processing
The number of trips are estimated combining aggregated location data provided by four major Danish 
telecommunication companies. First, we pre-processed the data to make the four datasets comparable. Secondly, we 
combined the four datasets together. Finally, we filtered data to remove potentially sensitive information.

{{< html >}} <ins>Original data obtained from mobile-phone providers:</ins> {{< /html >}}   

*Company 1 (c1):* Origin-destination trips aggregated by zipcode and by day. A user was considered static when located in 
the same cell-tower for more than 15 minutes.  
  
*Company 2 (c2):* Transitions aggregated by zipcode every 6 hours. (Transitions in the same zipcode are excluded)  
  
*Company 3 (c3):* Origin-destination trips aggregated by municipality and by day.     
  
*Company 4 (c4):* Origin-destination trips aggregated by zipcode and by day.  

{{< html >}} <ins>Pre-processing:</ins> {{< /html >}}  

*Coarse-grain space:* for c1, c2, and c4, we summed the number of trips originating from zipcodes in the same municipality 
and directed to zipcodes in the same municipality.  
*Coarse-grain time*: For c2, we summed the number of trips between a given origin and destination occurring in the same day.   
*Adjust shares:* We renormalized the number of trips to make sure that the fraction of trips measured by each company is 
approximately equivalent to the company’s share of customers. We proceeded as follows:
* We computed the total number of trips {{< katex >}} T_c {{< /katex >}} in March by each company c. 
* We took company c1 as a reference and computed the ratio {{< katex >}} \frac{T_c}{T_{c1}}. {{< /katex >}}
* We computed the customer ratio {{< katex >}} \frac{N_c}{N_{c1}} {{< /katex >}}, where {{< katex >}} N_c {{< /katex >}} 
is the number of customer of company c, obtained from publicly available data.
* For each company, we computed the constant {{< katex >}} k_c {{< /katex >}}, such that {{< katex >}} \frac{N_c}{N_{c1}}=k_c\frac{T_c}{T_{c1}}. {{< /katex >}}
* We multiplied by {{< katex >}} k_c {{< /katex >}} the number of trips measured by company c.  

{{< html >}} <ins>Aggregation:</ins> {{< /html >}}  

The total number of trips {{< katex >}} AB_c(t) {{< /katex >}} between any pair of municipalities {{< katex >}} A {{< /katex >}} 
and {{< katex >}} B {{< /katex >}} on day {{< katex >}} t {{< /katex >}} is estimated as the sum of the trips computed by 
each company:  
{{< html >}} $$AB(t) = \sum_c AB_c(t),$$ {{< /html >}}
where {{< katex >}} AB_c(t) {{< /katex >}} is the number of trips between {{< katex >}} A {{< /katex >}} and 
{{< katex >}} B {{< /katex >}} on day {{< katex >}} t {{< /katex >}} using data from company {{< katex >}} c {{< /katex >}}.  
In days where data from the four companies is available , we compute {{< katex >}} AB(t) {{< /katex >}} using the quation above. For some days {{< katex >}} t* {{< /katex >}}, data from a certain company {{< katex >}} c* {{< /katex >}} may be missing. In this case, 
we estimate {{< katex >}} AB(t*) {{< /katex >}} as follows:  
We compute the average share of trips between {{< katex >}} A {{< /katex >}} and {{< katex >}} B {{< /katex >}} over time for 
company {{< katex >}} c* {{< /katex >}}.  
{{< html >}} $$\overline{AB_{c*}}=\sum_t\frac{AB_{c*}(t)}{AB(t)}.$$ {{< /html >}}
We compute the partial number of trips between {{< katex >}} A {{< /katex >}} and {{< katex >}} B {{< /katex >}} on day 
{{< katex >}} t* {{< /katex >}} using data from the available companies:
{{< html >}} $$AB_{partial}(t*) = \sum_{i\neq c*} AB_{c*}(t).$$ {{< /html >}}
We estimate the number of trips between {{< katex >}} A {{< /katex >}} and {{< katex >}} B {{< /katex >}} on day 
{{< katex >}} t* {{< /katex >}} by company {{< katex >}} c* {{< /katex >}} as:
{{< html >}} $$AB_{c*}(t*) \sim \frac{AB_{partial}(t*)}{1-AB_{c*}}.$$ {{< /html >}}
We finally compute {{< katex >}} AB(t*) {{< /katex >}} as:
{{< html >}} $$AB(t*) \sim AB_{partial}(t*)+AB_{c*}(t*).$$ {{< /html >}}  

{{< html >}} <ins>Filtering:</ins> {{< /html >}}  

We apply two filters:
* We remove entries such that the number of trips between {{< katex >}} A {{< /katex >}} and {{< katex >}} B {{< /katex >}} 
at time {{< katex >}} t {{< /katex >}} is larger than 5. Thus, we impose {{< katex >}} AB(t)>5 {{< /katex >}}.
* We remove all entries with origin {{< katex >}} A {{< /katex >}} at time {{< katex >}} t {{< /katex >}} if any given 
company accounts for more than {{< katex >}} 80\% {{< /katex >}} of the total number of outgoing trips from {{< katex >}} A {{< /katex >}}.
Thus we impose: 
{{< html >}} $$\frac{\sum_BAB_c(t)}{\sum_BAB(t)}<0.8,$$ {{< /html >}} 
for all companies {{< katex >}} c {{< /katex >}}.


