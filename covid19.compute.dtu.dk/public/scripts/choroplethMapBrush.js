class MovementsMapBrush {

	constructor(data, geoData, uniqueId) {
		// Variables
		this.data = data;
		this.geoData = geoData;
		this.uniqueId = uniqueId;
		this.maxFlow = data._meta.variables.inMax + data._meta.variables.outMax // we sum in and out
		this.datetime = data._meta.datetime;
		this.t0 = this.data._meta.defaults.t - 1;
		this.t1 = this.data._meta.defaults.t - 1;
		this.scaling = "linear";  // DEBUG: implement this when everything else works

		// define div dimensions
		this.width = 770;
		this.mapHeight = 770;
		this.brushHeight = 100;
		
		// set div dimensions
		let mapdiv = document.getElementById("vis-" + this.uniqueId);
		mapdiv.style.width = this.width + "px";
		mapdiv.style.height = this.mapHeight + "px";

		let brushdiv = document.getElementById("brush-" + this.uniqueId);
		brushdiv.style.width = this.width + "px";
		brushdiv.style.height = this.brushHeight + "px";

		// Parse the date / time
		this.parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
		this.formatDate = d3.timeFormat("%e %B");

		// Color scale
		this.n_steps = 5;
		this.colorScale = chroma.scale(['#ffffff', '#000000'])
		this.colorDomain = [0, this.maxFlow];
		this.colorScale.domain(this.colorDomain);
		this.colorScale.nodata(this.colorScale.colors()[0]);

		// Define tooltip div
		this.tooltip = d3.select("body").append("div")
			.attr("class", "tooltip")
			.style("display", "none");

		// Map svg
		this.svgMap = d3.select("#vis-" + this.uniqueId)
			.append("svg")
				.attr("width", this.width)
				.attr("height", this.mapHeight);
		this.g = this.svgMap.append("g");

		this.svgMap.call(
			d3.zoom()
				.extent([[100, 18], [this.width, this.mapHeight]])
				.scaleExtent([1, 4])
				.on("zoom", () => this.zoomed())
		);

		// Brush svg
		this.svgBrush = d3.select('#brush-' + this.uniqueId)
			.append("svg")
				.attr("width", this.width)
				.attr("height", this.brushHeight)

	}	


	// Clear and recreate
	// ------------------

	setup() {
		this.mapNamesToPolygons();
		this.setCoordinateScaling();
		this.setKeyEvents();
		this.resetState();
	}

	drawData() {
		this.drawMap();
	}

	drawLayout() {
		this.setBrushPlot();
		this.drawInfoBox();
		this.setLegend();
	}

	clearData() {
		this.svgMap.selectAll('polygon').remove()
		this.svgMap.selectAll('rect').remove()
		this.svgMap.selectAll('text').remove()
	}

	redrawData() {
		this.drawMap();
		this.setLegend();
		this.drawInfoBox();
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

	setCoordinateScaling() {
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
	    	this.xScaler = d3.scaleLinear().domain([maxY, minY]).range([0, this.mapHeight]);
			this.yScaler = d3.scaleLinear().domain([maxY, minY]).range([this.mapHeight, 0]);
		} else {
			this.xScaler = d3.scaleLinear().domain([minX, maxX]).range([this.width, 0]);
			this.yScaler = d3.scaleLinear().domain([minX, maxX]).range([0, this.width]);
		}
	}

	setKeyEvents() {
		document.onkeydown = evt => {
		    evt = evt || window.event;
		    if (evt.key === "Escape" || evt.key === "Esc") {
		    	this.resetState();
		    	this.clearData();
		    	this.redrawData();
		    	this.redrawBrushLine();
		    } else
		    if (evt.key === "Shift" && this.selected != undefined) {
		    	if (this.scaling == 'linear') {
		    		this.scaling = "log";
					this.colorDomain = [0, Math.log(this.maxFlow)];
		    	} else {
		    		this.scaling = "linear";
					this.colorDomain = [0, this.maxFlow];
		    	}
				this.colorScale.domain(this.colorDomain)
				if (typeof this.selected == 'undefined')
					this.restoreDefault();
				else
					this.recolorRegions(this.selected);
				this.setLegend()
		    }
		};

		// document.onkeyup = evt => {
		//     evt = evt || window.event;
		//     if (evt.key === "Shift" && this.selected != undefined) {
		//     	this.scaling = "linear";
		//     	this.colorDomain = [0, this.maxFlow];
		// 		this.colorScale.domain(this.colorDomain)
		// 		if (typeof this.selected == 'undefined')
		// 			this.restoreDefault();
		// 		else
		// 			this.recolorRegions(this.selected);
		//     }
		// };
	}

	resetState() {
		this.selected = undefined;
		this.hovering = undefined;
		this.selected_polygons = [];
	}

	// Layout elements
	// ---------------

	setLegend() {
		d3.selectAll('.legend-component').remove();

		// let legendRange = d3.range(-1, this.n_steps),
		// 	legendTitle = this.data._meta.variables.legend_label_count;
		let legendTitle = this.data._meta.variables.legend_label_count;
		let legendRange;
		if (this.scaling == 'linear')
			legendRange = this.linspace(0, this.maxFlow, this.n_steps);
		else if (this.scaling == 'log')
			legendRange = this.logspace(Math.log(1), Math.log(this.maxFlow), this.n_steps);

		// Title text
		this.svgMap.append('text')
			.attr('class', 'legend-component')
			.attr('x', this.width-120)
			.attr('y', 20)
			.attr('font-weight', 700)
			.text(legendTitle)

		// Rects and labels
		legendRange = ["No data", ...legendRange];
		legendRange.forEach((i, idx) => {

			// Rects
			this.svgMap.append('rect')
				.attr('class', 'legend-component')
				.attr('x', this.width-120)
				.attr('y', idx * 23 + 40)
				.attr('width', 15)
				.attr('height', 15)
				.attr('fill', () => {
					if (idx == 0)
						return 'url(#thinlines)';
					else
						return this.getColor(i);
				})

			// labels
			this.svgMap.append('text')
				.attr('class', 'legend-component')
				.attr('x', this.width-95)
				.attr('y', idx * 23 + 52.5)
				.attr('font-size', 13)
				.text(() => {
					if (idx == 0)
						return "No data";
					else {
						if (i <= 100)
							return round(i, 1e0);
						else if (i <= 10_000)
							return round(i, 1e-2);
						else if (i <= 1_000_000)
							return round(i / 1e3, 1e0) + "K";
						else
							return round(i / 1e6, 1e1) + "M";
					}
				})
		})
	}


	setBrushPlot() {
		this.margin = ({top: 0, right: 0, bottom: 20, left: 20});
		let figwidth = this.width - this.margin.left - this.margin.right;
		let figheight = this.brushHeight - this.margin.top - this.margin.bottom;

		// Preprate time series
		this.time = this.data._meta.datetime.map(d => this.parseDate(d))
		this.values = this.aggregatePlaces()

		// Ranges
		let x = d3.scaleTime()
			.domain(d3.extent(this.time))
			.range([this.margin.left, figwidth - this.margin.right]);
		let xi = d3.scaleLinear()
			.domain(d3.extent(d3.range(this.time.length)))
			.range([this.margin.left, figwidth - this.margin.right]);
		let y = d3.scaleLinear()
			.domain(d3.extent(this.values))
			.range([figheight - this.margin.top, this.margin.bottom]);

		// Axes
		let xAxis = d3.axisBottom(x).ticks(6);

		// Line
		let valueline = d3.line()
			.x(d => x(d[0]))
			.y(d => y(d[1]));

		// Draw line
		this.svgBrush.append("path")
			.datum(zip(this.time, this.values))
			.attr('class', 'brushline')
			.attr("id", "data" + this.uniqueId)
			.attr('d', valueline)

		// Draw baseline indicator lines
		this.svgBrush.append("line")
			.attr('x1', xi(39))
			.attr('x2', xi(39))
			.attr('y1', this.margin.top)
			.attr('y2', figheight)
			.attr('class', 'line-baseline')

		this.svgBrush.append('text')
			.attr('x', xi(39) - 4)
			.attr('y', 20)
			.attr('text-anchor', 'end')
			.attr('font-size', 11)
			.style('stroke', '#999999')
			.text('Lockdown announced')

		this.svgBrush.append("line")
			.attr('x1', xi(74))
			.attr('x2', xi(74))
			.attr('y1', this.margin.top)
			.attr('y2', figheight)
			.attr('class', 'line-baseline')

		this.svgBrush.append('text')
			.attr('x', xi(74) - 4)
			.attr('y', 30)
			.attr('text-anchor', 'end')
			.attr('font-size', 11)
			.style('stroke', '#999999')
			.html('Daycare reopens')

		// this.svgBrush.append("line")
		// 	.attr('x1', xi(107))
		// 	.attr('x2', xi(107))
		// 	.attr('y1', this.margin.top)
		// 	.attr('y2', figheight)
		// 	.attr('class', 'line-baseline')

		// this.svgBrush.append('text')
		// 	.attr('x', xi(107) - 4)
		// 	.attr('y', 15)
		// 	.attr('text-anchor', 'end')
		// 	.attr('font-size', 11)
		// 	.style('stroke', '#999999')
		// 	.html('Cafes, schools reopen')

		this.svgBrush.append("line")
			.attr('x1', xi(116))
			.attr('x2', xi(116))
			.attr('y1', this.margin.top)
			.attr('y2', figheight)
			.attr('class', 'line-baseline')

		this.svgBrush.append('text')
			.attr('x', xi(116) - 4)
			.attr('y', 20)
			.attr('text-anchor', 'end')
			.attr('font-size', 11)
			.style('stroke', '#999999')
			.html('Almost everything reopens')

		// Draw axis
		this.svgBrush.append("g")	
			.attr("class", "x axis")
			.attr("transform", "translate(0," + figheight + ")")
			.call(xAxis);

		// Add brush
		let brush = d3.brushX()
			.extent([[this.margin.left, this.margin.top], [figwidth, figheight]])
			.on("start brush", () => {
				let d = d3.event.selection.map(xi.invert);
				this.t0 = parseInt(d[0]);
				this.t1 = parseInt(d[1]);
				if (typeof this.selected == 'undefined')
					this.restoreDefault();
				else
					this.recolorRegions(this.selected);
				this.updateInfoBox();
			})

		this.svgBrush.append("g")
			.call(brush)
	}

	redrawBrushLine() {
		// Remove old data
		this.svgBrush.select('.brushline').remove();

		// Ranges
		let figwidth = this.width - this.margin.left - this.margin.right;
		let figheight = this.brushHeight - this.margin.top - this.margin.bottom;

		// New y values
		this.values = this.aggregatePlaces(this.selected);

		// New scales
		let x = d3.scaleTime()
			.domain(d3.extent(this.time))
			.range([this.margin.left, figwidth - this.margin.right]);
		let y = d3.scaleLinear()
			.domain(d3.extent(this.values))
			.range([figheight - this.margin.top, this.margin.bottom]);

		// Line
		let valueline = d3.line()
			.x(d => x(d[0]))
			.y(d => y(d[1]));

		// Preprate time series
		this.svgBrush.append("path")
			.datum(zip(this.time, this.values))
			.attr('class', 'brushline')
			.attr("id", "data" + this.uniqueId)
			.attr('d', valueline);
	}

	drawInfoBox() {
		this.selectedTimeText = this.svgMap.append('text')
			.attr('x', 10)
			.attr('y', 20)
			.style('font-weight', 700)
			.text(`${this.formatDate(this.parseDate(this.datetime[this.t0]))} to ${this.formatDate(this.parseDate(this.datetime[this.t1]))}`);

		this.selectedLocationText = this.svgMap.append('text')
			.attr('x', 10)
			.attr('y', 45)
			.text(() => {
				let crisis = d3.mean(this.values.slice(this.t0, this.t1+1))
				return 'Denmark: ' + insertKSeperators(parseInt(crisis)) + " movements per day on average";
			});
	}

	updateInfoBox() {
		this.selectedTimeText
			.text(`${this.formatDate(this.parseDate(this.datetime[this.t0]))} to ${this.formatDate(this.parseDate(this.datetime[this.t1]))}`);

		this.selectedLocationText
			.text(() => {
				if (typeof this.selected == 'undefined') {
					let crisis = d3.mean(this.values.slice(this.t0, this.t1+1));
					return 'Denmark: ' + insertKSeperators(parseInt(crisis)) + " movements per day on average";
				}
				else {
					let d = this.selected;
					let crisis = d3.mean(this.data[d]["_" + d]['crisis'].slice(this.t0, this.t1+1).map(v => v[0]+v[1]));
					return this.selected + ": " + insertKSeperators(parseInt(crisis)) + " movements per day on average";
				}
			})
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
			    .style("stroke", "#000000")
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
							this.unhighlightRegion();
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
								this.restoreDefault();
								this.selected = undefined;
								this.tooltipDefault(datum.kommune);
							} else {
								this.recolorRegions(datum.kommune);
								this.selected = datum.kommune;
								this.tooltipSelected(datum.kommune);
							}
						}
					}
					this.updateInfoBox();
					this.redrawBrushLine();
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
		let crisis = d3.mean(this.data[d]["_" + d]['crisis'].slice(this.t0, this.t1+1).map(v => v[0]+v[1]));

		let tooltiptext = "";
		tooltiptext += "<b>" + d + "</b><br><br>";
		tooltiptext += "<b>" + insertKSeperators(round(crisis, 1e0)) + "</b> per day on average";

		this.tooltip
			.html(tooltiptext)
			.style("left", (d3.event.pageX + 10) + "px")
			.style("top", (d3.event.pageY - 10) + "px");
	}

	tooltipSelected(d) {
		let crisis = 0
		if (d in this.data[this.selected]) {
			crisis = d3.mean(this.data[this.selected][d]['crisis'].slice(this.t0, this.t1+1).map(v => v[0]+v[1]));
		}

		let tooltiptext = "";
		if (this.selected == this.hovering)
			tooltiptext += "Within <b>" + this.selected + "</b><br><br>";
		else
			tooltiptext += "Between <b>" + this.selected + "</b> and <b>" + this.hovering + "</b><br><br>";
		tooltiptext += "<b>" + insertKSeperators(round(crisis, 1e0)) + "</b> per day on average";

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
    		let crisis = d3.mean(this.data[d]["_" + d]['crisis'].slice(this.t0, this.t1+1).map(v => v[0]+v[1]));
    		return this.getColor(crisis);
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
		this.svgMap.selectAll('.map-polygon-movements')
			.style('fill', '#ffffff')

		// Color each kommune by their flow into `d`
		Object.keys(this.data[d]).forEach(neighbor => {
			let crisis = d3.mean(this.data[d][neighbor]['crisis'].slice(this.t0, this.t1+1).map(v => v[0]+v[1]));
			this.svgMap.selectAll('#' + idify(neighbor))
				.style('fill', this.getColor(crisis));
		})
	}

	restoreDefault() {
		this.geoData.forEach(datum_ => {
			this.svgMap.selectAll('#' + idify(datum_.kommune))
				.style('fill', this.defaultFill(datum_.kommune))
		})
	}

	// Zooming and panning
	zoomed() {
		this.g.attr("transform", d3.event.transform);
	}



	// Utilities
	// ---------

	getColor(value) {
		if (this.scaling == 'linear')
			return this.colorScale(value).hex()
		else if (this.scaling == 'log')
			return this.colorScale(Math.log(value)).hex()
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

	exists(d) {
		return d in this.data
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

	aggregatePlaces(d) {
		if (d != undefined)
			return this.data[d]["_"+d]['crisis'].map(v => v[0] + v[1]);
		else {
			let arr = this.datetime.map(() => 0);
			let places = Object.keys(this.data).sort().filter(d => d[0] != "_");
			Object.keys(this.data).forEach(d => {
				if (d != "_meta") {
					this.data[d]["_"+d]['crisis'].forEach((v, i) => {
						arr[i] += v[0] + v[1];
					});
				}
			})
			return arr;
		}
	}

	linspace(a, b, n) {
		let every = (b - a) / (n - 1),
			range = [];
		for (let i = a; i < b; i += every)
			range.push(i);
		return range.length == n ? range : range.concat(b);
	}
	
	logspace(a, b, n, exponent) {
		exponent = exponent == undefined ? Math.exp(1) : exponent;
		return this.linspace(a, b, n).map(x => Math.pow(exponent, x));
	}
}