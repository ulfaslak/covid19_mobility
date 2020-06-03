class MovementsMap {

	constructor(data, geoData, uniqueId) {
		// Variables
		this.data = data;
		this.geoData = geoData;
		this.uniqueId = uniqueId;
		this.betweenMax = data._meta.betweenMax;
		this.inMax = data._meta.inMax;
		this.outMax = data._meta.outMax;
		this.datetime = data._meta.datetime;
		this.t = data._meta.defaults.t;
		this.radioOption = data._meta.defaults.radioOption;
		this.selected = undefined;

		// Dimensions and margins
		let margin = {top: 70, right: 5, bottom: 30, left: 60},
			figureWidth = 770,
			figureHeight = 660;
		let maindiv = document.getElementById("vis-" + this.uniqueId);
		maindiv.style.width = figureWidth + "px";
		maindiv.style.height = figureHeight + "px";
		this.width = figureWidth - margin.left - margin.right;
		this.height = figureHeight - margin.top - margin.bottom;

		let latMin = data._meta.defaults.latMin,
			latMax = data._meta.defaults.latMax,
			lonMin = data._meta.defaults.lonMin,
			lonMax = data._meta.defaults.lonMax;
		this.x = d3.scaleLinear().domain([lonMin-1.2, lonMax+1.2]).range([0, this.width]);
		this.y = d3.scaleLinear().domain([latMin+0.3, latMax+0.3]).range([this.height, 0]);

		// Color scale
		this.n_steps = 5;
		this.colorScale = chroma.scale(['#b71540', '#e55039', '#C4C4C4', '#4a69bd', '#0c2461']);

		// Define tooltip div
		this.tooltip = d3.select("body").append("div")
			.attr("class", "tooltip")
			.style("display", "none");

		// SVG
		this.svg = d3.select("#vis-" + this.uniqueId)
			.append("svg")
				.attr("width", this.width + margin.left + margin.right)
				.attr("height", this.height + margin.top + margin.bottom);

		this.g = this.svg.append("g");

		// Zooming and panning
		let zoom = d3.zoom()
			.extent([[100, 18], [this.width, this.height]])
			.scaleExtent([1, 4])
			.on("zoom", () => this.zoomed());
		this.svg.call(zoom);
	}	


	// Clear and recreate
	// ------------------

	setup() {
		this.mapNamesToPolygons();
		this.setColorDomain();
		this.setKeyEvents();
	}

	drawLayout() {
		this.setRadio();
		this.setSlider();
	}

	drawData() {
		this.drawMap();
		this.setLegend();
	}

	clearData() {
		this.svg.selectAll('polygon').remove()
		this.svg.selectAll('rect').remove()
		this.svg.selectAll('text').remove()
	}

	redrawData() {
		this.setColorDomain();
		this.drawMap();
		this.setLegend();
	}


	// Setup
	// -----

	mapNamesToPolygons() {
		this.namePolygonMap = {};
		this.geoData.forEach(d => {
			this.namePolygonMap[d.kommune] = d.polygons;
		})
	}

	setColorDomain() {
		this.domain = undefined;
		if (this.radioOption == "percent_change") {
			this.domain = [-1, 1];  // reverse scale so blue (good) is less travel
		}
		else {
			this.domain = [-this.inMax, this.inMax];
		}
		this.colorScale.domain(this.domain)
	}

	setKeyEvents() {
		document.onkeydown = evt => {
		    evt = evt || window.event;
		    if (evt.key === "Escape" || evt.key === "Esc") {
		    	this.selected = undefined;
		    	this.clearData();
		    	this.redrawData();
		    }
		};
	}

	// Layout elements
	// ---------------

	setLegend() {
		let legendRange,
			legendTitle;
		if (this.radioOption == "percent_change") {
			legendRange = d3.range(-this.n_steps, this.n_steps)
			legendTitle = this.data._meta.variables.legend_label_relative;
		}
		else {
			legendRange = d3.range(-1, this.n_steps)
			legendTitle = this.data._meta.variables.legend_label_count;
		}

		// Title text
		this.svg.append('text')
			.attr('x', this.width-53)
			.attr('y', 20)
			.attr('font-weight', 700)
			.text(legendTitle)

		// Rects and labels
		legendRange.forEach((i, idx) => {

			// Rects
			this.svg.append('rect')
				.attr('x', this.width-53)
				.attr('y', idx * 23 + 40)
				.attr('width', 15)
				.attr('height', 15)
				.attr('fill', () => {
					if (idx == 0)
						return 'url(#thinlines)';
					else
						return this.colorScale(i / (this.n_steps-1) * this.domain[1]);
				})

			// labels
			this.svg.append('text')
				.attr('x', this.width-30)
				.attr('y', idx * 23 + 52.5)
				.attr('font-size', 13)
				.text(() => {
					if (idx == 0)
						return "No data";
					else
						return round(i / (this.n_steps-1) * this.domain[1] * 100, 1e0) + "%";
				})
		})
	}

	setRadio() {
		let rwidth = 180, rheight=27;

		this.radiosvg = d3.select("#radio-" + this.uniqueId)
			.append("svg")
			.attr('width', rwidth)
			.attr('height', rheight);

		this.data._meta.radioOptions.forEach((option, i) => {
			// radio boxes
			this.radiosvg.append('rect')
				.attr('class', () => {
					if (option == this.radioOption)
						return 'radio-rect selected';
					else
						return 'radio-rect'
				})
				.attr('id', 'radio-rect-' + option)
				.attr('x', rwidth/3 * i)
				.attr('y', 0)
				.attr('width', rwidth/3)
				.attr('height', rheight)
				.on('click', () => this.radioClick(option))

			// radio texts
			this.radiosvg.append('text')
				.attr('class', () => {
					if (option == this.radioOption) {
						return 'radio-text selected';
					}
					else
						return 'radio-text'
				})
				.attr('id', 'radio-text-' + option)
				.attr("x", rwidth/3 * i + rwidth/6)
				.attr("y", rheight / 2 + 4)
				.attr('font-size', 12)
				.text(() => {
					if (option == 'crisis')
						return 'On date';
					if (option == 'baseline')
						return 'Baseline';
					if (option == 'percent_change')
						return 'Change';
				})
				.on('click', () => this.radioClick(option));
		})
	}

	setSlider() {
		// Define
		let N = this.datetime.length
		let sliderStep = d3.sliderBottom()
			.min(0)
			.max(N-1)
			.width(this.width)
			.tickValues(d3.range(1, N, 7))
			.tickFormat(this.idxToDate)
			.step(1)
			.default(0)
			.on('onchange', t => {
				this.t = t;
				this.clearData();
				this.redrawData();
			});

		// Append to div
		let gStep = d3.select('#slider-' + this.uniqueId)
			.append('svg')
			.attr('width', this.width + 60)
			.attr('height', 100)
			.append('g')
			.attr('transform', 'translate(40,55)');

		gStep.call(sliderStep);
	}


	// Plot data
	// ---------

	drawMap() {
		for (let datum of this.geoData) {
			this.g.selectAll(datum.kommune)
				.data(datum.polygons)
				.enter().append("polygon")
			    .attr("points", mp => mp.map(p => [this.x(p[0]), this.y(p[1])].join(",")).join(" "))
			    .attr("class", 'map-polygon-movements')
			    .attr("id", datum.kommune)
			    .style('fill', () => this.defaultFill(datum.kommune, this.t))
				.on('mouseover', mp => {
					if (datum.kommune in this.data) {
						this.mouseover();
						if (typeof this.selected == 'undefined')
							this.highlightRegion(datum.kommune, mp, 'black');
						else if (datum.kommune != this.selected) {
							this.highlightRegion(datum.kommune, mp, 'grey');
						}
					}
				})
				.on('mousemove', () => {
					if (typeof this.selected == 'undefined') {
						if (datum.kommune in this.data) 
							this.mousemoveDefaultMovements(datum.kommune, this.t);
					} else {
						if (datum.kommune in this.data[this.selected])
							this.mousemoveSelectedMovements(datum.kommune, this.t);
						else
							this.mouseout();

					}
				})
				.on('mouseout', mp => {
					this.mouseout();
					if (datum.kommune != this.selected)
						this.unhighlightRegion(datum.kommune, mp)
				})
				.on('click', mp => {
					if (datum.kommune in this.data) {
						if (typeof this.selected == 'undefined') {
							this.highlightRegion(datum.kommune, mp, 'black')
							this.recolorRegions(datum.kommune, this.t)
							this.selected = datum.kommune;
						} else {
							if (datum.kommune == this.selected) {
								this.unhighlightRegion(this.selected, mp);
								this.restoreDefault(this.t);
								this.selected = undefined;
							} else {
								this.unhighlightRegion(this.selected, mp);
								this.highlightRegion(datum.kommune, mp, 'black');
								this.recolorRegions(datum.kommune, this.t);
								this.selected = datum.kommune;
							}
						}
					}
				});
		}
	}
	// Event handling
	// --------------

	// Mouse
	mouseover() {
		this.tooltip.style("display", "inline");
	}

	mouseout() {
		this.tooltip.style("display", "none");
	}

	mousemoveDefaultMovements(d, t) {
		let count = this.data[d]["_" + d][this.radioOption][this.t][0];

		let tooltiptext = "<b>" + d + "</b><br>";
		if (this.radioOption == 'percent_change')
			tooltiptext += "Deviation: <b>" + round(count*100, 1e1) + "%</b>";
		else
			tooltiptext += "Share: <b>" + round(this.data[d]["_" + d][this.radioOption][this.t][0] * 100, 1e1) + "%</b>";

		this.tooltip
			.html(tooltiptext)
			.style("left", (d3.event.pageX + 10) + "px")
			.style("top", (d3.event.pageY - 10) + "px");
	}

	mousemoveSelectedMovements(d, t) {
		let count = this.data[this.selected][d][this.radioOption][this.t][0];
		if (this.selected == d) {
			Object.keys(this.data[this.selected]).forEach(n => {
				if (n != d && this.t in this.data[this.selected][n][this.radioOption])
					count -= this.data[this.selected][n][this.radioOption][this.t][0];
			})
		}

		let tooltiptext = "<b>" + d + "</b><br>";
		if (this.radioOption == 'percent_change')
			tooltiptext += "Deviation: <b>" + round(count * 100, 1e1) + "%</b>";
		else
			tooltiptext += "Share: <b>" + round(count * 100, 1e2) + "%</b>";

		this.tooltip
			.html(tooltiptext)
			.style("left", (d3.event.pageX + 10) + "px")
			.style("top", (d3.event.pageY - 10) + "px");
	}

	// Coloring
	defaultFill(d, t) {
		if (d in this.data && this.t in this.data[d]["_" + d][this.radioOption]) {
    		let count = this.data[d]["_" + d][this.radioOption][this.t][0];
    		return this.colorScale(count).hex();
    	} else {
    		return 'url(#thinlines)';
    	}
	}

	highlightRegion(d, mp, color) {
		this.pushPolygonToFront(mp);
		this.svg.selectAll('#' + d)
			.style('stroke', color)
			.style('stroke-width', 1)
	}

	unhighlightRegion(d, mp) {
		if (typeof this.selected != 'undefined') {
			this.pushMultiPolygonToFront(this.namePolygonMap[this.selected])
		}
		this.svg.selectAll('#' + d)
			.style('stroke', 'white')
			.style('stroke-width', 0.3)
	}

	recolorRegions(d, t) {
		// Make everything gray
		this.svg.selectAll('.map-polygon-movements')
			.style('fill', '#ecf0f1')

		// Color each kommune by their flow into `d`
		Object.keys(this.data[d]).forEach(neighbor => {
			if (t in this.data[d][neighbor][this.radioOption]) {
				let count;
				if (neighbor != d) {
					count = this.data[d][neighbor][this.radioOption][this.t][0]
				} else {
					count = this.data[d][d][this.radioOption][this.t][0]
					Object.keys(this.data[d]).forEach(n => {
						if (n != d & this.t in this.data[d][n][this.radioOption])
							count -= this.data[d][n][this.radioOption][this.t][0]
					})
				}
				this.svg.selectAll('#' + neighbor)
					.style('fill', this.colorScale(count).hex())
			}
		})
	}

	restoreDefault(t) {
		this.geoData.forEach(datum_ => {
			this.svg.selectAll('#' + datum_.kommune)
				.style('fill', this.defaultFill(datum_.kommune, this.t))
		})
	}

	// Zooming and panning
	zoomed() {
		this.g.attr("transform", d3.event.transform);
	}

	// Buttons and slider
	radioClick(option) {
		if (option != this.radioOption) {
			this.radiosvg.select('#radio-rect-' + this.radioOption)
				.attr('class', 'radio-rect');
			this.radiosvg.select('#radio-rect-' + option)
				.attr('class', 'radio-rect selected');
			this.radioOption = option;
			this.clearData();
			this.redrawData();
		}
	}

	updateCrisis() {
		this.radioOption = 'crisis';
		this.clearData();
		this.redrawData();
	}

	updateBaseline() {
		this.radioOption = 'baseline';
		this.clearData();
		this.redrawData();
	}

	updatePercentChange() {
		this.radioOption = 'percent_change';
		this.clearData();
		this.redrawData();
	}




	// Utilities
	// ---------

	idxToDate(i) {
		let days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		let date = new Date(2020, 2, 28);
		date.setHours(date.getHours() + 24 * i);
		let dateString = "";
		dateString += days[date.getDay()] + " ";
		dateString += date.getDate() + "/";
		dateString += date.getMonth() + 1
		return dateString
	}

	pushPolygonToFront(d) {
		this.svg.selectAll("polygon").sort(a => {
	      	if (a != d) return -1
	      	else return 1;
	  	});
	}

	pushMultiPolygonToFront(d) {
		this.svg.selectAll("polygon").sort(a => {
	      	if (!d.includes(a)) return -1
	      	else return 1;
	  	});
	}

}