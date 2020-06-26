---
title: Escape from Covid island
type: post
---

# **Escape from Covid island**
{{< fontsize 14 >}}*Post by [Anna Sapienza](mailto:ansa@sodas.ku.dk), [Malene H. Jespersen](mailto:malenehj@sodas.du.dk), [Kristoffer Albris](mailto:kristoffer.albris@sodas.ku.dk), [Morten Axel Pedersen](mailto:map@sodas.ku.dk) and [Sune Lehmann](mailto:sljo@dtu.dk) . Published: Month Date, 2020.*{{< /fontsize >}}

{{< vspace 20 >}}

## Gaming during COVID-19 is an intense affair

It might seem logical that the amount of gaming is going to go up when you instruct the majority of the industrialized world to stay home 24/7 for several months. 

The COVID-19 crisis has indeed come to define an extraordinary moment for online games and the gaming industry. Games have become more popular than before as people are turning to these and other digital activities and communities in the loss of physical and social interaction due to widespread social distancing.

{{< tweet 1265358231326658560 >}}

The assumption that games might cheer you up, on day 34 of sitting alone in your small apartment, has even been embraced by the World Health Organization (WHO). WHO endorsed gaming as an alternative to physical sociality with the hashtag [#PlayApartTogether](https://womenlovetech.com/gaming-industry-launches-playaparttogether-in-fight-against-covid-19/) in an effort to nudge people to stay at home. They worked with gaming companies to incorporate WHO information about COVID-19 into online games and platforms. This can be considered a strong statement from the WHO, given that [gaming disorder](https://www.who.int/news-room/q-a-detail/gaming-disorder) was just included in the 11th Revision of the International Classification of Diseases (ICD-11) in 2018.

Gaming can indeed get pretty intense! 

When we saw that gaming was used as a **gateway to escape from the pandemic** by an increasing part of the population, we knew we had to look at gaming during the COVID-19 crisis. We wanted to understand how this new situation has impacted people’s social and psychological well-being and their lives more generally.

## Basic stats and overview

It comes as no surprise that the gaming industry has registered a staggering boost in online activity of players from all over the world. Let's start with some overall stats documenting this surge:
1.	In the United States, reports claimed a [75% increase in gaming usage](https://www.hollywoodreporter.com/news/gaming-usage-up-75-percent-coronavirus-outbreak-verizon-reports-1285140) during the coronavirus outbreak;
2.	Italy registered a 70% increase in internet use, credited to online gaming and especially to [Fortnite and Call of Duty](https://www.forbes.com/sites/paultassi/2020/03/13/fortnite-and-call-of-duty-straining-italian-internet-as-coronavirus-keeps-kids-home/#155e144d357e);
3.	Call of Duty: Warzone has surpassed [30 million players](https://www.forbes.com/sites/erikkain/2020/03/20/as-social-distancing-intensifies-call-of-duty-warzone-crosses-30-million-players/#57ece77d1a3d) after just ten days from its release, partially because of the measures put in place to fight the COVID-19 pandemic;
4.	The gaming platform Steam broke the [20 million concurrent users](https://www.theverge.com/2020/3/16/21181272/steam-concurrent-user-record-set-cs-go) barrier on March 15, with 20.3M users active on the platform and 6.4M players In-Game.

In this analysis we'll focus on Steam, which is the perfect place for some data-powered analysis of gaming patterns thanks to its [open API](https://developer.valvesoftware.com/wiki/Steam_Web_API), the always [up-to-date news](https://store.steampowered.com/news/) of its games, and [third-party tools](https://steamdb.info/) tracking the activity of its users online. 

Let's take a look at what happened during the lockdown and identify which games drove the boost of activity.

## Steam on the rise

The Steam Database reported that Steam reached its all-time record of users connected to the platform on March 15 and credited this achievement to the COVID-19 lockdown.

{{< tweet 1239180882826715136 >}}

Over that weekend, there were no special Steam releases or sales. Thus, the spike in the number of concurrent users on the platform was most likely due to people staying at home, social-distancing and following quarantine guidelines.

Let's take a closer look at what happened that weekend. The rise in concurrent users actually started earlier, as levels on Friday the 13th were already above the weekday average. That something new and different was happening became clear on March 14, when the number of users on Steam (i.e. online on the platform, browsing for news or games, etc.) and In-Game (i.e. playing a game) went beyond 19.7M and 6.2M respectively. This was not a one-time event! As we can see from the figure below, the number of concurrent users both on Steam and In-Game kept increasing in the whole month following March 14.

![png](/output_4_0.png)

Not only did the number of concurrent users increase of about 30% in this period of time, but many other patterns changed. If we look at the number of people on Steam before mid-March, there was a clear weekly pattern with weekend activity dominating the picture. After the lockdown, that trend basically disappears. The number of concurrent users on Steam, before March 14, was consistently about 13.4% more during weekends than weekdays. This difference leveled out in just a month after March 14, reaching 0.7% more users during weekends, and especially till the end of May, when the difference essentially vanishes: just 0.04% more users during the weekends.

![png](/output_6_0.png)

When we consider In-Game users, we still see weekend/weekday patterns, where the difference between weekdays and weekend only decreased from 21.8% to 12%. This is likely another effect of lockdown policies and specifically of working from home. When you're working from home, it is easy to surf webpages and keep them open while working (corresponding to the huge number of Steam users). When it comes to actually playing a game, however, it is more difficult to work at the same time.

![png](/output_8_0.png)

## Life is slowly going back to normal

So how did behavior change before and after mid-April, when many countries set out to reopen? A neat way to analyze this is by computing the change (in percent) in the number of users on Steam and In-Game over time relative to a **baseline** of behavior before the lockdown (see the figure below). We took into account data about concurrent users in the month before March 14, to compute the average number of users per day of the week and used this as our baseline. Here, we can see that the platform continued to experience growth in the number of users both on Steam and In-Game until it settled in mid-April, peaking at a staggering 47.4% and 45.9% increase respectively. Then the trend started to slowly decrease, especially for In-Game users, who now returned to levels comparable to those of mid-March. (Note that since the baseline has weekends with more usage, we can see those as dips in the relative-change plots).

![png](/output_10_0.png)

The relative change of In-Game users reached a peak on Monday, April 13, which was likely driven by Easter holidays in many Western and other countries. We also detect another peak on Saturday, April 4, with about 39.8% more In-Game users, compared to an average of 25% more up until that day. We are going to make a more detailed inspection at what is driving this surge in concurrent users below, so stay tuned!

## What games are players attracted to?

At first glance, if we just look at the absolute numbers of users online, the most popular games are also the ones that have been attracting most players before the lockdown. Players mostly stuck to old favorites: Counter-Strike: Global Offensive (CS:GO) hit an all-time peak of 1,024,845 simultaneous players and became the most popular game over the weekend of March 14-15. Dota 2 and PLAYERUNKNOWN'S BATTLEGROUNDS (PUBG) followed with 701,632 and 515,050 players, respectively.

![png](/output_12_0.png)

As a matter of fact, among the thousands of games that Steam has, only a handful of them attracts these very large numbers of concurrent players In-Game. The top 10 popular games on the platform account for more than 50% of all daily concurrent users, with CS:GO, Dota 2, and PUBG alone accounting for 37.5% of users!

![png](/output_14_0.png)

These gaming titans continue to dominate the field. Very well, but in order to dig into what has actually **changed** during the lockdown, we'll look into the *relative* changes. Which games have experienced the most influx or user drops? 

At a general level, consider the top 50 popular games on Steam and the relative change (in percent) of their average number of In-Game users in the months before and after March 14 (figure below). Here, it becomes very clear that the effect of the lockdown was diverse. We see games that have drastically increased their number of concurrent players, such as *Stellaris* and *Football Manager 2020* with 207% and 103.9% more users than before, as well as games that faced a loss in the number of players. This is the case for PUBG. Despite being the third game in the ranking and accounting for 9.7% of all gamers on Steam, PUBG saw a 1.7% drop in concurrent users in the month following March 14. Other games, such as *Monster Hunter: World* and *Red Dead Redemption 2* faced an even bigger loss of more than 10% of users.

![png](/output_16_0.png)

When we noticed the extreme popularity of *Football Manager 2020*, our immediate thought was that the canceling of all soccer matches as a consequence of the lockdown must have brought a deep and unstoppable hunger for soccer related games among fans.

Yet upon closer inspection this turned out not to be the case. The lockdown did indeed impact *Football Manager 2020*, but hunger for soccer alone does not explain its remarkable success. When we look at other big movers in the ranking, it is clear that other factors are at play. Let's take a look as some examples of games with large increases in user numbers: *Stellaris*, *Football Manager 2020*, and *Cities: Skylines* (figure below).

![png](/output_18_0.png)

**Stellaris** more than doubled its numbers of players on March 17, followed by another growth after May 12. These changes were actually driven by:
1. the release of [Stellaris - Federations and the free 2.6.0 "Verne" update](https://steamcommunity.com/games/281990/announcements/detail/2701536662568287291) on March 17;
2. the release of [Stellaris 2.7 Anniversary Patch](https://steamcommunity.com/games/281990/announcements/detail/2175746291898008198).

**Football Manager 2020** experienced a huge increase in concurrent users on March 18, that lasted until April 1. That seems suspicious. It turns out that March 18 was the start of **a full [free week](https://steamcommunity.com/games/1100600/announcements/detail/3221702421026099937) of play**, that was then extended until April 1. In this case, however, concurrent players started to increase around March 14 and the numbers after the free period remained high. It's possible that these smaller effects are a result of the lockdown.

A similar pattern is true for **Cities: Skylines**, where the user-counts began to increase slightly in the second half of March. This growth in concurrent players saw a remarkable boost on March 26, when the game was made free to play [from March 26 to March 30](https://steamcommunity.com/games/255710/announcements/detail/2086796394489969938).

Such external factors - patch releases, events, etc. - make it difficult to isolate particular effects that the lockdown might have had on online gaming. We therefore cross-checked news published on [Steampowered](https://github.com/SocialComplexityLab/writing/wiki/store.steampowered.com/news) with the dates where we observed the most substantial relative changes in the numbers of concurrent users. In so doing, we wanted to identify a subset of games with a growth that is with relatively certainty due to the lockdown.

Below, you can find the updated list of games and the respective relative difference.

![png](/output_20_0.png)

Interestingly, the most popular games such as *CS:GO* and *Dota 2* did not experience the largest players' turnout in relative terms. *CS:GO* gained about 37.1% more users, while *Dota 2*, second in the ranking of the most popular games, only gained 13.5% more users. It is possible that the game genre also played a role in the differnt players' turnout that *CS:GO* and *Dota 2* recorded. The former is a multiplayer First-Person Shooter (FPS) game, while the latter is a Multiplayer Online Battle Arena (MOBA) game, whose rules and complexity makes it harder for newcomers to play. Moreover, transitioning to levels and ranks in *Dota 2* is usually found less smooth than similar games, such as *League of Legends*, whose terms and concepts are clearer and easier to learn.

At the top of the ranking (reaching more than 60% increase in players) are: *Age of Empires II*, the old favorite *Counter-Strike*, *Sid Meier's Civilization* (*V* and *VI*), and *Terraria*. An interesting observation is that three of these are **strategy games focused on *creating* a civilization or an empire from scratch**.

## Is the lockdown effect lasting?

While some kind of lockdown policies continue to be in place in most countries, many governments took steps to ease measures throughout the course of May. The new post-corona reality, which may last for months or even years, sets the scene for a new range of questions: With life slowly returning to normal, and the overall numbers of concurrent players gently going down, will some of these games experience a persistent effect? Who is immune to the inevitable player-churn? We can explore this by computing the relative difference in number of players, comparing the month after Easter and the baseline from before COVID-19 lockdowns. The figure below shows both the relative difference up until mid-April (purple bars as in previous plot) and the relative difference of the month after mid-April (light blue bars).

![png](/output_22_0.png)

The majority of games has indeed faced player-churn. Many are back to baseline levels. For example, *Stardew Valley* and our ill-fated friend, *Football Manager 2019*. A few games experienced increases in concurrent players that were even higher than in the month after March 14. In particular, *Terraria*, *PAYDAY2*, and *Total War: WARHAMMER II* saw high gains.

Let's take a look at what happened to these three games. Once again, we found that non-COVID-19 related events recently impacted the activities around these games. We marked those moments in grey in the figure below.

![png](/output_24_0.png)

In the case of **Terraria**, whose number of players kept increasing during the lockdown, we see a major burst on May 16, the day in which [The End of the Journey](https://steamcommunity.com/games/105600/announcements/detail/2205019689483623800) was released. Marking the beginning of the final chapter of Terraria, this key update caught the attention of so many players that their number on the release date **quintupled**!

**Total War: WARHAMMER II** saw a first jump in concurrent players during the weekend following Easter (April 17-19) and once again, it went [free to play](https://steamcommunity.com/games/594570/announcements/detail/4325087404599258575) that weekend. A second burst occurred on May 21, when [The Warden & The Paunch](https://steamcommunity.com/games/594570/announcements/detail/2172369859084179358) was released.

**PAYDAY 2** also saw a rise in players during the lockdown period. This rise was then followed by a new increase in the number of players following April 28-29. On these two dates the [update 199.3](https://steamcommunity.com/games/218620/announcements/detail/2197137123022851331) was released followed by a [Steam sale](https://steamcommunity.com/games/218620/announcements/detail/2198263655981661117) with discounts up to 80%.

In summary, we see an overall uptick in gaming time, cleverly exploited by the gaming companies using classic marketing strategies, such as free play and expansions to popular games. We'll discuss more about this topic at the end of the post.

## Outliers to outline

### The phantom game

Did you notice something weird in the top 50 popular games? Maybe a game you didn't even know existed? You are not alone! While examining the ranking of the top 50 games and their relative change in number of users, we discovered that *Spacewar*, a seemingly ancient game, had reached more than 40% increase in concurrent users.

![png](/output_26_0.png)

*Spacewar* is based on the 1962 space combat game developed by Steve Russell for the newly installed DEC PDP-1 minicomputer at the MIT. The game features two spaceships “the needle” and “the wedge” which fight each other while maneuvering in the gravity well of a star. It experienced a boost in concurrent users starting on March 14 and remains above baseline levels to this day (end of May). At a first glance, *Spacewar* is just like all the other games. And yet, for reasons that we could not immediately explain, this simple and outdated game achieved a bigger gain than a juggernaut such as *CS:GO*. How could this be possible?

![png](/output_28_0.png)

This is what we found out:

*"Spacewar was one of the first multiplayer games ever made. [...] It started out as an example for developers using Steam’s SDK, but it has ended up with a far more nefarious purpose."* ([source](https://www.rockpapershotgun.com/2019/11/19/spacewar-why-a-hidden-ancient-game-keeps-showing-in-steams-most-played-games/))

In a nutshell, *Spacewar* was originally included on Steam as a part of Steamworks’ SDK, to become a testing tool for developers and publishers. Despite the fact that no results show up if you try to search for the game within Steam, it is still possible to download and play it today. However, this is not what most of its concurrent users are doing. The game, first meant to be a tool for developers to understand the Steamworks API and its aspects, is now a hidden door used by pirated games to get onto Steam. As Valve uses an automated system to detect cheats and licenses used for games, pirates had to discover a different way for bypassing the system and using their cracked games undercover. This is done by exploiting *Spacewar*’s AppID (i.e. the unique game identifier stored in Steam). In particular, when a version of a game is illegally obtained but still requires Steam to be launched, the game will be reported as *Spacewar* (with AppID equal to 480) instead.

### The mystery of April the 4th!

As we previously noticed, Steam reached its all-time record of concurrent players on April 4, with more than 8.1M players In-Game. What happened that day that brought so many players on the platform? As it turns out, different things were going at the same time. By investigating what happened in our list of top popular games, we found many games that saw a boost or spike in their number of players. Among these are *Don’t Starve Together*, *Wall Paper Engine*, and in particular *Human: Fall Flat* and *PUBG*.

*PUBG* in particular caught our attention here, because its players account for a staggering 9.7% of all In-Game users on Steam. As we show in the figure below, *PUBG* experienced a striking peak on April 4, reaching 925,699 concurrent users, an achievement that was published on the [official community page](https://forums.pubg.com/topic/401699-player-count-at-900k-release-ranking-now-or-never/).

![png](/output_30_0.png)

Many players wondered what happened that day and whether they had missed something. 

![png](/output_32_0.png)

In order to answer this question, we went further and tried to identify large events that occurred that day to shed light on what happened. The first reason that partially explains this sudden burst in the activity of gamers, is related to the [Fantasy Battle Royale](https://www.pubg.com/2020/03/31/fantasy-battle-royale/) event that *PUBG* ran in the week from April 1 to April 7. However, this does not explain why April 4 was the only day in which the number of users skyrocketed.

A second, and perhaps more likely, explanation could involve the decision made by some gaming companies, including *Tencent*, with *Call of Duty: Mobile* and *PUBG Mobile*, to **pause access to their servers for an entire day** beginning at midnight on that day. The server shutdown of *PUBG Mobile* affected regions including mainland China, Hong Kong, Macao and Taiwan and was due to the Chinese government decision to include a [shutdown of mobile game servers](https://www.hollywoodreporter.com/news/chinas-mobile-game-servers-shutter-24-hours-coronavirus-memorial-1288471) in its national mourning day.

As [BBC reported](https://www.bbc.com/news/world-asia-china-52162004): on April the 4th *"China has mourned the victims of the coronavirus outbreak by observing a three-minute silence, bringing the nation to a halt"*. With *PUBG Mobile* on hold, it is possible that gamers moved on platforms such as Steam to keep playing.

## How did gaming companies react to COVID-19?

As noted, we have seen an interesting dynamic between increased gaming during lockdown and marketing strategies. Gaming companies deftly surfed the wave of extra attention brought on by COVID-19. Some of them exploited this moment to acquire an even bigger audience through incentives such as new patch releases and periods of time in which their games were free to use. *Sports Interactive*, for instance, not only gave *Football Manager 2020* for free for a week but subsequently extended this period.

Other companies took a different approach. Some companies sought to strengthen their online communities and ran COVID-19 fundraiser campaigns inside their games. For instance, this was the case for:
1.	*Humble Bundle*, which raised over [6.5million dollars for coronavirus relief](https://www.nme.com/en_au/news/gaming-news/humble-bundle-raises-over-6-5million-for-coronavirus-relief-2654352);
2.	*Paradox Interactive*, which ran a [COVID-19 Response Fundraiser](https://store.steampowered.com/newshub/app/255710/view/2086796394507092200) between March 31 and April 3;
3.	*SCS Software*, which launched the [#TruckAtHome Event](https://store.steampowered.com/newshub/app/227300/view/2082292794877847420) in *Euro Truck Simulator 2*.

Finally, some games were explicitly used to help other industries and to boost participation online. *Fortnite*, for instance, led its biggest event ever on April 23, when more than 12 million players of the battle-royale video game put down their guns to attend [Travis Scott's concert](https://www.wired.com/story/fortnite-travis-scott-party-royale-third-place/). Here is the [full event video](https://www.youtube.com/watch?time_continue=2&v=wYeFAlVC8qU&feature=emb_title) if you missed it and want to check it out!

## Discussion

Our analysis highlighted an increased attention to online gaming that is driven by the COVID-19 crisis. Given the different risks associated with extensive online gaming, which has over recent years been documented by an increasing number of researchers (Petry et al. 2014, King et al. 2014, Przybylski et al. 2017, Wang et al. 2019), it is important to have a discussion about online gaming disorders and addiction. 

Did the COVID-19 crisis affected people’s psychological well-being? What can be found in our data that could signal this and other issues? Here below, we pose three main questions and try to discuss them in light of our analysis, the latest news and the related research findings.

### Could the increase in online gaming lead to disorders and addiction?

Issues related to online gaming are being brought up both among pro gamers and amateurs. On the one hand, pro gamers more often incur the risk of developing stress-related issues due to their strict schedules, constant tournaments around the world, and performance pressure. It has been reported that [a growing number of Counter-Strike players](https://www.dr.dk/sporten/oevrig/spillerforening-raaber-vagt-i-gevaer-stress-er-et-stigende-problem-i-counter-strike) in the last few months started experiencing stress-related problems. And to be sure, it does seem somewhat troubling when recently three professional Counter Strike players have withdrawn from their teams: "[...] a total of three players have decided to take a break from their respective teams. The two Danes Markus Kjærbye from North and Lukas Rossander from Astralis and Swedish Olof Kajbjer Gustafsson from Faze Clan." ([source](https://www.dr.dk/sporten/oevrig/spillerforening-raaber-vagt-i-gevaer-stress-er-et-stigende-problem-i-counter-strike)) Markus Kjærbye and Lukas Rossander explained on Twitter that, in the last three months, they had experienced symptoms of stress and burnout.

{{< tweet 1262655814445289473 >}}

{{< tweet 1261239426769969153 >}}

On the other hand, the continuous exposure to online games could higher the risk of players developing a gaming disorder, which often leads to significant daily, work, or educational disruptions and, in extreme cases, to addiction. Discussions about gaming addiction have been going on for a long time. As mentioned previously, in 2018 WHO included gaming disorder in the 11th Revision of the International Classification of Diseases. Our research and the latest news show a substantial increase in gaming activities during the COVID-19 lockdown, not only in terms of number of players but also in terms of the overall time spent online. However, an increase is no reason to stigmatize games and initiatives such as #PlayApartTogether, especially because it is still difficult to discern between healthy and unhealthy usage of online games. A large online gaming time use is not necessarily problematic (Király et al. 2017). Rather, it could provide new sources for social support, foster new and existing friendships, and decrease the feeling of loneliness (Carras et al. 2017). Especially during the COVID-19 lockdown, people may have used gaming to stay in touch with their friends or simply to pass the time and replacing other activities that cannot be done in isolation. Moreover, our research shows that the numbers of concurrent players is slowly decreasing now that the lockdown policies have been relaxed, probably indicating that the majority will not experience long-lasting effects. Nevertheless, we have to recognize that not only the increase in online gaming but also the increased number of people that are exposed to such activity can rise the risks associated with gaming and possibly lead to lasting problematic behavior for vulnerable individuals. It will be relevant to inspect whether a prolonged increase of online game time shows associations with mental health issues or social problems post-corona.

### Will new gaming habits distract us at work?

When focusing on the number of concurrent players on Steam, we found that the discrepancy between weekend and weekdays, which was pronounced before the lockdown, leveled up and disappeared. This phenomenon is still true even if the absolute numbers of concurrent players on the platform started to decrease again. The number of players online on Steam during weekdays could signal that people are having a harder time controlling online distraction throughout the day and particularly when working or studying from home. If Steam is actually open in the background, how does it affect our attention? Is it easier to become distracted? 

If yes, one could argue that not only the access to digital devices and online platforms, but also the environment can affect whether you become distracted by gaming. Even though we cannot study this aspect through our data, previous research suggests that “cyberslacking” happens more often when working away from the office. This can be due to a decrease in peer monitoring and an increasing distance to the social community of work, leading to lower engagement (O’Neill et al. 2014). 

However, what we also found in our data is that the weekday-weekend gap is not as marked for In-Game players. This could be the signal that gamers are able, at least to a certain extent, to inhibit gaming as a distraction. Gaming is indeed able to occupy a lot of time and attention, making it harder to perform other activities in parallel. 

### What is the role of gaming companies when considering risks of addiction?

As we observed in our study, gaming companies constantly use methods to boost players’ engagement in the game. Brand new features to explore in the game, as well as periods of time where the game is free to play attract ever increasing audiences. These are well-known strategies that gaming companies exploit to increase short- and long-term engagement and retention in their games. The design of game features to increase engagement is not a new process, on the contrary it is fundamental for the success of a game, but especially in this period of time its impact is amplified by the simple fact that more people are online. 

Could then this engagement by design be exacerbated to the point of leading part of the player population to develop addiction? If so, there could be a connection in the way gaming companies exploit the uptick in gaming via marketing strategies and the concepts highlighted in the research by Schüll (2014), where machine gambling in casinos is intrinsically designed to maintain players and create addiction. 

While engagement is a fundamental aspect that cannot be disconnected from the actual game structure, it is then important to have a discussion about the social responsibility that gaming companies have (Van Rooij, 2010). Some steps have been already taken to acknowledge the possible risks that consumers might experience when gaming. Many games now feature warning messages about the risk of overuse, similarly to the health messages on tobacco and alcohol packages, as consumers should be informed about consequences from overuse that can be attributed to playing online video games. However, other initiatives should be initiated, such as taking into account gaming risks while responsibly designing games. There has to be a greater focus on the actual structural features of the games that could potentially influence gamers and lead to addiction-like behaviors. Moreover, the information that gaming companies have on the actual gaming time of players could be used to set in place referral strategies to guide gamers. It is not the gaming industry’s responsibility to identify and treat unhealthy gaming habits. However, the industry could partner with the government to become an asset in preventing these problematic gaming behaviors.

### References 

*Petry, N. M., Rehbein, F., Gentile, D. A., Lemmens, J. S., Rumpf, H. J., Mößle, T., ... & Auriacombe, M. (2014). An international consensus for assessing internet gaming disorder using the new DSM‐5 approach. Addiction, 109(9), 1399-1406.*

*King, D. L., & Delfabbro, P. H. (2014). The cognitive psychology of Internet gaming disorder. Clinical psychology review, 34(4), 298-308.*

*Przybylski, A. K., Weinstein, N., & Murayama, K. (2017). Internet gaming disorder: Investigating the clinical relevance of a new phenomenon. American Journal of Psychiatry, 174(3), 230-236.*

*Wang, Q., Ren, H., Long, J., Liu, Y., & Liu, T. (2019). Research progress and debates on gaming disorder. General psychiatry, 32(3).*

*Király, O., Tóth, D., Urbán, R., Demetrovics, Z., & Maraz, A. (2017). Intense video gaming is not essentially problematic. Psychology of Addictive Behaviors, 31(7), 807.*

*Carras, M. C., Van Rooij, A. J., Van de Mheen, D., Musci, R., Xue, Q. L., & Mendelson, T. (2017). Video gaming in a hyperconnected world: A cross-sectional study of heavy gaming, problematic gaming symptoms, and online socializing in adolescents. Computers in Human Behavior, 68, 472-479.*

*O’Neill, T. A., Hambley, L. A., & Chatellier, G. S. (2014). Cyberslacking, engagement, and personality in distributed work environments. Computers in Human Behavior, 40, 152–160.*

*Schüll, N. D. (2014). Addiction by design: Machine gambling in Las Vegas. Princeton University Press.*

*Van Rooij, A. J., Meerkerk, G. J., Schoenmakers, T. M., Griffiths, M., & Van de Mheen, D. (2010). Video game addiction and social responsibility.*
