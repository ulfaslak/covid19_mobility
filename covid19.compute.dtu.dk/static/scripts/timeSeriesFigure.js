class TimeSeriesFigure {

	constructor(data, mainDivId, uniqueId) {
		// Variables
		this.data = data;
		this.mainDivId = mainDivId;
		this.uniqueId = uniqueId;
		this.timeframe = data._meta.defaults.timeframe;  // may be undefined
		this.level = [data._meta.defaults.level];          // may be undefined
		this.mode = data._meta.defaults.mode;            // may be undefined
	
		// Dimensions and margins
		let margin = {top: 70, right: 88, bottom: 30, left: 60},
			figureHeight = 370;
		this.maindiv = document.getElementById(this.mainDivId)
		this.width = this.maindiv.offsetWidth - margin.left - margin.right;
		this.height = figureHeight - margin.top - margin.bottom;

		// Parse the date / time
		this.parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
		this.formatDate = d3.timeFormat("%e %B");

		// Ranges
		this.x = d3.scaleTime().range([0, this.width]);
		this.y = d3.scaleLinear().range([this.height, 0]);

		// Axes
		this.xAxis = d3.axisBottom(this.x).ticks(6);
		this.yAxis = d3.axisLeft(this.y);

		// Line
		this.valueline = d3.line()
			.x(d => this.x(this.checkUndefined(d[0])))
			.y(d => this.y(this.checkUndefined(d[1])));

		// Define tooltip div
		this.tooltip = d3.select("body").append("div")
			.attr("class", "tooltip")
			.style("display", "none");

		// SVG
		this.svg = d3.select("#" + this.mainDivId)
			.append("svg")
				.attr("width", this.width + margin.left + margin.right)
				.attr("height", this.height + margin.top + margin.bottom)
			.append("g")
				.attr("transform", 
						"translate(" + margin.left + "," + margin.top + ")");
	}


	// Clear and recreate
	// ------------------

	clearData() {
		d3.selectAll("#data" + this.uniqueId).remove();
	}

	redrawData() {
	}


	// Setup
	// -----

	setXDomain() {
		// Range of time
		this.time = this.data._meta.datetime.map(d => this.parseDate(d));

		// New range of time
		let dt = d3.max(this.time);
		let d0 = this.parseDate(this.data._meta.variables.startDate);
		let n_days = (dt - d0 + 3.6e6) / 86.4e6
		this.time_shown = d3.range(n_days+1).map(n => d0.addDays(n));

		// Scale
		this.x.domain(d3.extent(this.time_shown));
	}

	setRadio() {
		let rwidth = 145, rheight=27;

		this.radiosvg = d3.select("#radio-" + this.uniqueId)
			.append("svg")
			.attr('width', rwidth)
			.attr('height', rheight);

		this.data._meta.timeframes.forEach((t, i) => {

			// radio boxes
			this.radiosvg.append('rect')
				.attr('class', () => {
					if (t == this.timeframe)
						return 'radio-rect selected';
					else
						return 'radio-rect'
				})
				.attr('id', 'radio-rect-' + t)
				.attr('x', rwidth/3 * i)
				.attr('y', 0)
				.attr('width', rwidth/3)
				.attr('height', rheight)
				.on('click', () => this.radioClick(t))

			// radio texts
			this.radiosvg.append('text')
				.attr('class', () => {
					if (t == this.timeframe)
						return 'radio-text selected';
					else
						return 'radio-text'
				})
				.attr('id', 'radio-text-' + t)
				.attr("x", rwidth/3 * i + rwidth/6)
				.attr("y", rheight / 2 + 4)
				.attr('font-size', 12)
				.text(() => {
					if (t == 'allday')
						return 'All day';
					else if (t == '00')
						return "00–08";
					else if (t == '08')
						return "08–16";
					else if (t == '16')
						return "16–00";
					else if (t == 'within')
						return 'Within'
					else if (t == 'between')
						return 'Betw'
                    else
                        return t;
				})
				.on('click', () => this.radioClick(t));
		})
	}

	setDropdown() {
		d3.select('.select-place#select-' + this.uniqueId)
			.append('select')
			.attr('id', 'dropdown-' + this.uniqueId)
			.attr('multiple',"")

        d3.select("#dropdown-" + this.uniqueId)
	        .selectAll("option")
	        .data(this.data._meta.locations).enter()
	        .append("option")
	        .text(d => d != 'all' ? d : 'Whole country')
	        .attr("value", d => d)
	        .attr("selected", d => {
	            if (d==this.level) { return 'selected' };
	        });

        this.colors = [
            '#5897fb', //blue
            '#008000', //green
            '#FFA500', // orange
            '#FF0000', //red
            '#800080', //purple
            '#808000', //olive
            '#00FF00', //lime
            '#800000', //maroon
            '#00FFFF', //aqua
            '#008080', //team
            '#000080', //navy
            '#FF00FF', //fushua
            '#808080'  //gray
        ];

        this.levelColors = {}
        var colorSet = new Set()

        this.levelColors[this.level[0]] = 0
        colorSet.add(0)

        var mySelect = new SlimSelect({
            select: "#dropdown-" + this.uniqueId,
            limit: 10,
            placeholder: 'Select location(s)',
            allowDeselectOption: true,
            closeOnSelect: false,
            showContent: 'up',
            onChange: (info) => {

            	// If a locations was removed update the colorSet and delete that locations from locColors
                if (this.level.length > mySelect.selected().length) {
            	            var diff = this.level.filter(x => !mySelect.selected().includes(x))
            	            colorSet.delete(this.levelColors[diff])
            	            delete this.levelColors[diff]
            	        }

            	if (mySelect.selected().length != 0) {

                    // Update selected levels
				    this.level = mySelect.selected()

				    // Checking of new locations has been added and assigning lowest (id) available color
				    this.level.forEach( (level) => {
				        if (!(level in this.levelColors)) {
				            for (var i = 0; i < this.colors.length; i++) {
				                if (!(colorSet.has(i))){
				                    colorSet.add(i);
				                    this.levelColors[level]=i;
				                    break;
				                }
				            }
				        }
				    })
				    this.clearData();
				    this.redrawData();
				}

				// Coloring the locations
                //var levels = document.querySelector(".ss-values")
                info.forEach((level, i) => {
                    var level_el = document.querySelector('[data-id="'+level.id+'"]')
                    level_el.style["background-color"] = this.colors[this.levelColors[level.value]]
                });

				// this.clearData();
				// this.redrawData();
            }
        })
	}


	// Layout elements
	// ---------------

	drawTitle() {
		this.svg.append("text")
			.attr("x", this.width/2)
			.attr("y", -15)
			.style("text-anchor", "middle")
			.style("font-weight", 700)
			.text(this.data._meta.variables.title);
	}


	drawShades() {
		// WEEKEND SHADES
		let idxwknd = d3.range(4, this.time_shown.length, 7);  // 4 because the first day is a friday
		let dx = this.x(this.time[2]) - this.x(this.time[0]);
		let dy = this.y(this.yrange[0]) - this.y(this.yrange[1]);

		this.svg.selectAll('shade')
			.data(idxwknd).enter().append("rect")
			.attr("class", "shade")
			.attr("x", d => {
				return d == 0 ? this.x(this.time_shown[d]) : this.x(this.time_shown[d]) - dx/4
			})
			.attr("y", d => this.y(this.yrange[1]))
			.attr("width", d => {
				if (d == 0 | d == this.time_shown.length - 2) {
					return dx * 3/4;
				} else if (d == this.time_shown.length - 1) {
					return dx * 1/4;
				} else {
					return dx;
				}
			})
			.attr("height", dy)
			.style('fill', '#ecf0f1')
			.style('fill-opacity', 1)

		// NO DATA SHADE
		this.svg.append('rect')
			.attr('x', this.x(this.time_shown[0]))
			.attr('y', this.y(this.yrange[1]))
			.attr('width', this.x(this.time[0]) - this.x(this.time_shown[0]))
			.attr('height', dy)
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

	drawXAxis() {
		this.svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + this.height + ")")
			.call(this.xAxis);
	}

	drawEventLines() {
		for (let d of eventDates[this.data._meta.variables.country_name]) {
			this.svg.append('line')
				.attr('class', 'histEvent')
				.attr('id', d[2] + this.uniqueId)
				.attr('x1', this.x(this.parseDate(d[0])))
				.attr('x2', this.x(this.parseDate(d[0])))
				.attr('y1', this.height)
				.attr('y2', this.height)
			this.svg.append('circle')
				.attr('class', 'histEventDot')
				.attr('cx', this.x(this.parseDate(d[0])))
				.attr('cy', this.height+3.5)
				.attr('r', 3)
				.on('mouseover', () => this.mouseover())
				.on('mousemove', () => {
					this.mousemoveHistEvent(d);
					d3.select("#" + d[2] + this.uniqueId)
						.transition().duration(50)
						.attr('y2', 0);
				})
				.on('mouseout', () => {
					this.mouseout();
					d3.select("#" + d[2] + this.uniqueId)
						.transition().duration(50)
						.attr('y2', this.height);
				})
		}
	}


	// Plot data
	// ----------

	drawHorizontalLineAt(value) {
		let datum = zip([this.parseDate(this.data._meta.variables.startDate), ...this.time], d3.range(this.time.length+1).map(() => value))
		this.svg.append("path")
			.datum(datum)
			.attr('class', 'line-baseline')
			.attr("id", "data" + this.uniqueId)
			.attr('d', this.valueline)
	}

	addTooltip() {
		// Draw a line that gets moved around with tooltip
		this.svg.append('line')
			.attr('class', 'line-tooltip')
			.style('stroke', 'black')
			.style('stroke-width', 1)
			.attr('stroke-opacity', 0)
		
		this.svg.append('rect')
			.attr('class', 'rect-tooltip')
			.attr('x', this.x(this.time[0]))
			.attr('y', 0)
			.attr('width', this.x(this.time[this.time.length-1]) - this.x(this.time[0]))
			.attr('height', this.height)
			.on('mouseover', () => this.mouseover())
			.on('mousemove', () => {
				let mouseXY = d3.mouse(this.svg.node());
				this.mousemoveTooltip(mouseXY[0], mouseXY[1]);
			})
			.on('mouseout', () => {
				this.mouseout();
				this.svg.select('.line-tooltip')
					.transition().duration(100)  // hack. transition necessary otherwise tooltip line doesn't always go away, i think due to JS async event handling!
					.attr('stroke-opacity', 0);
			});
	}


	// Event handling
	// --------------

	mouseover() {
		this.tooltip.style("display", "inline");
	}

	mouseout() {
		this.tooltip.style("display", "none");
	}

	mousemoveHistEvent(d) {
		this.tooltip
			.html("<b>" + this.formatDate(this.parseDate(d[0])) + "</b><br><br>" +
				d[1] + "</b>")
			.style("left", (d3.event.pageX + 10) + "px")
			.style("top", (d3.event.pageY - 35) + "px");
	}

	radioClick(t) {
		if (t != this.timeframe) {
			this.radiosvg.select('#radio-rect-' + this.timeframe)
				.attr('class', 'radio-rect');
			this.radiosvg.select('#radio-rect-' + t)
				.attr('class', 'radio-rect selected');
			this.timeframe = t;
			this.clearData();
			this.redrawData();
		}
	}

	// utils
	// --------------
	checkUndefined(d) {
         if (d == 'undefined' || d === undefined || isNaN(d)){
            return 0
         } else {
            return d
         }
    }
}


class SingleLinePlot extends TimeSeriesFigure {
	
	// ----------------- //
	// Top level methods //
	// ----------------- //

	setup() {
		this.setXDomain();
		this.setYDomain();
		if (typeof this.timeframe != 'undefined')
			this.setRadio();
		if (this.data._meta.locations.length > 1)
			this.setDropdown();
	}

	drawLayout() {
		this.drawTitle();
		this.drawShades();
		this.drawXAxis();
		this.drawYAxis();       // Removed by `clearData()`
		this.drawYLabel();      // Removed by `clearData()`
		this.drawLegend();
		this.drawEventLines();
		this.addTooltip();
	}

	drawData() {
		this.drawValue();           // Removed by `clearData()`
		this.drawValueTrendline();  // Removed by `clearData()`
		d3.select('.rect-tooltip').raise();  // Put invisible tooltip rect on top
	}

	redrawData() {
		this.setYDomain();
		this.drawYAxis();
		this.drawYLabel();
		this.drawData();
		d3.select('.rect-tooltip').raise();  // Put invisible tooltip rect on top
	}


	// -------------------- //
	// Bottom level methods //
	// -------------------- //

	// Setup
	// -----

	setYDomain() {
		// Infer meaningful y-range
		let allYVals = [];
		this.data._meta.timeframes.forEach(timeframe => {
			Object.keys(this.data[timeframe]).forEach(level => {
				allYVals.push(...this.data[timeframe][level])
			})
		})

		// Set
		this.yrange = [0, d3.max(allYVals) * 1.2];
		this.y.domain(this.yrange);
	}


	// Layout elements
	// ---------------

	drawYLabel() {
		// Removed by `clearData()`
		this.svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", -40)
			.attr("x", -this.height / 2)
			.attr("id", "data" + this.uniqueId)
			.style("text-anchor", "middle")
			.style("font-weight", 500)
			.text(this.data._meta.variables.y_label);
	}

	drawYAxis() {
		// Infer meaningful y-ticks. DEBUG: bad heuristics. If used for other than
		// percentage, this should be revised.
		let yExtent = this.yrange[1] - this.yrange[0];
		if (yExtent <= 1.5)
			this.yAxis = d3.axisLeft(this.y).ticks(6, ".0%")
		else if (yExtent < 1000)
			this.yAxis = d3.axisLeft(this.y).tickFormat(v => v);
		else
			this.yAxis = d3.axisLeft(this.y).tickFormat(v => v/1e3 + "k");
		// Removed by `clearData()`
		this.svg.append("g")
			.attr("class", "y axis")
			.attr("id", "data" + this.uniqueId)
			.call(this.yAxis);
	}

	drawLegend() {
		let showDaily = true;
		let show7DAvg = true;

		// daily
		this.svg.append('line')
			.attr('class', 'line-crisis')
			.attr('x1', this.width+10)
			.attr('x2', this.width+30)
			.attr('y1', 10)
			.attr('y2', 10)
		this.svg.append('circle')
			.attr('class', 'dot')
			.attr('cx', this.width+20)
			.attr('cy', 10)
			.attr('r', 2.5)
		this.svg.append('text')
			.attr('class', 'right-legend')
			.attr('x', this.width+35)
			.attr('y', 10+4)
			.text('daily')
		let dailyrect = this.svg.append('rect')
			.attr('x', this.width+10)
			.attr('y', 0)
			.attr('width', 55)
			.attr('height', 20)
			.style('fill', 'white')
			.style('opacity', 0)
			.style('cursor', 'pointer')
			.on('click', () => {
				showDaily = !showDaily;
				if (showDaily) {
					this.svg.selectAll('.dot')
						.style('opacity', null)
					this.svg.selectAll('.line-crisis')
						.style('stroke-opacity', null)
				} else {
					this.svg.selectAll('.dot')
						.style('opacity', 0)
					this.svg.selectAll('.line-crisis')
						.style('stroke-opacity', 0)
				}
			})

		dailyrect
			.on('mouseover', () => dailyrect.style('opacity', 0.5))
			.on('mouseout', () => dailyrect.style('opacity', 0))

		// 7 day avg
		this.svg.append('line')
			.attr('class', 'trendline')
			.attr('x1', this.width+10)
			.attr('x2', this.width+30)
			.attr('y1', 30)
			.attr('y2', 30)
		this.svg.append('text')
			.attr('class', 'right-legend')
			.attr('x', this.width+35)
			.attr('y', 30+4)
			.text('7 day avg')
		let weeklyrect = this.svg.append('rect')
			.attr('x', this.width+10)
			.attr('y', 20)
			.attr('width', 80)
			.attr('height', 20)
			.style('fill', 'white')
			.style('opacity', 0)
			.style('cursor', 'pointer')
			.on('click', () => {
				show7DAvg = !show7DAvg;
				if (show7DAvg) {
					this.svg.selectAll('.trendline')
						.style('stroke-opacity', null)
				} else {
					this.svg.selectAll('.trendline')
						.style('stroke-opacity', 0)
				}
			})

		weeklyrect
			.on('mouseover', () => weeklyrect.style('opacity', 0.5))
			.on('mouseout', () => weeklyrect.style('opacity', 0))
	}


	// Plot data
	// ----------

	drawValueTrendline() {
		let datum = zip(this.time, weekavg(this.data[this.timeframe][this.level])).slice(3,-3)
		this.svg.append("path")
			.datum(datum)
			.attr('class', 'trendline')
			.attr("id", "data" + this.uniqueId)
			.attr('d', this.valueline)
	}

	drawValue() {
		let datum = zip(this.time, this.data[this.timeframe][this.level])
		this.svg.append("path")
			.datum(datum)
			.attr('class', 'line-crisis')
			.attr("id", "data" + this.uniqueId)
			.attr('d', this.valueline)
		this.svg.selectAll("dot")
			.data(datum)
			.enter().append("circle")
			.attr("class", "dot")
			.attr("id", "data" + this.uniqueId)
			.attr("cx", d => this.x(d[0]))
			.attr("cy", d => this.y(d[1]))
			.attr("r", 2.5)
	}


	// Event handling
	// --------------

	mousemoveTooltip(mouseX, mouseY) {
		// Find nearest datapoint
		let diffs = this.time.map(t => Math.abs(this.x(t)-mouseX));
		let minIdx = diffs.indexOf(Math.min(...diffs));

		// Load its values into variables for easy reuse
		let date = this.time[minIdx];
		let yval = this.data[this.timeframe][this.level][minIdx];

		// Move the tooltip line
		this.svg.select('.line-tooltip')
			.transition().duration(30)
			.attr('stroke-opacity', 1)
			.attr('x1', this.x(date))
			.attr('x2', this.x(date))
			.attr('y1', mouseY)
			.attr('y2', this.y(yval))

		// Display the tooltip
		this.tooltip
			.html("<b>" + this.formatDate(date) + "</b><br><br>" +
				  "Value: <b>" + round(yval * 100, 1e1) + "%</b><br>")
			.style("left", (d3.event.pageX + 10) + "px")
			.style("top", (d3.event.pageY - 35) + "px");
	}	
}


class DeviationPlot extends TimeSeriesFigure {

	// ----------------- //
	// Top level methods //
	// ----------------- //

	setup() {
		this.setXDomain();
		this.setYDomain();
		if (this.data._meta.timeframes.length > 1)
			this.setRadio();
		if (this.data._meta.locations.length > 1)
			this.setDropdown();
	}

	drawLayout() {
		this.drawTitle();
		this.drawRelAbs();
		this.drawShades();
		this.drawXAxis();
		this.drawYAxis();       // Removed by `clearData()`
		this.drawYLabel();      // Removed by `clearData()`
		this.drawLegend();
		this.drawEventLines();
		this.addTooltip();
	}

	drawData() {
		if (this.mode == 'count') {
			this.drawBaseline();                // Removed by `clearData()`
			this.drawCrisis();                  // Removed by `clearData()`
			this.drawCrisisTrendline();         // Removed by `clearData()`
		} else
		if (this.mode == 'relative') {
			this.drawHorizontalLineAt(0);       // Removed by `clearData()`
			this.drawPercentChange();           // Removed by `clearData()`
			this.drawPercentChangeTrendline();  // Removed by `clearData()`
		}
		d3.select('.rect-tooltip').raise();     // Put invisible tooltip rect on top
	}

	redrawData() {
		this.setYDomain();
		this.drawYAxis();
		this.drawYLabel();
		this.drawData();
		d3.select('.rect-tooltip').raise();     // Put invisible tooltip rect on top
	}


	// -------------------- //
	// Bottom level methods //
	// -------------------- //

	// Setup
	// -----

	setYDomain() {
		let allYVals = [];
		if (this.mode == 'relative') {
			this.data._meta.timeframes.forEach(timeframe => {
				(this.level).forEach(level => {
                    if (level in this.data[timeframe]) {
					    allYVals.push(...this.data[timeframe][level]['percent_change'])
                    }
				})
			})

			let yMin = d3.min(allYVals,Number);
		    let yMax = d3.max(allYVals,Number);

		    if (yMax < 0) yMax = 0;
			if (yMin > 0) yMin = 0;

			this.yrange = [
				yMin - (yMax - yMin) * .1,
				yMax + (yMax - yMin) * .1
			]

		} else if (this.mode == 'count') {
			this.data._meta.timeframes.forEach(timeframe => {
				(this.level).forEach(level => {
                    if (level in this.data[timeframe]){
					    allYVals.push(...this.data[timeframe][level]['crisis'])
					    allYVals.push(...this.data[timeframe][level]['baseline'])
                    }
				})
			})
			let yMin = 0
		    let yMax = d3.max(allYVals,Number);

		    this.yrange = [
				yMin,
				yMax + (yMax - yMin) * .1
			]
		}

		this.y.domain(this.yrange);
	}

	// Layout elements
	// ---------------

	drawRelAbs() {
		if (typeof this.mode != "undefined") {
			// rel
			this.svg.append("text")
				.attr("x", -60)
				.attr("y", -15)
				.attr('class', 'toggle')
				.attr("id", 'toggleRelative' + this.uniqueId)
				.style("text-anchor", "left")
				.style("font-weight", this.mode == 'relative' ? 700 : 300)
				.style('cursor', 'pointer')
				.text("rel")
				.on('click', () => this.relAbsLabelClick('relative'));

			// abs
			this.svg.append("text")
				.attr("x", -37)
				.attr("y", -15)
				.attr('class', 'toggle')
				.attr("id", "toggleAbs" + this.uniqueId)
				.style("text-anchor", "left")
				.style("font-weight", this.mode == 'count' ? 700 : 300)
				.style('cursor', 'pointer')
				.text("abs")
				.on('click', () => this.relAbsLabelClick('count'));
		}
	}

	drawYLabel() {
		// Removed by `clearData()`
		this.svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", -40)
			.attr("x", -this.height / 2)
			.attr("id", "data" + this.uniqueId)
			.style("text-anchor", "middle")
			.style("font-weight", 500)
			.text(() => {
				if (this.mode == 'count') {
					return this.data._meta.variables.y_label_count;
				} else
				if (this.mode == 'relative') {
					return this.data._meta.variables.y_label_relative;
				}
			});
	}

	drawYAxis() {
		if (this.mode == 'count') {
			let yExtent = this.yrange[1] - this.yrange[0];
			if (yExtent < 1000)
				this.yAxis = d3.axisLeft(this.y).tickFormat(v => v);
			else
				this.yAxis = d3.axisLeft(this.y).tickFormat(v => v/1e3 + "k");
		}
		else if (this.mode == 'relative') {
			this.yAxis = d3.axisLeft(this.y).ticks(6, ".0%")
		}

		// Removed by `clearData()`
		this.svg.append("g")
			.attr("class", "y axis")
			.attr("id", "data" + this.uniqueId)
			.call(this.yAxis);
	}

	drawLegend() {
		this.showDaily = true;
		this.showBaseline = true;
		this.show7DAvg = true;

		// daily
		this.svg.append('line')
			.attr('class', 'line-crisis')
			.attr('x1', this.width+10)
			.attr('x2', this.width+30)
			.attr('y1', 10)
			.attr('y2', 10)
		this.svg.append('circle')
			.attr('class', 'dot')
			.attr('cx', this.width+20)
			.attr('cy', 10)
			.attr('r', 2.5)
		this.svg.append('text')
			.attr('class', 'right-legend')
			.attr('x', this.width+35)
			.attr('y', 10+4)
			.text('daily')
		let dailyrect = this.svg.append('rect')
			.attr('x', this.width+10)
			.attr('y', 0)
			.attr('width', 55)
			.attr('height', 20)
			.style('fill', 'white')
			.style('opacity', 0)
			.style('cursor', 'pointer')
			.on('click', () => {
				this.showDaily = !this.showDaily;
				if (this.showDaily) {
					this.svg.selectAll('.dot')
						.style('opacity', null)
					this.svg.selectAll('.line-crisis')
						.style('stroke-opacity', null)
				} else {
					this.svg.selectAll('.dot')
						.style('opacity', 0)
					this.svg.selectAll('.line-crisis')
						.style('stroke-opacity', 0)
				}
			})

		dailyrect
			.on('mouseover', () => dailyrect.style('opacity', 0.5))
			.on('mouseout', () => dailyrect.style('opacity', 0))

		// baseline
		this.svg.append('line')
			.attr('class', 'line-baseline')
			.attr('x1', this.width+10)
			.attr('x2', this.width+30)
			.attr('y1', 30)
			.attr('y2', 30)
		this.svg.append('text')
			.attr('class', 'right-legend')
			.attr('x', this.width+35)
			.attr('y', 30+4)
			.text('baseline')
		let baselinerect = this.svg.append('rect')
			.attr('x', this.width+10)
			.attr('y', 20)
			.attr('width', 75)
			.attr('height', 20)
			.style('fill', 'white')
			.style('opacity', 0)
			.style('cursor', 'pointer')
			.on('click', () => {
				this.showBaseline = !this.showBaseline;
				if (this.showBaseline) {
					this.svg.selectAll('.line-baseline')
						.style('stroke-opacity', null)
				} else {
					this.svg.selectAll('.line-baseline')
						.style('stroke-opacity', 0)
				}
			})

		baselinerect
			.on('mouseover', () => baselinerect.style('opacity', 0.5))
			.on('mouseout', () => baselinerect.style('opacity', 0))

		// 7 day avg
		this.svg.append('line')
			.attr('class', 'trendline')
			.attr('x1', this.width+10)
			.attr('x2', this.width+30)
			.attr('y1', 50)
			.attr('y2', 50)
		this.svg.append('text')
			.attr('class', 'right-legend')
			.attr('x', this.width+35)
			.attr('y', 50+4)
			.text('7 day avg')
		let weeklyrect = this.svg.append('rect')
			.attr('x', this.width+10)
			.attr('y', 40)
			.attr('width', 80)
			.attr('height', 20)
			.style('fill', 'white')
			.style('opacity', 0)
			.style('cursor', 'pointer')
			.on('click', () => {
				this.show7DAvg = !this.show7DAvg;
				if (this.show7DAvg) {
					this.svg.selectAll('.trendline')
						.style('stroke-opacity', null)
				} else {
					this.svg.selectAll('.trendline')
						.style('stroke-opacity', 0)
				}
			})

		weeklyrect
			.on('mouseover', () => weeklyrect.style('opacity', 0.5))
			.on('mouseout', () => weeklyrect.style('opacity', 0))
	}


	// Plot data
	// ----------

	drawBaseline() {
	    this.level.forEach(level => {
            let datum = zip(this.time, this.data[this.timeframe][level]['baseline']);
            this.svg.append("path")
                .datum(adjustBaseline(datum))
                .attr('class', 'line-baseline')
                .attr("id", "data" + this.uniqueId)
                .attr('d', this.valueline)
			    .style('stroke-opacity', this.showBaseline ? null : 0)
        })
	}

	drawCrisisTrendline() {
	    this.level.forEach((level, i) => {
            let datum = zip(this.time, weekavg(this.data[this.timeframe][level]['crisis'])).slice(3,-3)
            this.svg.append("path")
                .datum(datum)
                .attr('class', 'trendline')
                .attr("id", "data" + this.uniqueId)
                .attr('d', this.valueline)
			    .style('stroke-opacity', this.show7DAvg ? null : 0)
			    .style('stroke',() => {if ( this.levelColors !== undefined) {return this.colors[this.levelColors[level]]}})
         })
	}

	drawCrisis() {
	    this.level.forEach(level => {
            let datum = zip(this.time, this.data[this.timeframe][level]['crisis'])
            this.svg.append("path")
                .datum(datum)
                .attr('class', 'line-crisis')
                .attr("id", "data" + this.uniqueId)
                .attr('d', this.valueline)
			    .style('stroke-opacity', this.showDaily ? null : 0)
            this.svg.selectAll("dot")
                .data(datum)
                .enter().append("circle")
                .attr("class", "dot")
                .attr("id", "data" + this.uniqueId)
                .attr("cx", d => this.x(d[0]))
                .attr("cy", d => this.y(this.checkUndefined(d[1])))
                .attr("r", 2.5)
                .style("fill",function(d) {if (d[1]=='undefined'){ return 'red'}})
                .style('opacity', this.showDaily ? null : 0);
        })
	}

	drawPercentChangeTrendline() {
	    this.level.forEach((level, i) => {
            let datum = zip(this.time, weekavg(this.data[this.timeframe][level]['percent_change'])).slice(3,-3)
            this.svg.append("path")
                .datum(datum)
                .attr('class', 'trendline')
                .attr("id", "data" + this.uniqueId)
                .attr('d', this.valueline)
			    .style('stroke-opacity', this.show7DAvg ? null : 0)
			    .style('stroke',() => {if (this.levelColors !== undefined) { return this.colors[this.levelColors[level]]}})
        })
	}

	drawPercentChange() {
	    this.level.forEach(level => {
            let datum = zip(this.time, this.data[this.timeframe][level]['percent_change'])
            this.svg.append("path")
                .datum(datum)
                .attr('class', 'line-crisis')
                .attr("id", "data" + this.uniqueId)
                .attr('d', this.valueline)
			    .style('stroke-opacity', this.showDaily ? null : 0);
            this.svg.selectAll("dot")
                .data(datum)
                .enter().append("circle")
                .attr("class", "dot")
                .attr("id", "data" + this.uniqueId)
                .attr("cx", d => this.x(d[0]))
                .attr("cy", d => this.y(this.checkUndefined(d[1])))
                .attr("r", 2.5)
                .style("fill",function(d) {if (d[1]=='undefined'){ return 'red'}})
                .style('opacity', this.showDaily ? null : 0);
        })
	}


	// Event handling
	// --------------

	mousemoveTooltip(mouseX, mouseY) {
		// Find nearest X-point
		let diffsX = this.time.map(t => Math.abs(this.x(t)-mouseX));
		let minIdxX = diffsX.indexOf(Math.min(...diffsX));

		// Find nearest Y-point
		// let locations = this.data._meta.locations;
		let locations = this.level
		let diffsY;
		if (this.mode == 'relative') {
			diffsY = locations.map(level => {
				let curveY = this.y(
					this.data[this.timeframe][level]['percent_change'][minIdxX]
				);
				return Math.abs(curveY - mouseY);
			})
		} else
		if (this.mode == 'count') {
			diffsY = locations.map(level => {
				let curveY = this.y(
					this.data[this.timeframe][level]['crisis'][minIdxX]
				);
				return Math.abs(curveY - mouseY);
			})
		}
		// let minLevelIdx = diffsY.indexOf(Math.min(...diffsY));
        let minLevelIdx = diffsY.indexOf(d3.min(diffsY),Number);
		let minLevel = locations[minLevelIdx];

		// Load its values into variables for easy reuse
		let date = this.time[minIdxX];

		let yvals = [
			this.data[this.timeframe][minLevel]['crisis'][minIdxX],
			this.data[this.timeframe][minLevel]['baseline'][minIdxX],
			this.data[this.timeframe][minLevel]['percent_change'][minIdxX]
		];

		// Move the tooltip line
		this.svg.select('.line-tooltip')
			.transition().duration(30)
			.attr('stroke-opacity', 1)
			.attr('x1', this.x(date))
			.attr('x2', this.x(date))
			.attr('y1', mouseY)
			.attr('y2', () => {
				if (this.mode == 'relative')
					return this.y(this.checkUndefined(yvals[2]))
				else if (this.mode == 'count')
					return this.y(this.checkUndefined(yvals[0]))
			})

		// Display the tooltip
		let correctName = d => d != 'all' ? d : 'Whole country';
		this.tooltip
			.html(() => {
				let crisisVal, baselineVal;
				if (yvals[0] < 1) {
					crisisVal = round(yvals[0], 1e2);
					baselineVal = round(yvals[1], 1e2);
				} else
				if (yvals[0] < 1000) {
					crisisVal = round(yvals[0], 1e0);
					baselineVal = round(yvals[1], 1e0);
				} else {
					crisisVal = insertKSeperators(round(yvals[0], 1e0));
					baselineVal = insertKSeperators(round(yvals[1], 1e0));
				}
				return "<b>" + correctName(minLevel) + "</b>, " + this.formatDate(date) + "<br><br>" +
				"On date: <b>" + crisisVal + "</b><br>" +
				"Baseline: <b>" + baselineVal + "</b><br>" +
				"Deviation: <b>" + Math.round(yvals[2]*100*1e1)/1e1 + "%</b>"
				})
			.style("left", (d3.event.pageX + 10) + "px")
			.style("top", (d3.event.pageY - 15) + "px");

		// Recolor the lines
		this.svg.selectAll('.line-changeall')
			.style('opacity', 0.05);
		this.svg.select('.line-changeall.' + minLevel)
			.style('opacity', 1)
	}

	relAbsLabelClick(mode) {
		if (mode != this.mode) {
			if (mode == 'relative') {
				this.svg.select('#toggleRelative' + this.uniqueId)
					.style('font-weight', 700);
				this.svg.select('#toggleAbs' + this.uniqueId)
					.style('font-weight', 300);
				this.mode = 'relative';
			} else
			if (mode == 'count') {
				this.svg.select('#toggleRelative' + this.uniqueId)
					.style('font-weight', 300);
				this.svg.select('#toggleAbs' + this.uniqueId)
					.style('font-weight', 700);
				this.mode = 'count';
			}
		}
		this.clearData();
		this.redrawData();
	}
}


class MultiLinePlot extends DeviationPlot {

	// ----------------- //
	// Top level methods //
	// ----------------- //

	setup() {
		this.setXDomain();
		this.setYDomain();                                // Overwritten
		if (typeof this.timeframe != 'undefined')
			this.setRadio();
	}

	drawData() {
		if (this.mode == 'count') {
			this.drawHorizontalLineAt(0);    		  // Removed by `clearData()`
			this.data._meta.locations.forEach(level => {
			if (level != 'all')
			    this.drawCrisisCount(level);              // Removed by `clearData()`
			});  
		} else
		if (this.mode == 'relative') {
			this.drawHorizontalLineAt(0);			  // Removed by `clearData()`
			this.data._meta.locations.forEach(level => {
		    if (level != 'all')
			    this.drawCrisisRelative(level);			  // Removed by `clearData()`
			});
		}
		d3.select('.rect-tooltip').raise();
	}


	// -------------------- //
	// Bottom level methods //
	// -------------------- //

	// Setup
	// -----

	setYDomain() {
		let allYVals = [];
		if (this.mode == 'relative') {
			this.data._meta.timeframes.forEach(timeframe => {
				Object.keys(this.data[timeframe]).forEach(level => {
					allYVals.push(...this.data[timeframe][level]['percent_change'])
				})
			})
		} else if (this.mode == 'count') {
			this.data._meta.timeframes.forEach(timeframe => {
				Object.keys(this.data[timeframe]).forEach(level => {
					allYVals.push(...this.data[timeframe][level]['crisis'].map((cv, i) => {
						return cv - this.data[timeframe][level]['baseline'][i];
					}))
				})
			})
		} 

		let yMin = d3.min(allYVals);
		let yMax = d3.max(allYVals);

		this.yrange = [
			yMin - (yMax - yMin) * .1,
			yMax + (yMax - yMin) * .1
		]

		this.y.domain(this.yrange);
	}


	// Layout elements
	// ---------------

	drawLegend() {
		this.svg.append('line')
			.attr('class', 'line')
			.attr('x1', this.width+10)
			.attr('x2', this.width+30)
			.attr('y1', 10)
			.attr('y2', 10)
		this.svg.append('text')
			.attr('class', 'right-legend')
			.attr('x', this.width+35)
			.attr('y', 10+4)
			.text('daily')
	}


	// Plot data
	// ---------

	drawCrisisRelative(level) {
		let datum = zip(this.time, this.data[this.timeframe][level]['percent_change'])
		this.svg.append("path")
			.datum(datum)
			.attr('class', 'line-changeall ' + level.replace(" ", "-"))
			.attr("id", 'data' + this.uniqueId)
			.attr('d', this.valueline)
	}

	drawCrisisCount(level) {
		let datum = zip(
			this.time,
			d3.range(this.time.length).map(i => {
				return this.data[this.timeframe][level]['crisis'][i] -
					   this.data[this.timeframe][level]['baseline'][i]
			})
		)
		this.svg.append("path")
			.datum(datum)
			.attr('class', 'line-changeall ' + level.replace(" ", "-"))
			.attr("id", 'data' + this.uniqueId)
			.attr('d', this.valueline)
	}


	// Event handling
	// --------------

	mousemoveTooltip(mouseX, mouseY) {
		// Find nearest X-point
		let diffsX = this.time.map(t => Math.abs(this.x(t)-mouseX));
		let minIdxX = diffsX.indexOf(Math.min(...diffsX));

		// Find nearest Y-point
		// let locations = this.data._meta.locations;
		let locations = Object.keys(this.data[this.timeframe])
		let diffsY;
		if (this.mode == 'relative') {
			diffsY = locations.map(level => {
				let curveY = this.y(
					this.data[this.timeframe][level]['percent_change'][minIdxX]
				);
				return Math.abs(curveY - mouseY);
			})
		} else
		if (this.mode == 'count') {
			diffsY = locations.map(level => {
				let curveY = this.y(
					this.data[this.timeframe][level]['crisis'][minIdxX] -
					this.data[this.timeframe][level]['baseline'][minIdxX]
				);
				return Math.abs(curveY - mouseY);
			})
		}
		// let minLevelIdx = diffsY.indexOf(Math.min(...diffsY));
        let minLevelIdx = diffsY.indexOf(d3.min(diffsY));
		let minLevel = locations[minLevelIdx];

		// Load its values into variables for easy reuse
		let date = this.time[minIdxX];
		let yval;
		if (this.mode == 'count')
			yval = this.data[this.timeframe][minLevel]['crisis'][minIdxX] - this.data[this.timeframe][minLevel]['baseline'][minIdxX];
		if (this.mode == 'relative')
			yval = this.data[this.timeframe][minLevel]['percent_change'][minIdxX];

		// Move the tooltip line
		this.svg.select('.line-tooltip')
			.transition().duration(30)
			.attr('stroke-opacity', 1)
			.attr('x1', this.x(date))
			.attr('x2', this.x(date))
			.attr('y1', mouseY)
			.attr('y2', this.y(yval))

		// Display the tooltip
		this.tooltip
			.html(
				"<b>" + minLevel + "</b>, " + this.formatDate(date)
				
			)
			.style("left", (d3.event.pageX + 10) + "px")
			.style("top", (d3.event.pageY - 15) + "px");

		// Recolor the lines
		this.svg.selectAll('.line-changeall')
			.style('opacity', 0.05);
		this.svg.select('.line-changeall.' + minLevel.replace(" ", "-"))
			.style('opacity', 1)
	}

	mouseout() {
		this.tooltip.style("display", "none");
		this.svg.selectAll('.line-changeall')
			.style('opacity', 0.7);
	}
}
