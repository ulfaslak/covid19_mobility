class TimeSliderScatterPlot {

	constructor(data, mainDivId, uniqueId, xlabel, ylabel, rlabel) {
		// Variables
		this.data = data;
		this.mainDivId = mainDivId;
		this.uniqueId = uniqueId;
		this.xlabel = xlabel;
		this.ylabel = ylabel;
		this.rlabel = rlabel;
		this.datetime = data._meta.datetime;
		this.worstMunis = data._meta.worst_munis.slice(0, 5);
		delete data._meta;
		[this.xExtent, this.yExtent] = this.getExtents();
		this.xExtent = [-150, 150]

		// Global variables
		this.t = 9;
		this.focus = false;

	
		// Dimensions and margins
		let divHeight = 500;
		this.margin = {top: 30, right: 48, bottom: 63, left: 60};

		this.maindiv = document.getElementById(this.mainDivId)
		this.width = this.maindiv.offsetWidth - this.margin.left - this.margin.right;
		this.height = divHeight - this.margin.top - this.margin.bottom;

		// Parse the date / time
		this.parseDate = d3.timeParse("%Y-%m-%d");
		this.formatDate = d3.timeFormat("%e %B");

		// Ranges
		this.x = d3.scaleLinear()
			.domain(this.xExtent)
			.range([0, this.width]);
		this.y = d3.scaleLinear()
			.domain(this.yExtent)
			.range([this.height, 0]);

		// Axes
		this.xAxis = d3.axisBottom(this.x);
		this.yAxis = d3.axisLeft(this.y);

		// Line
		this.valueline = d3.line()
			.x(d => this.x(d[0]))
			.y(d => this.y(d[1]));

		// Define tooltip div
		this.tooltip = d3.select("body").append("div")
			.attr("class", "tooltip")
			.style("display", "none");

		// SVG
		this.svg = d3.select("#" + this.mainDivId)
			.append("svg")
				.attr("width", this.width + this.margin.left + this.margin.right)
				.attr("height", this.height + this.margin.top + this.margin.bottom)
			.append("g")
				.attr('transform',
					'translate(' + this.margin.left + "," + this.margin.top + ")")
	}


	// Clear and recreate
	// ------------------

	setup() {
		this.setupEventlisteners();
	}

	drawLayout() {
		this.drawVerticalLineAt(0);
		this.drawTitle();
		// this.drawDateTicker();
		this.drawAxes();
		this.drawAxisLabels();
		this.setSlider();
	}

	drawData() {
		this.plotPoints();
		this.drawDateTicker();
	}


	// Setup
	// -----

	setupEventlisteners() {
		document.addEventListener('mousedown', e => {
			if (this.focus != false && !e.target.id.includes('Point')) {
				this.svg.selectAll('circle')
					.attr('opacity', 1)
				if (!this.worstMunis.includes(this.focus)) {
					this.svg.select('#' + this.focus + "Line")
						.attr('opacity', 0)
				}
				for (let badMuni of this.worstMunis) {
					this.svg.select('#' + badMuni + "Line")
						.attr('opacity', 1)
				}
				this.svg.select('#' + this.focus + "Line")
					.attr('stroke-width', 1)
					.lower();
				this.focus = false;
			}

		});
	}


	// Layout elements
	// ---------------

	drawTitle() {
		this.svg.append("text")
			.attr("x", this.width/2)
			.attr("y", -15)
			.style("text-anchor", "middle")
			.style("font-weight", 700)
			.style("font-size", 20)
			.text("New cases since July 28 vs. going out during the day");
	}

	drawAxes() {
		this.svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + this.height + ")")
			.call(this.xAxis);
		this.svg.append("g")
			.attr("class", "y axis")
			.call(this.yAxis);
	}

	drawAxisLabels() {
		// x-label
		this.svg.append("text")
			.attr("x", this.width / 2)
			.attr("y", this.height + 40)
			.style("text-anchor", "middle")
			.style("font-weight", 250)
			.text(this.xlabel)

		// y-label
		this.svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", -40)
			.attr("x", -this.height / 2)
			.style("text-anchor", "middle")
			.style("font-weight", 250)
			.text(this.ylabel)
	}

	drawVerticalLineAt(x) {
		let datum = zip(
			[x, x],
			[this.yExtent[0], this.yExtent[1]]
		)
		this.svg.append("path")
			.datum(datum)
			.attr("fill", "none")
			.attr("stroke", "grey")
			.attr("stroke-width", 1.5)
			.attr("stroke-dasharray", 5)
			.attr("d", d3.line()
				.x(d => this.x(d[0]))
				.y(d => this.y(d[1]))
			)
	}

	drawDateTicker() {
		let dtobj = this.parseDate(this.datetime[this.t])
		let weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
		let weekdayStr = weekdays[dtobj.getDay()] + ", "
		let dateStr = this.formatDate(dtobj)
		this.dateTicker = this.svg.append("text")
			.attr("x", this.margin.left - 30)
			.attr("y", this.margin.top)
			.style("text-anchor", "left")
			.style("font-weight", 250)
			.text(
				weekdayStr + dateStr
			)
	}

	updateDateTicker() {
		let dtobj = this.parseDate(this.datetime[this.t])
		let weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
		let weekdayStr = weekdays[dtobj.getDay()] + ", "
		let dateStr = this.formatDate(dtobj)
		this.dateTicker.text(
			weekdayStr + dateStr
		)
	}

	setSlider() {
		window.tickValues = this.datetime.map((d, i) => {
			return (this.parseDate(d) - this.parseDate(this.datetime[0])) / 86400e3;
		})

		// Define 
		let sliderStep = d3.sliderBottom()
			.min(0)
			.max(Math.max(...tickValues))
			.width(this.width)
			.tickValues(tickValues)
			.tickFormat(t => this.idxToDate(t))
			.step(1)
			.default(tickValues[this.t])
			.on('onchange', t => {
				this.t = tickValues.indexOf(t);
				if (tickValues.includes(t)) {
					this.movePoints();
					this.updateDateTicker()
				}
			});

		// Append to div
		let gStep = d3.select('#slider-' + this.uniqueId)
			.append('svg')
			.attr('width', this.width + this.margin.left + 20)
			.attr('height', 60)
			.append('g')
			.attr('transform', 'translate(' + this.margin.left + ',15)');

		gStep.call(sliderStep);
	}



	// Plot data
	// ----------

	plotPoints() {
		let munis = Object.keys(this.data);
		for (let muni of munis) {
			// get muni color
			let colorMuni = 'black'
			if (this.worstMunis.includes(muni)) {
				let iMuni = this.worstMunis.indexOf(muni);
				colorMuni = d3.schemeCategory10[iMuni];
			}

			// draw muni line
			let datum = zip(
				this.data[muni][this.xlabel].slice(0, this.t+1),
				this.data[muni][this.ylabel].slice(0, this.t+1)
			)
			this.svg.append("path")
				.datum(datum)
				.attr('id', muni + 'Line')
				.attr("fill", "none")
				.attr("stroke", colorMuni)
				.attr("stroke-width", 1)
				.attr("opacity", this.worstMunis.includes(muni) ? 1 : 0)
				.attr("d", d3.line()
					.x(d => this.x(d[0]))
					.y(d => this.y(d[1]))
				)

			// draw muni point
			let xMuni_t = this.clip(this.data[muni][this.xlabel][this.t], -2, 2),
				yMuni_t = this.clip(this.data[muni][this.ylabel][this.t], 0, Infinity);

			this.svg.append('circle')
				.attr('id', muni + 'Point')
				.attr('cx', this.x(xMuni_t))
				.attr('cy', this.y(yMuni_t))
				.attr('r', this.data[muni][this.rlabel][this.t]**(1/2) / 2)
				.style('fill', colorMuni)
				.style('stroke', 'white')
				.style('stroke-width', 0.5)
				.on('mousemove', () => {
					// tooltip
					this.mouseover();
					this.tooltipDefault(muni);

					// highlight
					if (this.focus == false) {
						this.svg.selectAll('circle')
							.attr('opacity', 0.2)
						for (let badMuni of this.worstMunis) {
							this.svg.select('#' + badMuni + "Line")
								.attr('opacity', 0.2)
						}

						this.svg.select('#' + muni + "Line")
							.attr('opacity', 1)
							.attr('stroke-width', 3)
							.raise();
						this.svg.select('#' + muni + "Point")
							.attr('opacity', 1)
							.raise();
					}
				})
				.on('mouseout', () => {
					// tooltip
					this.mouseout();

					// unhighlight
					if (this.focus == false) {
						this.svg.selectAll('circle')
							.attr('opacity', 1)
						if (!this.worstMunis.includes(muni)) {
							this.svg.select('#' + muni + "Line")
								.attr('opacity', 0)
						}
						for (let badMuni of this.worstMunis) {
							this.svg.select('#' + badMuni + "Line")
								.attr('opacity', 1)
						}
						this.svg.select('#' + muni + "Line")
							.attr('stroke-width', 1)
							.lower();
					}
				})
				.on('mousedown', () => {
					if (this.focus == muni) {
						// setting this.focus to false is enough, since the
						// 'mouseout' code above will run and do the rest
						this.focus = false;
					} else {
						this.svg.select('#' + this.focus + "Point")
							.attr('opacity', 0.2)
						this.svg.select('#' + this.focus + "Line")
							.attr('stroke-width', 1)
							.attr('opacity', this.worstMunis.includes(this.focus) ? 0.2 : 0)
							.lower();

						this.focus = muni;
						this.svg.select('#' + muni + "Line")
							.attr('opacity', 1)
							.attr('stroke-width', 3)
							.raise();
						this.svg.select('#' + muni + "Point")
							.attr('opacity', 1)
							.raise();
					}
				})
		}
		this.svg.selectAll('circle').raise();
	}

	movePoints() {
		let munis = Object.keys(this.data);
		for (let muni of munis) {
			let datum = zip(
				this.data[muni][this.xlabel].slice(0, this.t+1),
				this.data[muni][this.ylabel].slice(0, this.t+1)
			)
			
			let lineMuni = this.svg.select('#' + muni + 'Line')
				.datum(datum);

			lineMuni
				.enter()
				.append("path")
				.merge(lineMuni)
				.attr("d", d3.line()
					.x( d => this.x(d[0]))
					.y( d => this.y(d[1]))
				)
		}

		for (let muni of munis) {
			let xMuni_t = this.data[muni][this.xlabel][this.t],
				yMuni_t = this.data[muni][this.ylabel][this.t];
			this.svg.select('#' + muni + 'Point')
				.transition().duration(250)
				.attr('r', this.data[muni][this.rlabel][this.t]**(1/2) / 2)
				.attr('cx', this.x(xMuni_t))
				.attr('cy', this.y(yMuni_t))
		}
		this.svg.selectAll('circle').raise();
	}


	// Event handling
	// --------------

	mouseover() {
		this.tooltip.style("display", "inline");
	}

	mouseout() {
		this.tooltip.style("display", "none");
	}

	tooltipDefault(muni) {
		let tooltipText = "<b>" + muni + "</b><br><br>";
		tooltipText += "<i>Total cases</i>: " + parseInt(this.data[muni][this.rlabel][this.t]) + "<br>"
		tooltipText += "<i>Cases per 100k</i>: " + parseInt(this.data[muni][this.capitalize(this.ylabel.slice(4))][this.t])
		this.tooltip
			.html(tooltipText)
			.style("left", (d3.event.pageX + 10) + "px")
			.style("top", (d3.event.pageY - 0) + "px");
	}

	// Utilities
	// ---------

	getExtents() {
		let munis = Object.keys(this.data);
		let xmin = Infinity,
			xmax = -Infinity,
			ymin = Infinity,
			ymax = -Infinity;
		for (let muni of munis) {
			let muniXmin = Math.min(...this.data[muni][this.xlabel]),
				muniXmax = Math.max(...this.data[muni][this.xlabel]),
				muniYmin = Math.min(...this.data[muni][this.ylabel]),
				muniYmax = Math.max(...this.data[muni][this.ylabel]);
			xmin = muniXmin < xmin ? muniXmin : xmin;
			xmax = muniXmax > xmax ? muniXmax : xmax;
			ymin = muniYmin < ymin ? muniYmin : ymin;
			ymax = muniYmax > ymax ? muniYmax : ymax;
		}
		return [[xmin, xmax], [ymin, ymax]]
	}

	idxToDate(i) {
		let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		let date = this.parseDate(this.datetime[0]);
		date.setHours(date.getHours() + 24 * i);
		let dateString = "";
		dateString += days[date.getDay()] + " ";
		dateString += date.getDate() + "/";
		dateString += date.getMonth() + 1
		return dateString
	}

	clip(v, l, u) {
		return Math.min(Math.max(v, l), u)
	}


	capitalize(string) {
	    return string.charAt(0).toUpperCase() + string.slice(1);
	}
}