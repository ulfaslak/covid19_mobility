class MovementsMap {

	constructor(data, geoData, uniqueId) {
		// Variables
		this.data = data;
		this.geoData = geoData;
		this.uniqueId = uniqueId;
		this.inMax = round(data._meta.variables.inMax, 1e2);
		this.outMax = data._meta.variables.outMax;
		this.datetime = data._meta.datetime;
		this.t = data._meta.defaults.t;
		this.radioOption = data._meta.defaults.radioOption;
		this.idx0or1 = data._meta.defaults.idx0or1;
		this.mode = 'linear';

		// Dimensions
		let figureWidth = 770,
			figureHeight = 770;
		let maindiv = document.getElementById("vis-" + this.uniqueId);
		maindiv.style.width = figureWidth + "px";
		maindiv.style.height = figureHeight + "px";
		this.width = figureWidth;
		this.height = figureHeight;
		this.rwidth = 180;
		this.rheight = 27;

		// Parse the date / time
		this.parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
		this.formatDate = d3.timeFormat("%e %B");

		// Color scale
		this.n_steps = 5;
		this.colorScale = chroma.scale(['#b71540', '#e55039', '#E4E4E4', '#4a69bd', '#0c2461']);

		// Define tooltip div
		this.tooltip = d3.select("body").append("div")
			.attr("class", "tooltip")
			.style("display", "none");

		// SVG
		this.svg = d3.select("#vis-" + this.uniqueId)
			.append("svg")
				.attr("width", this.width)
				.attr("height", this.height);

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
		this.setScaling();
		this.setColorDomain();
		this.setKeyEvents();
		this.resetState();
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

	meanAngle(alpha) {
		return Math.atan2(
			1/alpha.length * d3.sum(alpha.map(a => Math.sin(a / 180 * Math.PI))),
			1/alpha.length * d3.sum(alpha.map(a => Math.cos(a / 180 * Math.PI)))
		) * 180 / Math.PI;
	}

	diffAngle(a, b) {
		return Math.atan2(
			Math.sin(b/180*Math.PI-a/180*Math.PI),
			Math.cos(b/180*Math.PI-a/180*Math.PI),
		) * 180 / Math.PI;
	}

	getBoundingBox() {
		let lats = [],
			lons = [];

		this.geoData.forEach(arr => {
			arr.polygons.forEach(poly => {
				poly.forEach(point => {
					lats.push(point[1]);
					lons.push(point[0]);
				})
			})
		})

		let midLat = d3.mean(lats);
		let midLon = this.meanAngle(lons);

		let lats_max_min = this.minMaxArray(lats);
		let lons_max_min = this.minMaxArray(lons.map(l => this.diffAngle(midLon, l)));

		return [
			lats_max_min.min,
			lats_max_min.max,
			lons[lons_max_min.minIdx],
			lons[lons_max_min.maxIdx],
			midLat,
			midLon
		];
	}

	// projection([lon, lat]) {
	// 	// https://mathworld.wolfram.com/GnomonicProjection.html
	// 	let lam0 = lon / 180 * Math.PI;
	// 	let phi1 = lat / 180 * Math.PI;
	// 	let cosc = Math.sin(phi1) * Math.sin(this.phi) + Math.cos(phi1) * Math.cos(this.phi) * Math.cos(this.lam - lam0);
		
	// 	let x = Math.cos(this.phi) * Math.sin(this.lam - lam0) / cosc;
	// 	let y = Math.cos(phi1) * Math.sin(this.phi) - Math.sin(phi1) * Math.cos(this.phi) * Math.cos(this.lam - lam0) / cosc;

	// 	return [x, y];
	// }

	projection([lon, lat]) {
		// https://mathworld.wolfram.com/OrthographicProjection.html
		let lam0 = lon / 180 * Math.PI;
		let phi1 = lat / 180 * Math.PI;
		
		let x = Math.cos(this.phi) * Math.sin(this.lam - lam0);
		let y = Math.cos(phi1) * Math.sin(this.phi) - Math.sin(phi1) * Math.cos(this.phi) * Math.cos(this.lam - lam0);

		return [x, y];
	}

	proj([lon, lat]) {
		let pp = this.projection([lon, lat]);
		let newpp = [this.xScaler(pp[0]), this.yScaler(pp[1])];
		return newpp;
	}

	setScaling() {
		// lat,lon bounding box
		let bbCoords = this.getBoundingBox();
		let latMin = bbCoords[0],
			latMax = bbCoords[1],
			lonMin = bbCoords[2],
			lonMax = bbCoords[3],
			latMid = bbCoords[4],
			lonMid = bbCoords[5];

		// Center point of projection
		this.lam = lonMid / 180 * Math.PI;
		this.phi = latMid / 180 * Math.PI;

		// Projection bounding box
		let lowerLeft = this.projection([lonMin, latMin]),
    		upperLeft = this.projection([lonMin, latMax]),
    		upperRight = this.projection([lonMax, latMax]),
    		lowerRight = this.projection([lonMax, latMin]);

    	// Extremes
    	let maxX = Math.min(lowerLeft[0], upperLeft[0]),
    		minX = Math.max(lowerRight[0], upperRight[0]),
    		minY = upperLeft[1],
    		maxY = lowerLeft[1];

    	// Width and height
		let mapWidth = maxX - minX,
			mapHeight = maxY - minY;

		// Set scaling according to aspect
		if (mapWidth < mapHeight) {
	    	this.xScaler = d3.scaleLinear().domain([maxY, minY]).range([0, this.height]);
			this.yScaler = d3.scaleLinear().domain([maxY, minY]).range([this.height, 0]);
		} else {
			this.xScaler = d3.scaleLinear().domain([minX, maxX]).range([this.width, 0]);
			this.yScaler = d3.scaleLinear().domain([minX, maxX]).range([0, this.width]);
		}
	}

	setColorDomain() {
		this.domain = undefined;
		if (this.radioOption == "percent_change")
			this.domain = [-1, 1];  // reverse scale so blue (good) is less travel
		else
			this.domain = [-this.inMax, this.inMax];

		this.colorScale.domain(this.domain)
	}

	setKeyEvents() {
		document.onkeydown = evt => {
		    evt = evt || window.event;
		    if (evt.key === "Escape" || evt.key === "Esc") {
		    	this.resetState();
		    	this.clearData();
		    	this.redrawData();
		    } else
		    if (evt.key === "Shift") {
		    	this.idx0or1 = 1;
		    	if (typeof this.selected != 'undefined') {
		    		this.tooltipSelected(this.hovering);
		    		this.recolorRegions(this.selected);
		    	} else {
		    		if (this.hovering != undefined)
		    			this.tooltipDefault(this.hovering);
		    		this.restoreDefault()
		    	}
		    }
		};

		document.onkeyup = evt => {
		    evt = evt || window.event;
		    if (evt.key === "Shift") {
		    	this.idx0or1 = 0;
		    	if (typeof this.selected != 'undefined') {
		    		this.tooltipSelected(this.hovering);
		    		this.recolorRegions(this.selected);
		    	} else {
		    		if (this.hovering != undefined)
		    			this.tooltipDefault(this.hovering);
		    		this.restoreDefault()
		    	}
		    }
		};
	}

	resetState() {
		this.selected = undefined;
		this.hovering = undefined;
		this.selected_polygons = [];
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
			.attr('x', this.width-120)
			.attr('y', 20)
			.attr('font-weight', 700)
			.text(legendTitle)

		// Rects and labels
		legendRange.forEach((i, idx) => {

			// Rects
			this.svg.append('rect')
				.attr('x', this.width-120)
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
				.attr('x', this.width-95)
				.attr('y', idx * 23 + 52.5)
				.attr('font-size', 13)
				.text(() => {
					if (idx == 0)
						return "No data";
					else {
						if (this.radioOption == "percent_change" || this.domain[1] <= 1)
							return round(i / (this.n_steps-1) * this.domain[1] * 100, 1e0) + "%";
						else if (this.domain[1] <= 100)
							return round(i / (this.n_steps-1) * this.domain[1], 1e0);
						else if (this.domain[1] <= 10_000)
							return round(i / (this.n_steps-1) * this.domain[1], 1e2);
						else if (this.domain[1] <= 1_000_000)
							return round(i / (this.n_steps-1) * this.domain[1] / 1e3, 1e0) + "K";
						else
							return round(i / (this.n_steps-1) * this.domain[1] / 1e6, 1e0) + "M";
					}
				})
		})
	}

	setRadio() {
		this.radiosvg = d3.select("#radio-" + this.uniqueId)
			.append("svg")
			.attr('width', this.rwidth)
			.attr('height', this.rheight)
			.style('margin-top', 5);

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
				.attr('x', this.rwidth/3 * i)
				.attr('y', 0)
				.attr('width', this.rwidth/3)
				.attr('height', this.rheight)
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
				.attr("x", this.rwidth/3 * i + this.rwidth/6)
				.attr("y", this.rheight / 2 + 4)
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
			.width(this.width - this.rwidth - 60)
			.tickValues(d3.range(2, N, 14))
			.tickFormat(i => this.idxToDate(i))
			.step(1)
			.default(this.t)
			.on('onchange', t => {
				this.t = t;
				this.clearData();
				this.redrawData();
			});

		// Append to div
		let gStep = d3.select('#slider-' + this.uniqueId)
			.append('svg')
			.attr('width', this.width - this.rwidth)
			.attr('height', 60)
			.append('g')
			.attr('transform', 'translate(15,10)');

		gStep.call(sliderStep);
	}


	// Plot data
	// ---------

	drawMap() {
		for (let datum of this.geoData) {
			let dataExists = this.exists(datum.kommune);
			this.g.selectAll(idify(datum.kommune))
				.data(datum.polygons)
				.enter().append("polygon")
			    .attr("points", polygon => polygon.map(p => {
			    		let pp = this.proj(p);
			    		return [pp[0], pp[1]].join(",")
					}).join(" ")
			    )
			    .attr("class", 'map-polygon-movements')
			    .attr("id", idify(datum.kommune))
			    .style('fill', () => {
			    	if (typeof this.selected == 'undefined')
			    		return this.defaultFill(datum.kommune)
			    })
				.on('mouseover', polygon => {
					if (dataExists) {
						this.mouseover();
						this.hovering = datum.kommune;
						if (typeof this.selected == 'undefined') {
							this.highlightRegion(datum.polygons, 'black');
						} else {
							if (datum.kommune != this.selected)
								this.highlightRegion(datum.polygons, 'grey');
						}
					}
				})
				.on('mousemove', () => {
					if (dataExists) {
						if (typeof this.selected == 'undefined')
							this.tooltipDefault(datum.kommune);
						else {
							this.tooltipSelected(datum.kommune);

						}
					}
				})
				.on('mouseout', polygon => {
					if (dataExists) {
						this.mouseout();
						this.hovering = undefined;
						if (datum.kommune != this.selected)
							this.unhighlightRegion()
					}
				})
				.on('click', polygon => {
					if (dataExists) {
						this.unhighlightAllRegions();
						this.highlightRegion(datum.polygons, 'black');
						if (typeof this.selected == 'undefined') {
							this.recolorRegions(datum.kommune)
							this.selected = datum.kommune;
							this.tooltipSelected(datum.kommune);
						} else {
							if (datum.kommune == this.selected) {
								this.restoreDefault(this.t);
								this.selected = undefined;
								this.tooltipDefault(datum.kommune);
							} else {
								this.recolorRegions(datum.kommune);
								this.selected = datum.kommune;
								this.tooltipSelected(datum.kommune);
							}
						}
					}
				});
		}

		if (typeof this.selected != 'undefined') {
			this.recolorRegions(this.selected);
			this.highlightRegion(this.namePolygonMap[this.selected], 'black');
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

	tooltipDefault(d) {
		let crisis = this.data[d]["_" + d]['crisis'][this.t][this.idx0or1];
		let baseline = this.data[d]["_" + d]['baseline'][this.t][this.idx0or1];
		let percent_change = this.data[d]["_" + d]['percent_change'][this.t][this.idx0or1];

		let tooltiptext = "";
		if (this.idx0or1 == 0)
			tooltiptext += "Share of <b>" + d + "</b> population<br>commuting to anywhere<br><br>";
		else
			tooltiptext += "Commuters in <b>" + d + "</b><br>relative to its population<br><br>";
		tooltiptext += "On date: <b>" + round(crisis * 100, 1e2) + "%</b><br>";
		tooltiptext += "Baseline: <b>" + round(baseline * 100, 1e2) + "%</b><br>";
		if (baseline > 0)
			tooltiptext += "Deviation: <b>" + round(percent_change * 100, 1e2) + "%</b>";

		if (d3.event != null) {
			this.tooltip
				.html(tooltiptext)
				.style("left", (d3.event.pageX + 10) + "px")
				.style("top", (d3.event.pageY - 10) + "px");
			this.eventX = d3.event.pageX;
			this.eventY = d3.event.pageY;
		} else {
			this.tooltip
				.html(tooltiptext)
				.style("left", (this.eventX + 10) + "px")
				.style("top", (this.eventY - 10) + "px");
		}
	}

	tooltipSelected(d) {

		let crisis = 0,
			baseline = 0, 
			percent_change = 'NaN';

		if (d in this.data[this.selected]) {
			if (this.t in this.data[this.selected][d]['crisis'])
				crisis = this.data[this.selected][d]['crisis'][this.t][this.idx0or1];
			if (this.t in this.data[this.selected][d]['baseline'])
				baseline = this.data[this.selected][d]['baseline'][this.t][this.idx0or1];
			if (this.t in this.data[this.selected][d]['percent_change'])
				percent_change = this.data[this.selected][d]['percent_change'][this.t][this.idx0or1];			
		}

		let tooltiptext = "";
		if (this.inMax <= 1) {
			if (this.selected == this.hovering) {
				tooltiptext += "Share of <b>" + this.selected + "</b> population<br>commuting within <b>" + this.hovering + "</b><br><br>";
			}
			else {
				if (this.idx0or1 == 0)
					tooltiptext += "Share of <b>" + this.selected + "</b> population<br>commuting to <b>" + this.hovering + "</b><br><br>";
				else
					tooltiptext += "Share of <b>" + this.hovering + "</b> population<br>commuting to <b>" + this.selected + "</b><br><br>";
			}
			
			tooltiptext += "On date: <b>" + round(crisis * 100, 1e2) + "%</b><br>";
			tooltiptext += "Baseline: <b>" + round(baseline * 100, 1e2) + "%</b><br>";
		} else {
			if (this.idx0or1 == 0) 
				tooltiptext += "Trips starting in <b>" + this.selected + "</b> that end in <b>" + this.hovering + "</b><br><br>";
			else if (this.idx0or1 == 1) 
				tooltiptext += "Trips starting in <b>" + this.hovering + "</b> that end in <b>" + this.selected + "</b><br><br>";
			tooltiptext += "On date: <b>" + insertKSeperators(round(crisis, 1e0)) + "</b><br>";
			tooltiptext += "Baseline: <b>" + insertKSeperators(round(baseline, 1e0)) + "</b><br>";

		if (baseline > 0)
			tooltiptext += "Deviation: <b>" + round(percent_change * 100, 1e2) + "%</b>";	
		}

		if (d3.event != null) {
			this.tooltip
				.html(tooltiptext)
				.style("left", (d3.event.pageX + 10) + "px")
				.style("top", (d3.event.pageY - 10) + "px");
			this.eventX = d3.event.pageX;
			this.eventY = d3.event.pageY;
		} else {
			this.tooltip
				.html(tooltiptext)
				.style("left", (this.eventX + 10) + "px")
				.style("top", (this.eventY - 10) + "px");
		}
	}

	// Coloring
	defaultFill(d) {
		if (this.exists(d)) {
    		let count = this.data[d]["_" + d][this.radioOption][this.t][this.idx0or1];
    		return this.colorScale(count).hex();
    	} else {
    		return 'url(#thinlines)';
    	}
	}

	highlightRegion(d, color) {
		this.selected_polygons.push(
			d.map(polygon => {
				return this.g.append("polygon")
				    .attr("points", polygon.map(p => {
					    	let pp = this.proj(p);
				    		return [pp[0], pp[1]].join(",")
				    	}).join(" ")
				    )
				    .style('fill', 'none')
				    .style('stroke', color)
				    .style('stroke-width', 1)
			})
		)
	}

	unhighlightRegion() {
		this.selected_polygons[this.selected_polygons.length-1].forEach(polygon => {
			polygon.remove();
		})
		this.selected_polygons.pop()
	}

	unhighlightAllRegions() {
		this.selected_polygons.forEach(multiPolygon => {
			multiPolygon.forEach(polygon => {
				polygon.remove();
			})
		})
		this.selected_polygons = [];
	}

	recolorRegions(d) {
		// Make everything gray
		this.svg.selectAll('.map-polygon-movements')
			.style('fill', '#ecf0f1')

		// Color each kommune by their flow into `d`
		Object.keys(this.data[d]).forEach(neighbor => {
			if (this.t in this.data[d][neighbor][this.radioOption]) {
				let count = this.data[d][neighbor][this.radioOption][this.t][this.idx0or1]
				this.svg.selectAll('#' + idify(neighbor))
					.style('fill', this.colorScale(count).hex());
			}
		})
	}

	restoreDefault(t) {
		this.geoData.forEach(datum_ => {
			this.svg.selectAll('#' + idify(datum_.kommune))
				.style('fill', this.defaultFill(datum_.kommune))
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
			// this.clearData();
			// this.redrawData();
			if (this.selected === undefined)
				this.restoreDefault();
			else
				this.recolorRegions(this.selected);
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
		let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		let date = this.parseDate(this.datetime[0]);
		date.setHours(date.getHours() + 24 * i);
		let dateString = "";
		dateString += days[date.getDay()] + " ";
		dateString += date.getDate() + "/";
		dateString += date.getMonth() + 1
		return dateString
	}

	exists(d) {
		if (!(d in this.data))
			return false;
		if (!(this.t in this.data[d]["_" + d][this.radioOption]))
			return false;
		if (this.data[d]["_" + d][this.radioOption][this.t] + "" == "0,0")
			return false;
		return true;
	}

	haversine(lat1, lon1, lat2, lon2) {
		function toRad(x) {
			return x * Math.PI / 180;
		}

		let R = 6371e3;

		let dLat = toRad(lat2 - lat1);
		let dLon = toRad(lon2 - lon1)
		let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
			Math.sin(dLon / 2) * Math.sin(dLon / 2);
		let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c;
	}

	minMaxArray(arr) {
	    let max = -Number.MAX_VALUE,
	        min = Number.MAX_VALUE;
	    let maxIdx, minIdx;

	    arr.forEach(function(e, i) {
	        if (max < e) {
	        	max = e;
	        	maxIdx = i;
	        }
	        if (min > e) {
	        	min = e;
	        	minIdx = i;
	        }
	    });
	    return {max: max, min: min, maxIdx: maxIdx, minIdx: minIdx};
    }
}