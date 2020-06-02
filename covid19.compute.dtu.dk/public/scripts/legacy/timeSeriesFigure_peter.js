let TimeSeriesFigure_p = class TimeSeriesFigure_p {

	constructor(data, mainDivId, uniqueId, timeframe, level, mode) {
		// Variables
		this.data = data;
		this.mainDivId = mainDivId;
		this.uniqueId = uniqueId;
		this.timeframe = timeframe;
		this.level = level;
		this.mode = mode;

		// Dimensions and margins
		this.maindiv = document.getElementById(this.mainDivId)
		this.width = this.maindiv.offsetWidth - margin.left - margin.right;
		this.height = figureHeight - margin.top - margin.bottom;

		// Ranges
		this.x = d3.scaleTime().range([0, this.width]);
		this.y = d3.scaleLinear().range([this.height, 0]);

		// Axes
		this.xAxis = d3.axisBottom(this.x);
		this.yAxis = d3.axisLeft(this.y);

		// Line
		this.valueline = d3.line()
			.x(function(d) { return this.x(d[0]); }.bind(this))
			.y(function(d) { return this.y(d[1]); }.bind(this));

		// SVG
		this.svg = d3.select("#" + this.mainDivId)
			.append("svg")
				.attr("width", this.width + margin.left + margin.right)
				.attr("height", this.height + margin.top + margin.bottom)
			.append("g")
				.attr("transform", 
						"translate(" + margin.left + "," + margin.top + ")");

		// TIME
		this.time = data._meta._meta.datetime.map(d => parseDate(d)); // Change to only _meta
		this.dt = d3.max(this.time);
		this.d0 = parseDate(startDate); // Change from global
		this.n_days = (this.dt - this.d0 + 3.6e6) / 86.4e6
		this.time_shown = d3.range(this.n_days+1).map(n => this.d0.addDays(n));

		// SCALE
		this.yrange = [-0.3, 0.8]  // Should come from _meta
		this.x.domain(d3.extent(this.time_shown));
		this.y.domain(this.yrange);


        this.datum = zip([parseDate(startDate), ...this.time], d3.range(this.time.length+1).map(() => 0))


	}

	populateDropdown() {
        d3.select("#dropdown-" + this.uniqueId)
	        .selectAll("option")
	        .data(this.data["_meta"]['_meta']["locations"]).enter()
	        .append("option")
	        .text(d => d)
	        .attr("value", d => d)
	        .attr("selected", d => {
	            if (d==this.level) { return 'selected' };
	        })

	    d3.select('#dropdown-' + this.uniqueId)
            .on("change", () => {
                this.dropdown = document.getElementById('dropdown-' + this.uniqueId);
                this.level = this.dropdown.options[this.dropdown.selectedIndex].value;
                d3.selectAll("#data" + this.uniqueId).remove();
                this.drawAxes();
                this.drawLineDots();
            });
	}

	drawLabels() {
		// Draw title
		this.svg.append("text")
			.attr("x", this.width/2)
			.attr("y", -15)
			.style("text-anchor", "middle")
			.style("font-weight", 700)
			.text("Change in population size (single municipality)");  //Change to global title

		// Draw rel abs labels (optional)
		if (typeof this.mode != "undefined") {

			// rel
			this.svg.append("text")
				.attr("x", -60)
				.attr("y", -15)
				.attr('class', 'toggle')
				.attr("id", 'toggleRelative' + this.uniqueId)
				.style("text-anchor", "left")
				.style("font-weight", 700)
				.style('cursor', 'pointer')
				.text("rel")
				.on('click', handleTextClick.bind(this))

			// abs
			this.svg.append("text")
				.attr("x", -37)
				.attr("y", -15)
				.attr('class', 'toggle')
				.attr("id", "toggleAbs" + this.uniqueId)
				.style("text-anchor", "left")
				.style("font-weight", 300)
				.style('cursor', 'pointer')
				.text("abs")
				.on('click', handleTextClick.bind(this))
		}
	}

	drawAxes() {
        // X-AXiS
		this.svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + this.height + ")")
			.attr("id", "data" + this.uniqueId)
			.call(this.xAxis);

        // Y-AXIS
		if (this.mode == 'count') {
			this.yAxis = d3.axisLeft(this.y).tickFormat(v => v/1e3 + "k")
		} else if (this.mode == 'relative') {
			this.yAxis = d3.axisLeft(this.y).ticks(6, ".0%")
		}

	    if (this.mode == 'count') {
			this.yrange = [0, d3.max([...this.data[this.timeframe][this.level]['baseline'], ...this.data[this.timeframe][this.level]['crisis']])*1.2] // _meta
			this.y.domain(this.yrange);

			// Y-AXIS
			this.svg.append("g")
				.attr("class", "y axis")
				.attr("id", "data" + this.uniqueId)
				.call(this.yAxis);

			// Y LABEL
			this.svg.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", -40)
				.attr("x", -this.height / 2)
				.attr("id", "data" + this.uniqueId)
				.style("text-anchor", "middle")
				.style("font-weight", 500)
				.text("Population size");
		} else if (this.mode == 'relative') {
			this.yrange = [d3.min(this.data[this.timeframe][this.level]['percent_change'])-0.1, d3.max(this.data[this.timeframe][this.level]['percent_change'])+0.1] //_meta
			this.y.domain(this.yrange);
			// Y-AXIS
			this.svg.append("g")
				.attr("class", "y axis")
				.attr("id", "data" + this.uniqueId)
				.call(this.yAxis);



			// Y LABEL
			this.svg.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", -40)
				.attr("x", -this.height / 2)
				.attr("id", "data" + this.uniqueId)
				.style("text-anchor", "middle")
				.style("font-weight", 500)
				.text("Deviation from baseline");
		}
	}


	drawShade() {
	    // SHADES
		this.idxwknd = d3.range(4, this.time_shown.length, 7);
		this.dx = this.x(this.time[2]) - this.x(this.time[0]);
		this.dy = this.y(this.yrange[0]) - this.y(this.yrange[1]);

		this.svg.selectAll('shade')
			.data(this.idxwknd).enter().append("rect")
			.attr("class", "shade")
			.attr("x", d => {
				return d == 0 ? this.x(this.time_shown[d]) : this.x(this.time_shown[d]) - this.dx/4
			})
			.attr("y", d => this.y(this.yrange[1]))
			.attr("width", d => {
				if (d == 0 | d == this.time_shown.length - 2) {
					return this.dx * 3/4;
				} else if (d == this.time_shown.length - 1) {
					return this.dx * 1/4;
				} else {
					return this.dx;
				}
			})
			.attr("height", this.dy)
			.style('fill', '#ecf0f1')
			.style('fill-opacity', 1)

 }

    drawNoData() {
        // NO DATA SHADE
		this.svg.append('rect')
			.attr('x', this.x(this.time_shown[0]))
			.attr('y', this.y(this.yrange[1]))
			.attr('width', this.x(this.time[0]) - this.x(this.time_shown[0]))
			.attr('height', this.dy)
			.attr('fill', 'url(#lines)')
			.attr('stroke-width', 1.5)
			.attr('fill-opacity', 0.2)
		this.svg.append('text')
			.attr('x', 10)
			.attr('y', 20)
			.style("font-weight", 0)
			.style("font-size", "12px")
			.text('NO DATA')
	}

	drawLineDots() {
	    if (this.mode == 'count') {
	        // LINES AND DOTS
			this.datum = zip(this.time, this.data[this.timeframe][this.level]['baseline']);
			this.datum = adjustBaseline(this.datum);
			this.svg.append("path")
				.datum(this.datum)
				.attr('class', 'line-baseline')
				.attr("id", "data" + this.uniqueId)
				.attr('d', this.valueline)
			this.svg.selectAll("dot")
				.data(this.datum)
				.enter().append("circle")
				.attr("class", "dot-baseline")
				.attr("id", "data" + this.uniqueId)
				.attr("cx", d => this.x(d[0]))
				.attr("cy", d => this.y(d[1]))
				.attr("r", 3.5)
				.on('mouseover', d => {
					mouseover(d);
				})
				.on('mousemove', d => {
					mousemoveHistEvent(d);
				})
				.on("mouseout", d => {
					mouseout(d);
				});
			this.datum = zip(this.time, weekavg(this.data[this.timeframe][this.level]['crisis']))
			this.svg.append("path")
				.datum(this.datum)
				.attr('class', 'trendline')
				.attr("id", "data" + this.uniqueId)
				.attr('d', this.valueline)
			this.datum = zip(this.time, this.data[this.timeframe][this.level]['crisis'])
			this.svg.append("path")
				.datum(this.datum)
				.attr('class', 'line')
				.attr("id", "data" + this.uniqueId)
				.attr('d', this.valueline)
			this.datum = zip(this.time, this.data[this.timeframe][this.level]['crisis'])
			this.svg.selectAll("dot")
				.data(this.datum)
				.enter().append("circle")
				.attr("class", "dot")
				.attr("id", "data" + this.uniqueId)
				.attr("cx", d => this.x(d[0]))
				.attr("cy", d => this.y(d[1]))
				.attr("r", 2.5)
				.on('mouseover', d => {
					mouseover(d);
				})
				.on('mousemove', d => {
					mousemoveHistEvent(d);
				})
				.on("mouseout", d => {
					mouseout(d);
				});
	    } else if (this.mode == 'relative') {


            // Horizontal line at zero
            if (this.yrange[0]<=0 && this.yrange[1]>=0){   //Checking if 0 is in the interval
                this.datum = zip([parseDate(startDate), ...this.time], d3.range(this.time.length+1).map(() => 0))
                this.svg.append("path")
                    .datum(this.datum)
                    .attr('class', 'line-horizontal')
                    .attr("id", "data" + this.uniqueId)
                    .attr('d', this.valueline)
            }

			// LINE AND DOT
			this.datum = zip(this.time, weekavg(this.data[this.timeframe][this.level]['percent_change']))
			this.svg.append("path")
				.datum(this.datum)
				.attr('class', 'trendline')
				.attr("id", "data" + this.uniqueId)
				.attr('d', this.valueline)
			this.datum = zip(this.time, this.data[this.timeframe][this.level]['percent_change'])
			this.svg.append("path")
				.datum(this.datum)
				.attr('class', 'line')
				.attr("id", "data" + this.uniqueId)
				.attr('d', this.valueline)
			this.datum = zip(this.time, this.data[this.timeframe][this.level]['percent_change'])
			this.svg.selectAll("dot")
				.data(this.datum)
				.enter().append("circle")
				.attr("class", "dot")
				.attr("id", "data" + this.uniqueId)
				.attr("cx", d => this.x(d[0]))
				.attr("cy", d => this.y(d[1]))
				.attr("r", 2.5)
				.on('mouseover', mouseover)
				.on('mousemove', mousemoveHistEvent)
				.on("mouseout", mouseout);
    }}

    update_time(timeframe) {
		d3.selectAll("#data" + this.uniqueId).remove();
		this.timeframe = timeframe;
		this.drawAxes();
		this.drawLineDots();
	}



}
