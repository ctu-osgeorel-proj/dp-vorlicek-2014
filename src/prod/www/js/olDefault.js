var map;
var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;
var center;
var zoom;

function mapEdit() {
	center = map.getCenter();
	center.transform(new OpenLayers.Projection("EPSG:900913"),new OpenLayers.Projection("EPSG:4326"));
	zoom = map.getZoom();
	window.location.href = "edit-map#background=Bing&map=16/" + String(center['lon']).substring(0,7) + "/" + String(center['lat']).substring(0,7);
}

function init(params) {
	OpenLayers.ProxyHost = "/cgi-bin/proxy.cgi?url=";
	var host, workspace;
	//nastavení prostředí
	if (window.location.hostname === 'toulavej.loc') {
		host = 'toulavej.loc';
		workspace = "diplomka";
	}
	else if (window.location.hostname === 'geo102.fsv.cvut.cz') {
		host = 'geo102.fsv.cvut.cz';
		workspace = "vorlichr";
	}
	map = new OpenLayers.Map({div: 'map',
		units: "m",
		projection: "EPSG:900913",
		maxResolution: "auto"
	});

	//podkladový mapy
	var osm = new OpenLayers.Layer.OSM('OpenStreetMap');
	map.addLayer(osm);
	map.setCenter([params['lon'], params['lat']], params['zoom']);
//rules
	var blueTrack = new OpenLayers.Rule({
		filter: new OpenLayers.Filter.Comparison({
			type: OpenLayers.Filter.Comparison.EQUAL_TO,
			property: "kct_color",
			value: "kct_blue"
		}),
		symbolizer: {strokeWidth: 2,
			strokeColor: "blue"}
	});
	var greenTrack = new OpenLayers.Rule({
		filter: new OpenLayers.Filter.Comparison({
			type: OpenLayers.Filter.Comparison.EQUAL_TO,
			property: "kct_color",
			value: "kct_green",
		}),
		symbolizer: {strokeWidth: 2,
			strokeColor: "green"}
	});
	var yellowTrack = new OpenLayers.Rule({
		filter: new OpenLayers.Filter.Comparison({
			type: OpenLayers.Filter.Comparison.EQUAL_TO,
			property: "kct_color",
			value: "kct_yellow",
		}),
		symbolizer: {strokeWidth: 3,
			strokeColor: "yellow"}
	});
	var redTrack = new OpenLayers.Rule({
		filter: new OpenLayers.Filter.Comparison({
			type: OpenLayers.Filter.Comparison.EQUAL_TO,
			property: "kct_color",
			value: "kct_red",
		}),
		symbolizer: {strokeWidth: 3,
			strokeColor: "red"}
	});
	var rest = new OpenLayers.Rule({
		filter: new OpenLayers.Filter.Comparison({
			type: OpenLayers.Filter.Comparison.EQUAL_TO,
			property: "kct_color",
			value: "",
		}),
		symbolizer: {strokeWidth: 3,
			strokeColor: "black"}
	});
	var style = new OpenLayers.Style();
	style.addRules([blueTrack, greenTrack, yellowTrack, redTrack, rest]);
	//OSM DATA
	var hikingWFS = new OpenLayers.Layer.Vector("Stezky - WFS", {
		projection: new OpenLayers.Projection("EPSG:900913"),
		strategies: [new OpenLayers.Strategy.BBOX()],
		protocol: new OpenLayers.Protocol.WFS({
			version: "1.1.0",
			url: "http://" + host + ":8080/geoserver/" + workspace + "/wfs",
			featurePrefix: workspace,
			featureType: 'tourist_tracks',
			geometryName: 'way',
			srsName: "EPSG:900913"
		}),
		minScale: 0.000004,
		styleMap: new OpenLayers.StyleMap({
			"default": style,
			"select": new OpenLayers.Style({
				strokeWidth: 5})
		}),
		renderers: renderer
	});
	map.addLayer(hikingWFS);
	var hikingWMS = new OpenLayers.Layer.WMS("Stezky - WMS", "http://localhost:8080/geoserver/" + workspace + "/wms", {
		layers: workspace + ":tourist_tracks",
		format: "image/png",
		isBaseLayer: false,
		transparent: true,
		tiled: true,
		tilesOrigin: map.maxExtent.left + ',' + map.maxExtent.bottom
	},
	{
		maxScale: 0.000004
	});
	map.addLayer(hikingWMS);
	if (host === 'toulavej.loc') {
		var kempyWFS = new OpenLayers.Layer.Vector("Kempy - WFS", {
			projection: new OpenLayers.Projection("EPSG:900913"),
			strategies: [new OpenLayers.Strategy.BBOX()],
			protocol: new OpenLayers.Protocol.WFS({
				version: "1.1.0",
				url: "http://" + host + ":8080/geoserver/" + workspace + "/wfs",
				featurePrefix: workspace,
				featureType: 'kempy',
				geometryName: 'the_geom',
				srsName: "EPSG:900913"
			}),
			renderers: renderer
		});
		map.addLayer(kempyWFS);
		selectControl = new OpenLayers.Control.SelectFeature([kempyWFS, hikingWFS]);
	}
	else {
		selectControl = new OpenLayers.Control.SelectFeature(hikingWFS);
	}

	// Interaction; not needed for initial display.

	map.addControl(selectControl);
	selectControl.activate();
	kempyWFS.events.on({
		'featureselected': onFeatureSelect,
		'featureunselected': onFeatureUnselect
	});
	hikingWFS.events.on({
		'featureselected': onRouteSelect,
		'featureunselected': onFeatureUnselect
	});
	// Přehledka
	var options = {
		numZoomLevels: 1,
		units: "m",
		maxResolution: 'auto',
		singleTile: true,
		autopan: true,
		maximizeTitle: 'Show the overview map',
		minimizeTitle: 'Hide the overview map',
		size: new OpenLayers.Size(300, 200),
		layers: [new OpenLayers.Layer.WMS("OSM-WMS worldwide", "http://129.206.228.72/cached/osm?",
					{
						layers: 'osm_auto:all',
						transparent: false,
						exceptions: '',
						version: "1.3.0",
						format: "image/png",
						service: "WMS",
						request: "GetMap"
					},
			{
				maxExtent: new OpenLayers.Bounds(1300000, 6200000, 2150000, 6700000),
				maxResolution: 'auto',
				projection: "EPSG:900913",
				units: "m",
				singleTile: true
			})]
	};
	overview = new OpenLayers.Control.OverviewMap(options);
	overview.isSuitableOverview = function() {
		return true;
	};
	map.addControl(overview);
	//map.addControl(new OpenLayers.Control.LayerSwitcher()); //layer switcher
	map.addControl(new OpenLayers.Control.MousePosition({displayProjection:"EPSG:4326"})); //mouse position
	map.addControl(new OpenLayers.Control.ScaleLine()); //scaleLine
	map.addControl(new OpenLayers.Control.Scale()); //scale
	map.addControl(new OpenLayers.Control.KeyboardDefaults());
	map.addControl(new OpenLayers.Control.Permalink());
}

function onPopupClose(evt) {
	this.destroy();
}

function onFeatureSelect(evt) {
	feature = evt.feature;
	popup = new OpenLayers.Popup.FramedCloud("featurePopup",
			feature.geometry.getBounds().getCenterLonLat(),
			new OpenLayers.Size(100, 100),
			"<h4>" + feature.attributes.jmeno + "</h4>",
			null, true, onPopupClose);
	feature.popup = popup;
	popup.feature = feature;
	map.addPopup(popup, true);
}

function onFeatureUnselect(evt) {
	feature = evt.feature;
	if (feature.popup) {
		popup.feature = null;
		map.removePopup(feature.popup);
		feature.popup.destroy();
		feature.popup = null;
	}
}

function onRouteSelect(evt) {
	feature = evt.feature;
	var length = parseFloat(Math.round(feature.geometry.getLength()) / 1000).toFixed(2);
	var color;
	if (feature.attributes.kct_color !== null) {
		switch (feature.attributes.kct_color) {
			case "kct_blue":
				color = "Modrá";
				break;
			case "kct_green":
				color = "Zelená";
				break;
			case "kct_red":
				color = "Červená";
				break;
			case "kct_yellow":
				color = "Žlutá";
				break;
			default:
				color = " ";
		}
	} else {
		color = " ";
	}
	var name = feature.attributes.kct_name;
	var destinations = feature.attributes.kct_destinations;
	var text = "";
	if (name != null) {
		text += "<h4>" + name + "</h4>";
	}
	if (destinations != null) {
		text += "Cíle: " + destinations + "<br>";
	}
	text += "Značka: " + color + "<br>";
	text += "Délka: " + length + " km <br>";
	popup = new OpenLayers.Popup.FramedCloud("featurePopup",
			feature.geometry.getBounds().getCenterLonLat(),
			new OpenLayers.Size(100, 100), text, null, true, onPopupClose);
	feature.popup = popup;
	popup.feature = feature;
	map.addPopup(popup, true);
}