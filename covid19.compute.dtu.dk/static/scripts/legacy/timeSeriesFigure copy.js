function timeSeriesFigure(dataPath, mainDivId, uniqueId) {

	// Globals //
	// ------- //

	let data, time;
	let timeframe = "allday",
		level = "Stockholms Kommun",
		mode = 'relative';


	// ----- //
	// Setup //
	// ----- //

	// Dimensions and margins
	let maindiv = document.getElementById(mainDivId)
	let width = maindiv.offsetWidth - margin.left - margin.right,
		height = figureHeight - margin.top - margin.bottom;

	// Set the ranges
	let x = d3.scaleTime().range([0, width]);
	let y = d3.scaleLinear().range([height, 0]);

	// Define the axes
	let xAxis = d3.axisBottom(x);
	let yAxis = d3.axisLeft(y);

	// Define the line
	let valueline = d3.line()
		.x(function(d) { return x(d[0]); })
		.y(function(d) { return y(d[1]); });

	// Adds the svg canvas
	let svg = d3.select("#" + mainDivId)
		.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", 
					"translate(" + margin.left + "," + margin.top + ")");

	// TITLE
	svg.append("text")
		.attr("x", width/2)
		.attr("y", -15)
		.style("text-anchor", "middle")
		.style("font-weight", 700)
		.text("Change in population size (single municipality)");

	// Toggle relative
	svg.append("text")
		.attr("x", -60)
		.attr("y", -15)
		.attr('class', 'toggle')
		.attr("id", 'toggleRelative' + uniqueId)
		.style("text-anchor", "left")
		.style("font-weight", 700)
		.style('cursor', 'pointer')
		.text("rel")
		.on('click', handleTextClick)
	// Toggle abs
	svg.append("text")
		.attr("x", -37)
		.attr("y", -15)
		.attr('class', 'toggle')
		.attr("id", "toggleAbs" + uniqueId)
		.style("text-anchor", "left")
		.style("font-weight", 300)
		.style('cursor', 'pointer')
		.text("abs")
		.on('click', handleTextClick)


	// Start the visualization //
	// ----------------------- //
	d3.json(dataPath).then(function(data_) {
    
		// DATA
		data = data_;

		 // DROPDOWN
        selector = d3.select("#" + uniqueId)
	        .selectAll("option")
	        .data(data["_meta"]['_meta']["locations"]).enter()
	        .append("option")
	        .text(d => d)
	        .attr("value", d => d)
	        .attr("selected", d => {
	            if (d==level) { return 'selected' };
	        });


		// TIME
		time = data._meta._meta.datetime.map(d => parseDate(d));
		let dt = d3.max(time);
		let d0 = parseDate(startDate);
		let n_days = (dt - d0 + 3.6e6) / 86.4e6
		let time_shown = d3.range(n_days+1).map(n => d0.addDays(n));

		// SCALE
		let yrange = [-0.3, 0.8]
		x.domain(d3.extent(time_shown));
		y.domain(yrange);

		// SHADES
		let idxwknd = d3.range(4, time_shown.length, 7);
		let dx = x(time[2]) - x(time[0]);
		let dy = y(yrange[0]) - y(yrange[1]);

		svg.selectAll('shade')
			.data(idxwknd).enter().append("rect")
			.attr("class", "shade")
			.attr("x", d => {
				return d == 0 ? x(time_shown[d]) : x(time_shown[d]) - dx/4
			})
			.attr("y", d => y(yrange[1]))
			.attr("width", d => {
				if (d == 0 | d == time_shown.length - 2) {
					return dx * 3/4;
				} else if (d == time_shown.length - 1) {
					return dx * 1/4;
				} else {
					return dx;
				}
			})
			.attr("height", dy)
			.style('fill', '#ecf0f1')
			.style('fill-opacity', 1)

		// NO DATA SHADE
		svg.append('rect')
			.attr('x', x(time_shown[0]))
			.attr('y', y(yrange[1]))
			.attr('width', x(time[0]) - x(time_shown[0]))
			.attr('height', dy)
			.attr('fill', 'url(#lines)')
			.attr('stroke-width', 1.5)
			.attr('fill-opacity', 0.2)
		svg.append('text')
			.attr('x', 10)
			.attr('y', 20)
			.style("font-weight", 0)
			.style("font-size", "12px")
			.text('NO DATA')

		// X-AXiS
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

		// EVENT LINES
		for (let d of eventDates) {  // eventLinesDates is defined in globals.html
			svg.append('line')
				.attr('class', 'histEvent')
				.attr('id', d[2] + uniqueId)
				.attr('x1', x(parseDate(d[0])))
				.attr('x2', x(parseDate(d[0])))
				.attr('y1', height)
				.attr('y2', height)
			svg.append('circle')
				.attr('class', 'histEventDot')
				.attr('cx', x(parseDate(d[0])))
				.attr('cy', height)
				.attr('r', 3)
				.on('mouseover', mouseover)
				.on('mousemove', () => {
					mousemoveHistEvent(d);
					d3.select("#" + d[2] + uniqueId).attr('y2', 0)
				})
				.on('mouseout', () => {
					mouseout();
					d3.select("#" + d[2] + uniqueId).attr('y2', height)
				})
		}

		// LEGENDS
		svg.append('line')
			.attr('class', 'line')
			.attr('x1', width+10)
			.attr('x2', width+30)
			.attr('y1', 10)
			.attr('y2', 10)
		svg.append('circle')
			.attr('class', 'dot')
			.attr('cx', width+20)
			.attr('cy', 10)
			.attr('r', 2.5)
		svg.append('text')
			.attr('class', 'right-legend')
			.attr('x', width+35)
			.attr('y', 10+4)
			.text('daily')
		svg.append('line')
			.attr('class', 'line-baseline')
			.attr('x1', width+10)
			.attr('x2', width+30)
			.attr('y1', 30)
			.attr('y2', 30)
		svg.append('text')
			.attr('class', 'right-legend')
			.attr('x', width+35)
			.attr('y', 30+4)
			.text('baseline')
		svg.append('line')
			.attr('class', 'trendline')
			.attr('x1', width+10)
			.attr('x2', width+30)
			.attr('y1', 50)
			.attr('y2', 50)
		svg.append('text')
			.attr('class', 'right-legend')
			.attr('x', width+35)
			.attr('y', 50+4)
			.text('7 day avg')

		visualize(data, timeframe, level);
	})
	
	d3.select('#' + uniqueId)
		.on("change", () => {
			let dropdown = document.getElementById(uniqueId);
			level = dropdown.options[dropdown.selectedIndex].value;
			d3.selectAll("#data" + uniqueId).remove();
			visualize(data, timeframe, level);
		});

	// Handle data //
	// ----------- //

	function visualize(data, timeframe, level) {

		if (mode == 'count') {
			yAxis = d3.axisLeft(y).tickFormat(v => v/1e3 + "k")
		} else if (mode == 'relative') {
			yAxis = d3.axisLeft(y).ticks(6, ".0%")
		}

		if (mode == 'count') {
			yrange = [0, d3.max([...data[timeframe][level]['baseline'], ...data[timeframe][level]['crisis']])*1.2]
			y.domain(yrange);

			// Y-AXIS
			svg.append("g")
				.attr("class", "y axis")
				.attr("id", "data" + uniqueId)
				.call(yAxis);

			// Y LABEL
			svg.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", -40)
				.attr("x", -height / 2)
				.attr("id", "data" + uniqueId)
				.style("text-anchor", "middle")
				.style("font-weight", 500)
				.text("Population size");

			// LINES AND DOTS
			datum = zip(time, data[timeframe][level]['baseline']);
			datum = adjustBaseline(datum);
			svg.append("path")
				.datum(datum)
				.attr('class', 'line-baseline')
				.attr("id", "data" + uniqueId)
				.attr('d', valueline)
			svg.selectAll("dot")
				.data(datum)
				.enter().append("circle")
				.attr("class", "dot-baseline")
				.attr("id", "data" + uniqueId)
				.attr("cx", d => x(d[0]))
				.attr("cy", d => y(d[1]))
				.attr("r", 3.5)
				.on('mouseover', d => {
					mouseover(d);
				})
				.on('mousemove', d => {
					mousemoveDot(d);
				})
				.on("mouseout", d => {
					mouseout(d);
				});
			datum = zip(time, weekavg(data[timeframe][level]['crisis']))
			svg.append("path")
				.datum(datum)
				.attr('class', 'trendline')
				.attr("id", "data" + uniqueId)
				.attr('d', valueline)
			datum = zip(time, data[timeframe][level]['crisis'])
			svg.append("path")
				.datum(datum)
				.attr('class', 'line')
				.attr("id", "data" + uniqueId)
				.attr('d', valueline)
			datum = zip(time, data[timeframe][level]['crisis'])
			svg.selectAll("dot")
				.data(datum)
				.enter().append("circle")
				.attr("class", "dot")
				.attr("id", "data" + uniqueId)
				.attr("cx", d => x(d[0]))
				.attr("cy", d => y(d[1]))
				.attr("r", 2.5)
				.on('mouseover', d => {
					mouseover(d);
				})
				.on('mousemove', d => {
					mousemoveDot(d);
				})
				.on("mouseout", d => {
					mouseout(d);
				});

		} else if (mode == 'relative') {
			yrange = [d3.min(data[timeframe][level]['percent_change'])-0.1, d3.max(data[timeframe][level]['percent_change'])+0.1]
			y.domain(yrange);

			// Y-AXIS
			svg.append("g")
				.attr("class", "y axis")
				.attr("id", "data" + uniqueId)
				.call(yAxis);

			// Horizontal line at zero
			datum = zip([parseDate(startDate), ...time], d3.range(time.length+1).map(() => 0))
			svg.append("path")
				.datum(datum)
				.attr('class', 'line-horizontal')
				.attr("id", "data" + uniqueId)
				.attr('d', valueline)

			// Y LABEL
			svg.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", -40)
				.attr("x", -height / 2)
				.attr("id", "data" + uniqueId)
				.style("text-anchor", "middle")
				.style("font-weight", 500)
				.text("Deviation from baseline");

			// LINE AND DOT
			datum = zip(time, weekavg(data[timeframe][level]['percent_change']))
			svg.append("path")
				.datum(datum)
				.attr('class', 'trendline')
				.attr("id", "data" + uniqueId)
				.attr('d', valueline)
			datum = zip(time, data[timeframe][level]['percent_change'])
			svg.append("path")
				.datum(datum)
				.attr('class', 'line')
				.attr("id", "data" + uniqueId)
				.attr('d', valueline)
			datum = zip(time, data[timeframe][level]['percent_change'])
			svg.selectAll("dot")
				.data(datum)
				.enter().append("circle")
				.attr("class", "dot")
				.attr("id", "data" + uniqueId)
				.attr("cx", d => x(d[0]))
				.attr("cy", d => y(d[1]))
				.attr("r", 2.5)
				.on('mouseover', mouseover)
				.on('mousemove', mousemoveDot)
				.on("mouseout", mouseout);
		}
	}

	// Handlers
	function mousemoveDot(d) {
		let tooltiptext;
		if (mode == 'relative') {
			tooltiptext = "Date: <b>" + formatDate(d[0]) + "</b><br>" + "Deviation: <b>" + Math.round(d[1]*100*1e1)/1e1 + "%</b>"
		} else {
			tooltiptext = "Date: <b>" + formatDate(d[0]) + "</b><br>" + "Deviation: <b>" + Math.round(d[1]) + "</b>"
		}
		tooltip
			.html(tooltiptext)
			.style("left", (d3.event.pageX) + "px")
			.style("top", (d3.event.pageY) + "px");
	}

	function handleTextClick() {
		if (mode == 'count') {
			d3.select('#toggleRelative' + uniqueId)
				.style('font-weight', 700);
			d3.select('#toggleAbs' + uniqueId)
				.style('font-weight', 300);
			mode = "relative";
		} else {
			d3.select('#toggleRelative' + uniqueId)
				.style('font-weight', 300);
			d3.select('#toggleAbs' + uniqueId)
				.style('font-weight', 700);
			mode = "count";
		}
		d3.selectAll("#data" + uniqueId).remove();
		visualize(data, timeframe, level)
	}

	function update0() {
		d3.selectAll("#data" + uniqueId).remove();
		timeframe = 'allday';
		visualize(data, timeframe, level)
	}
	function update1() {
		d3.selectAll("#data" + uniqueId).remove();
		timeframe = '00';
		visualize(data, timeframe, level)
	}
	function update2() {
		d3.selectAll("#data" + uniqueId).remove();
		timeframe = '08';
		visualize(data, timeframe, level)
	}
	function update3() {
		d3.selectAll("#data" + uniqueId).remove();
		timeframe = '16';
		visualize(data, timeframe, level)
	}

	return {
		update0: update0,
		update1: update1,
		update2: update2,
		update3: update3,
	}
}