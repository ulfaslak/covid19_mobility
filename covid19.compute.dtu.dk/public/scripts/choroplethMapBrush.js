class MovementsMapBrush {

	constructor(data, geoData, uniqueId) {
		// Variables
		this.data = data;
		this.geoData = geoData.filter(d => d.kommune != 'Christiansø');
		this.uniqueId = uniqueId;
		this.datetime = data._meta.datetime;
		this.t0 = this.data._meta.defaults.t - 7;
		this.t1 = this.data._meta.defaults.t;
		this.scaling = 'sqrt';
		this.normidx = 0;
		// this.maxFlow = data._meta.variables.Max // we sum in and out
		this.maxFlow = this.recomputeMaxFlow();

		// define div dimensions
		this.width = 770;
		this.mapHeight = 630;
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
		this.colorScale = chroma.scale(['#ffffff', '#74b9ff', '#000000'])
		this.colorDomain = [0, Math.sqrt(this.maxFlow)];
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
		).on("dblclick.zoom", null);

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

		let diff = this.mapHeight - this.width

		// Set scaling according to aspect
		if (mapWidth < mapHeight) {
			this.xScaler = d3.scaleLinear().domain([maxY, minY]).range([0, this.mapHeight]);
			this.yScaler = d3.scaleLinear().domain([maxY, minY]).range([this.mapHeight, 0]);
		} else {
			this.xScaler = d3.scaleLinear().domain([minX, maxX]).range([this.width, 0]);
			this.yScaler = d3.scaleLinear().domain([minX, maxX]).range([diff, this.width+diff]);
		}
	}

	setKeyEvents() {
		let resetMap = () => {
			this.selected = undefined;
			this.unhighlightAllRegions();

			this.maxFlow = this.data._meta.variables.Max;
			this.maxFlow = this.recomputeMaxFlow();
			this.setScaling(this.scaling);

			this.refreshDrawing();
			this.redrawBrushLine();
			this.updateInfoBox();
			this.setLegend();

			if (this.hovering != undefined) {
				this.tooltipDefault(this.hovering)
				this.highlightRegion(this.namePolygonMap[this.hovering], '#ff7f50')
			}
		}
		document.onkeydown = evt => {
			evt = evt || window.event;
			if (evt.key === "Escape" || evt.key === "Esc")
				resetMap();
			// else if (evt.key === "Shift" && this.selected != undefined) {
			else if (evt.key === "Shift") {
				if (this.scaling == "lin")
					this.setScaling('sqrt');
				else if (this.scaling == "sqrt")
					this.setScaling("log");
				else if (this.scaling == "log")
					this.setScaling("lin");
				this.refreshDrawing();
				this.setLegend();
			}
		};

		this.svgMap.on('click', () => {
			if (d3.event.target.tagName == 'svg' && this.selected !== undefined)
				resetMap();
		})
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

		let legendTitle = this.data._meta.variables.legend_label_count;
		let legendRange;
		if (this.scaling == 'lin')
			legendRange = this.linspace(0, this.maxFlow, this.n_steps);
		else if (this.scaling == 'sqrt')
			legendRange = this.sqrtspace(0, Math.sqrt(this.maxFlow), this.n_steps);
		else if (this.scaling == "log")
			legendRange = this.logspace(Math.log(1), Math.log(this.maxFlow+1), this.n_steps);

		// Title text
		let offy = 20;
		this.svgMap.append('text')
			.attr('class', 'legend-component')
			.attr('x', this.width-120)
			.attr('y', offy)
			.attr('font-weight', 700)
			.text(legendTitle)
		this.svgMap.append('text')
			.attr('class', 'legend-component')
			.attr('x', this.width-120)
			.attr('y', 20 + offy)
			.attr('font-weight', 700)
			.text(() => {
				if (this.normidx == 0)
					return 'counted'
				else if (this.normidx == 1)
					return 'per capita'
				else if (this.normidx == 2)
					return 'per square km'
			})

		// Scaling buttons
		offy = 52;
		this.svgMap.append('text')
			.attr('class', 'legend-component')
			.attr('x', this.width-120)
			.attr('y', 13 + offy)
			.attr('font-style', 'italic')
			.attr('font-size', 14)
			.text('scale:')

		this.svgMap.append('text')
			.attr('class', 'legend-component')
			.attr('x', this.width-79)
			.attr('y', 13 + offy)
			.attr('font-style', 'italic')
			.attr('font-size', 14)
			.text('lin')

		this.svgMap.append('rect')
			.attr('class', 'legend-component')
			.attr('id', 'lin-text-box')
			.attr('x', this.width-81)
			.attr('y', offy)
			.attr('width', 19)
			.attr('height', 18)
			.attr('stroke', this.scaling == 'lin' ? 'black' : 'grey')
			.attr('fill', 'white')
			.attr('fill-opacity', this.scaling == 'lin' ? 0 : 0.5)
			.on('mouseover', () => {
				if (this.scaling != 'lin') {
					this.svgMap.select('#lin-text-box')
						.attr('stroke', 'black')
						.attr('fill-opacity', 0);
				}

			})
			.on('mouseout', () => {
				if (this.scaling != 'lin') {
					this.svgMap.select('#lin-text-box')
						.attr('stroke', 'grey')
						.attr('fill-opacity', 0.5);
				}
			})
			.on('click', () => {
				if (this.scaling != 'lin') {
					this.setScaling('lin');
					this.refreshDrawing();
					this.setLegend();
				}
			})

		this.svgMap.append('text')
			.attr('class', 'legend-component')
			.attr('x', this.width-57)
			.attr('y', 13 + offy)
			.attr('font-style', 'italic')
			.attr('font-size', 14)
			.text('sqrt')

		this.svgMap.append('rect')
			.attr('class', 'legend-component')
			.attr('id', 'sqrt-text-box')
			.attr('x', this.width-59)
			.attr('y', offy)
			.attr('width', 30)
			.attr('height', 18)
			.attr('stroke', this.scaling == 'sqrt' ? 'black' : 'grey')
			.attr('fill', 'white')
			.attr('fill-opacity', this.scaling == 'sqrt' ? 0 : 0.5)
			.on('mouseover', () => {
				if (this.scaling != 'sqrt') {
					this.svgMap.select('#sqrt-text-box')
						.attr('stroke', 'black')
						.attr('fill-opacity', 0);
				}

			})
			.on('mouseout', () => {
				if (this.scaling != 'sqrt') {
					this.svgMap.select('#sqrt-text-box')
						.attr('stroke', 'grey')
						.attr('fill-opacity', 0.5);
				}
			})
			.on('click', () => {
				if (this.scaling != 'sqrt') {
					this.setScaling('sqrt');
					this.refreshDrawing();
					this.setLegend();
				}
			})

		this.svgMap.append('text')
			.attr('class', 'legend-component')
			.attr('x', this.width-24)
			.attr('y', 13 + offy)
			.attr('font-style', 'italic')
			.attr('font-size', 14)
			.text('log')

		this.svgMap.append('rect')
			.attr('class', 'legend-component')
			.attr('id', 'log-text-box')
			.attr('x', this.width-26)
			.attr('y', offy)
			.attr('width', 23)
			.attr('height', 18)
			.attr('stroke', this.scaling == 'log' ? 'black' : 'grey')
			.attr('fill', 'white')
			.attr('fill-opacity', this.scaling == 'log' ? 0 : 0.5)
			.on('mouseover', () => {
				if (this.scaling != 'log') {
					this.svgMap.select('#log-text-box')
						.attr('stroke', 'black')
						.attr('fill-opacity', 0);
				}
			})
			.on('mouseout', () => {
				if (this.scaling != 'log') {
					this.svgMap.select('#log-text-box')
						.attr('stroke', 'grey')
						.attr('fill-opacity', 0.5);
				}
			})
			.on('click', () => {
				if (this.scaling != 'log') {
					this.setScaling('log');
					this.refreshDrawing();
					this.setLegend();
				}
			})

		// Norm buttons
		offy = 73;
		this.svgMap.append('text')
			.attr('class', 'legend-component')
			.attr('x', this.width-120)
			.attr('y', 13 + offy)
			.attr('font-style', 'italic')
			.attr('font-size', 14)
			.text('norm:')

		this.svgMap.append('text')
			.attr('class', 'legend-component')
			.attr('x', this.width-79)
			.attr('y', 13 + offy)
			.attr('font-style', 'italic')
			.attr('font-size', 14)
			.text('no')

		this.svgMap.append('rect')
			.attr('class', 'legend-component')
			.attr('id', 'none-text-box')
			.attr('x', this.width-81)
			.attr('y', offy)
			.attr('width', 19)
			.attr('height', 18)
			.attr('stroke', this.normidx == 0 ? 'black' : 'grey')
			.attr('fill', 'white')
			.attr('fill-opacity', this.normidx == 0 ? 0 : 0.5)
			.on('mouseover', () => {
				if (this.normidx != 0) {
					this.svgMap.select('#none-text-box')
						.attr('stroke', 'black')
						.attr('fill-opacity', 0);
				}
			})
			.on('mouseout', () => {
				if (this.normidx != 0) {
					this.svgMap.select('#none-text-box')
						.attr('stroke', 'grey')
						.attr('fill-opacity', 0.5);
				}
			})
			.on('click', () => {
				if (this.idx != 0) {
					this.normidx = 0;
					this.maxFlow = this.recomputeMaxFlow(this.selected);
					this.setScaling(this.scaling);
					this.refreshDrawing();
					this.setLegend();
					this.updateInfoBox();
				}
			})


		this.svgMap.append('text')
			.attr('class', 'legend-component')
			.attr('x', this.width-57)
			.attr('y', 13 + offy)
			.attr('font-style', 'italic')
			.attr('font-size', 14)
			.text('pop')

		this.svgMap.append('rect')
			.attr('class', 'legend-component')
			.attr('id', 'pop-text-box')
			.attr('x', this.width-59)
			.attr('y', offy)
			.attr('width', 27)
			.attr('height', 18)
			.attr('stroke', this.normidx == 1 ? 'black' : 'grey')
			.attr('fill', 'white')
			.attr('fill-opacity', this.normidx == 1 ? 0 : 0.5)
			.on('mouseover', () => {
				if (this.normidx != 1) {
					this.svgMap.select('#pop-text-box')
						.attr('stroke', 'black')
						.attr('fill-opacity', 0);
				}
			})
			.on('mouseout', () => {
				if (this.normidx != 1) {
					this.svgMap.select('#pop-text-box')
						.attr('stroke', 'grey')
						.attr('fill-opacity', 0.5);
				}
			})
			.on('click', () => {
				if (this.idx != 1) {
					this.normidx = 1;
					this.maxFlow = this.recomputeMaxFlow(this.selected);
					this.setScaling(this.scaling);
					this.refreshDrawing();
					this.setLegend();
					this.updateInfoBox();
				}
			})

		this.svgMap.append('text')
			.attr('class', 'legend-component')
			.attr('x', this.width-28)
			.attr('y', 13 + offy)
			.attr('font-style', 'italic')
			.attr('font-size', 14)
			.text('area')

		this.svgMap.append('rect')
			.attr('class', 'legend-component')
			.attr('id', 'area-text-box')
			.attr('x', this.width-29)
			.attr('y', offy)
			.attr('width', 28.5)
			.attr('height', 18)
			.attr('stroke', this.normidx == 2 ? 'black' : 'grey')
			.attr('fill', 'white')
			.attr('fill-opacity', this.normidx == 2 ? 0 : 0.5)
			.on('mouseover', () => {
				if (this.normidx != 1) {
					this.svgMap.select('#area-text-box')
						.attr('stroke', 'black')
						.attr('fill-opacity', 0);
				}
			})
			.on('mouseout', () => {
				if (this.normidx != 2) {
					this.svgMap.select('#area-text-box')
						.attr('stroke', 'grey')
						.attr('fill-opacity', 0.5);
				}
			})
			.on('click', () => {
				if (this.idx != 2) {
					this.normidx = 2;
					this.maxFlow = this.recomputeMaxFlow(this.selected);
					this.setScaling(this.scaling);
					this.refreshDrawing();
					this.setLegend();
					this.updateInfoBox();
				}
			})


		// Rects and labels
		offy = 100;
		legendRange.forEach((i, idx) => {

			// Rects
			this.svgMap.append('rect')
				.attr('class', 'legend-component')
				.attr('x', this.width-120)
				.attr('y', idx * 23 + offy)
				.attr('width', 15)
				.attr('height', 15)
				.attr('fill', () => {
					return this.getColor(i);
				})
				.attr('stroke', i == 0 ? '#dddddd' : null)

			// labels
			this.svgMap.append('text')
				.attr('class', 'legend-component')
				.attr('x', this.width-95)
				.attr('y', idx * 23 + 12.5 + offy)
				.attr('font-size', 13)
				.text(() => this.formatValue(i))
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

		this.svgBrush.append("line")
			.attr('x1', xi(107))
			.attr('x2', xi(107))
			.attr('y1', this.margin.top)
			.attr('y2', figheight)
			.attr('class', 'line-baseline')

		this.svgBrush.append('text')
			.attr('x', xi(107) - 4)
			.attr('y', 20)
			.attr('text-anchor', 'end')
			.attr('font-size', 11)
			.style('stroke', '#999999')
			.html('Cafes, schools reopen')

		this.svgBrush.append("line")
			.attr('x1', xi(116))
			.attr('x2', xi(116))
			.attr('y1', this.margin.top)
			.attr('y2', figheight)
			.attr('class', 'line-baseline')

		this.svgBrush.append('text')
			.attr('x', xi(116) + 4)
			.attr('y', 10)
			.attr('text-anchor', 'start')
			.attr('font-size', 11)
			.style('stroke', '#999999')
			.html('Almost everything reopens')

		this.svgBrush.append("line")
			.attr('x1', xi(178))
			.attr('x2', xi(178))
			.attr('y1', this.margin.top)
			.attr('y2', figheight)
			.attr('class', 'line-baseline')

		this.svgBrush.append('text')
			.attr('x', xi(178) - 4)
			.attr('y', 75)
			.attr('text-anchor', 'end')
			.attr('font-size', 11)
			.style('stroke', '#999999')
			.html('New outbreaks')
			
		this.svgBrush.append("line")
			.attr('x1', xi(310))
			.attr('x2', xi(310))
			.attr('y1', this.margin.top)
			.attr('y2', figheight)
			.attr('class', 'line-baseline')

		this.svgBrush.append('text')
			.attr('x', xi(310) - 4)
			.attr('y', 75)
			.attr('text-anchor', 'end')
			.attr('font-size', 11)
			.style('stroke', '#999999')
			.html('Second Lockdown')
			
		this.svgBrush.append("line")
			.attr('x1', xi(338)+1)
			.attr('x2', xi(338)+1)
			.attr('y1', this.margin.top)
			.attr('y2', figheight)
			.attr('class', 'line-baseline')

		this.svgBrush.append('text')
			.attr('x', xi(338) + 1 - 4)
			.attr('y', 20)
			.attr('text-anchor', 'end')
			.attr('font-size', 11)
			.style('stroke', '#999999')
			.html('More restrictions')
			

		// Draw axis
		this.svgBrush.append("g")	
			.attr("class", "x axis")
			.attr("transform", "translate(0," + figheight + ")")
			.call(xAxis);

		// Add brush
		let brush = d3.brushX()
			.extent([[this.margin.left, this.margin.top], [figwidth, figheight]]);

		// Set brush initial position
		let gBrush = this.svgBrush.append("g")
			.call(brush)
			.call(brush.move, [xi(this.t0), xi(this.t1)]);

		// Define on move function (done after setting position, otherwise things mess up
		// because stuff called by function is not defined yet)
		brush.on("start brush", () => {
			let d = d3.event.selection.map(xi.invert);
			this.t0 = parseInt(d[0]);
			this.t1 = parseInt(d[1]);
			this.refreshDrawing();
			this.updateInfoBox();
		})
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
			.attr('x', this.width-5)
			.attr('y', this.mapHeight-15)
			.attr('text-anchor', 'end')
			.style('font-weight', 700)
			.text(`${this.formatDate(this.parseDate(this.datetime[this.t0]))} — ${this.formatDate(this.parseDate(this.datetime[this.t1]))}`);

		this.selectedLocationText = this.svgMap.append('text')
			.attr('x', 10)
			.attr('y', this.mapHeight-15)
			.style('font-weight', 700)
			.text(() => {
				let crisis = d3.mean(this.values.slice(this.t0, this.t1+1))
				crisis /= kommunePopAgg[this.normidx];
				let normtext = "";
				if (this.normidx == 1)
					normtext = "per capita";
				if (this.normidx == 2)
					normtext = "per square km";
				return 'Denmark: ' + this.formatInfoBoxValue(crisis) + " trips " + normtext + " per day";
			});
	}

	updateInfoBox() {
		this.selectedTimeText
			.text(`${this.formatDate(this.parseDate(this.datetime[this.t0]))} — ${this.formatDate(this.parseDate(this.datetime[this.t1]))}`);

		this.selectedLocationText
			.text(() => {
				let normtext = "";
				if (this.normidx == 1)
					normtext = "per capita";
				if (this.normidx == 2)
					normtext = "per square km";

				if (typeof this.selected == 'undefined') {
					let crisis = d3.mean(this.values.slice(this.t0, this.t1+1));
					crisis /= kommunePopAgg[this.normidx];
					return 'Denmark: ' + this.formatInfoBoxValue(crisis) + " trips " + normtext + " per day";
				}
				else {
					let d = this.selected;
					let crisis = d3.mean(this.data[d]["_" + d].slice(this.t0, this.t1+1));
					crisis /= kommunePop[d][this.normidx];
					return this.selected + ": " + this.formatInfoBoxValue(crisis) + " trips " + normtext + " per day";
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
							this.highlightRegion(datum.polygons, '#ff7f50');
						} else {
							if (datum.kommune != this.selected)
								this.highlightRegion(datum.polygons, '#ff7f50');
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
					if (this.selected != datum.kommune) {
						this.maxFlow = this.recomputeMaxFlow(datum.kommune);
						this.setScaling(this.scaling);
					}
					else {
						this.maxFlow = this.data._meta.variables.Max;
						if (this.normidx != 0)
							this.maxFlow = this.recomputeMaxFlow();
						this.setScaling(this.scaling);
					}

					if (dataExists) {
						this.unhighlightAllRegions();
						this.highlightRegion(datum.polygons, '#ff7f50');

						if (this.selected === undefined) {
							this.selected = datum.kommune;
							this.tooltipSelected(this.selected);
						} else {
							if (datum.kommune == this.selected) {
								this.selected = undefined;
								this.tooltipDefault(datum.kommune);
							} else {
								this.selected = datum.kommune;
								this.tooltipSelected(datum.kommune);
							}
						}
					}

					this.refreshDrawing();
					this.redrawBrushLine();
					this.updateInfoBox();
					this.setLegend();
				});
		}

		if (this.selected != undefined) {
			this.recolorRegions(this.selected);
			this.highlightRegion(this.namePolygonMap[this.selected], '#ff7f50');
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
		let crisis = d3.mean(this.data[d]["_" + d].slice(this.t0, this.t1+1));

		let tooltiptext = "";
		tooltiptext += "<b>" + d + "</b><br><br>";
		tooltiptext += "<b>" + this.formatInfoBoxValue(crisis) + "</b> trips in total<br>";
		tooltiptext += "<b>" + this.formatInfoBoxValue(crisis / kommunePop[d][1]) + "</b> trips per capita<br>";
		tooltiptext += "<b>" + this.formatInfoBoxValue(crisis / kommunePop[d][2]) + "</b> trips per square km";

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
		let crisis = 0
		if (d in this.data[this.selected] && this.t0 < this.data[this.selected][d].length) {
			crisis = d3.mean(this.data[this.selected][d].slice(this.t0, this.t1+1));
		}

		let tooltiptext = "";
		if (this.selected == this.hovering)
			tooltiptext += "Within <b>" + this.selected + "</b><br><br>";
		else
			tooltiptext += "Between <b>" + this.selected + "</b> and <b>" + this.hovering + "</b><br><br>";
		tooltiptext += "<b>" + this.formatInfoBoxValue(crisis) + "</b> trips in total<br>";
		tooltiptext += "<b>" + this.formatInfoBoxValue(crisis / kommunePop[d][1]) + "</b> trips per capita<br>";

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
			let crisis = d3.mean(this.data[d]["_" + d].slice(this.t0, this.t1+1));
			crisis /= kommunePop[d][this.normidx];
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
			.style('fill', this.colorScale(0))

		// Color each kommune by their flow into `d`
		Object.keys(this.data[d]).forEach(neighbor => {
			let crisis = d3.mean(this.data[d][neighbor].slice(this.t0, this.t1+1));
			crisis /= kommunePop[d][this.normidx];
			if (crisis > 0) {
				this.svgMap.selectAll('#' + idify(neighbor))
					.style('fill', this.getColor(crisis));
			}
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

	setScaling(scaling) {
		this.scaling = scaling;
		if (scaling == "lin")
			this.colorDomain = [0,this.maxFlow];
		else if (scaling == 'sqrt')
			this.colorDomain = [0, Math.sqrt(this.maxFlow)];
		else if (scaling == "log")
			this.colorDomain = [0, Math.log(this.maxFlow+1)];
		this.colorScale.domain(this.colorDomain);
	}

	refreshDrawing() {
		if (this.selected === undefined)
			this.restoreDefault();
		else
			this.recolorRegions(this.selected);
	}



	// Utilities
	// ---------

	getColor(value) {
		if (this.scaling == 'lin')
			return this.colorScale(value).hex()
		else if (this.scaling == 'sqrt')
			return this.colorScale(Math.sqrt(value)).hex()
		else if (this.scaling == "log")
			return this.colorScale(Math.log(value+1)).hex()
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
		let c = 2 * Math.atan2(Math.log(a), Math.log(1 - a));

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
		let arr;
		if (d != undefined) {
			arr = this.data[d]["_"+d];
			// arr = arr.map(v => v / kommunePop[d][this.normidx]);
		}
		else {
			arr = this.datetime.map(() => 0);
			Object.keys(this.data).forEach(d => {
				if (d != "_meta") {
					this.data[d]["_"+d].forEach((v, i) => {
						arr[i] += v / 2;
					});
				}
			})
			// arr = arr.map(v => v / kommunePopAgg[this.normidx]);
		}
		return arr;
	}

	placeMax(d) {
		let max = 0
		Object.keys(this.data[d]).forEach(n => {
			if (n != "_" + d && n != d)
				max = Math.max(max, d3.max(this.data[d][n]));
		})
		max /= kommunePop[d][this.normidx];
		return max;
	}

	recomputeMaxFlow(d) {
		if (d == undefined) {
			return d3.max(
				this.geoData.map(d => {
					let max = d3.max(this.data[d.kommune]["_"+d.kommune]);
					max /= kommunePop[d.kommune][this.normidx];
					return max;
				})
			);
		} else {
			return this.placeMax(d);
		}
	}

	formatValue(i) {
		if (i < 1e-1)
			return round(i, 1e4);
		else if (i < 1e-1)
			return round(i, 1e3);
		else if (i < 1e0)
			return round(i, 1e2);
		else if (i < 1e1)
			return round(i, 1e1);
		else if (i < 1e2)
			return round(i, 1e0);
		else if (i < 1e3)
			return round(i, 1e-1);
		else if (i < 1e4)
			return round(i / 1e3, 1e1) + "K";
		else if (i < 1e5)
			return round(i / 1e3, 1e0) + "K";
		else if (i < 1e6)
			return round(i / 1e3, 1e-1) + "K";
		else if (i < 1e7)
			return round(i / 1e6, 1e1) + "M";
		else if (i < 1e8)
			return round(i / 1e6, 1e0) + "M";
		else if (i < 1e9)
			return round(i / 1e6, 1e-1) + "M";
		else if (i < 1e10)
			return round(i / 1e9, 1e1) + "B";
		else if (i < 1e11)
			return round(i / 1e9, 1e0) + "B";
		else if (i < 1e12)
			return round(i / 1e9, 1e-1) + "B";
		else if (i < 1e13)
			return round(i / 1e12, 1e1) + "T";
		else if (i < 1e14)
			return round(i / 1e12, 1e0) + "T";
		else
			return round(i / 1e12, 1e-1) + "T";
	}

	formatInfoBoxValue(i) {
		if (i < 1e-2)
			return round(i, 1e4);
		else if (i < 1e-1)
			return round(i, 1e3);
		else if (i < 1e0)
			return round(i, 1e2);
		else if (i < 1e1)
			return round(i, 1e1);
		else if (i < 1e2)
			return round(i, 1e0);
		else
			return insertKSeperators(parseInt(i));
	}

	linspace(a, b, n) {
		let every = (b - a) / (n - 1),
			range = [];
		for (let i = a; i < b; i += every)
			range.push(i);
		return range.length == n ? range : range.concat(b);
	}
	
	logspace(a, b, n, exponent) {
		return this.linspace(a, b, n).map(x => Math.pow(Math.exp(1), x));
	}

	sqrtspace(a, b, n, exponent) {
		return this.linspace(a, b, n).map(x => Math.pow(x, 2));
	}
}
