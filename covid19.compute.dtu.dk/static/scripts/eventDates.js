let eventDates = {
	'sweden': [
		["2020-04-30 00:00:00", 'Valborgmässoafton', 'event1'],
		["2020-05-01 00:00:00", 'Förste maj, Public holiday in Sweden', 'event2'],
        ["2020-06-19 00:00:00", 'Midsommar, Public holiday in Sweden', 'event3']

	],
	'denmark': [
		["2020-03-11 00:00:00", 'PM announces lockdown starting March 16', 'event1'],
		["2020-03-16 00:00:00", 'Lockdown officially begins', 'event2'],
		["2020-04-09 00:00:00", 'Skærtorsdag (public holiday during Easter)', 'event3'],
		["2020-04-10 00:00:00", 'Lockdown relaxations announced', 'event4'],
		["2020-04-15 00:00:00", 'Child-care soft-reopens', 'event5'],
		["2020-04-20 00:00:00", 'Small businesses open', 'event6'],
		["2020-04-27 00:00:00", 'IKEA opens (controversy)', 'event7'],
		["2020-05-08 00:00:00", 'Great prayer day (public holiday)', 'event8'],
		["2020-05-11 00:00:00", 'Retail (including malls) reopens', 'event9'],
		["2020-05-18 00:00:00", 'Restaurants, cafes, churches and elementary schools reopen', 'event10'],
		["2020-05-27 00:00:00", 'Everything except nightclubs, festivals, etc. reopen', 'event11'],
		["2020-07-28 00:00:00", 'COVID-19 outbreaks in Aarhus and Ringsted', 'event12']
	],
    'italy': [
        ["2020-02-19 00:00:00", 'First local case', 'event12'],
		["2020-03-04 00:00:00", 'Schools close', 'event13'],
		["2020-03-09 00:00:00", 'Phase 1: Lockdown', 'event14'],
		["2020-05-04 00:00:00", 'Phase 2: Reopenings', 'event15'],
		["2020-06-15 00:00:00", 'Phase 3: "Living with covid"', 'event16'],
    ]   
}
d3.json('/data/countries.json').then(function(data){
    data.forEach(function(country){
        if (!(country.toLowerCase() in eventDates)) {
           eventDates[country.toLowerCase()] = []
        }
    })
})




