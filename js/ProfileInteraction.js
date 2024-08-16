/**----------------------------------------------------------------------------------------------------
 * Profile interaction control.
 *
 * Does the following actions:
 * - Let the user draws a point or line.
 * - Gets the nearby profile features.
 * - Shows the profile popup.
 *
 * European Union Public Licence V. 1.2
 * EUPL © the European Union 2007, 2016
 *
 * Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 */

import DrawInteraction from "ol/interaction/Draw";
import WFS from "ol/format/WFS";
import LineString from "ol/geom/LineString";
import GeoJSON from "ol/format/GeoJSON";
import {Fill, Stroke, Style} from "ol/style";
import {Circle} from "ol/style";
import {dwithin} from "ol/format/filter";

import {ProfilePopup} from "./ProfilePopup";

/**-----------------------------------------------------------------------------
 */
export default class ProfileInteraction extends DrawInteraction {

  app = null;

  profilePopup = null;

  wfs_options = null;

  /**-----------------------------------------------------------------------------
   */
  constructor(options) {

    // Set source.
    options.source = options.layer.getSource();

    // Set style.
    options.style = new Style({
      fill: new Fill({
        color: "rgba(255, 0, 255, 1)"
      }),
      stroke: new Stroke({
        color: "rgba(255, 0, 255, 1)",
        lineDash: [10, 10],
        width: 2
      }),
      image: new Circle({
        radius: 5,
        stroke: new Stroke({
          color: "rgba(255, 0, 255, 1)"
        }),
        fill: new Fill({
          color: "rgba(255, 0, 255, 0.5)"
        })
      })
    })

    super(options);

    this.app = options.app;

    //console.log("#ProfileInteraction.constructor()");

    this.profilePopup = new ProfilePopup(this.app);

    this.src = options.source;

    this.result_layer = options.result_layer;
    this.result_src = options.result_layer.getSource();

    this.wfs_options = options.wfs;
    this.search_distance = options.search_distance;
    this.max_length = options.max_length ? options.max_length : 0
    this.z_field = options.z_field;
    this.z_interval = options.z_interval;
    this.value_fields = options.value_fields;
    this.value_units = options.value_units;
    this.color_table = options.color_table;
    this.div = options.div;
    this.default_plots = options.default_plots ? options.default_plots : [this.value_fields[0]];
    this.plot_order = options.plot_order ? options.plot_order : "td";
    this.button_type = options.button_type ? options.button_type : "checkbox";

    this.on("drawstart", this.onStartDrawing);
    this.on("drawend", this.onFinishDrawing);
  }
  /**-----------------------------------------------------------------------------
   */
  getWFSPayload(options) {
    //As OL doesn't support WFS DWithin we'll hack a payload togethere here.
    //We might improve on this later. Probably this naive approach will work often enough
    //options: contain
    //      geometry: the geometry of the profile
    //      typeNames: WFS typenames
    //      geometry_field: Value Reference for the Dwithin filter
    //      srsName: Name of the spatial reference system to write eg. urn:ogc:def:crs:EPSG::28992
    //      outputFormat: (optional) valid WFS outputFormat eg. "application/json"
    //      search_distance: The distance for the filter

    // 03082020 (Marco Duiker) Sommige Geoserver versies bevatten een bug bij het DWithin filter
    // op de WFS 2.0 interface. Workaround op de 1.0.0 interface.
    let coords = options.geometry.getCoordinates();
    let geom_line;
    if (options.geometry.getType() === "Point") {
      geom_line = '<gml:Point gml:id="P1" srsName="' + options.srsName + '">' +
          '<gml:coordinates>' + coords.join(',') + '</gml:coordinates>' +
          '</gml:Point>';
    } else {
      let coords_string = ""
      let arrayLength = coords.length;
      for (let i = 0; i < arrayLength; i++) {
        coords_string = coords_string + coords[i].toString() + ' ';
      }
      geom_line = '<gml:LineString gml:id="L1" srsName="' + options.srsName + '">' +
          '<gml:coordinates>' + coords_string.trim() + '</gml:coordinates>' +
          +'</gml:LineString>';
    }

    let specs_line = ' service="WFS" version="1.0.0">';
    if (options.outputFormat) {
      specs_line = ' outputFormat="' + options.outputFormat + '" ' + specs_line;
    }
    let query_line = '<wfs:Query typeName="' + options.typeNames + '">';
    let value_reference_line = '<ogc:PropertyName>' + options.geometry_field + '</ogc:PropertyName>';
    let distance_line = '<ogc:Distance units="m">' + options.search_distance + '</ogc:Distance>';

    let payload = '<?xml version="1.0" encoding="UTF-8"?>' + '\n';
    payload += '<wfs:GetFeature xmlns:xlink="https://www.w3.org/1999/xlink" ' +
        'xmlns:gml="https://www.opengis.net/gml" ' +
        'xmlns:ogc="https://www.opengis.net/ogc" ' +
        'xmlns:wfs="https://www.opengis.net/wfs" ' +
        'xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="https://www.opengis.net/wfs https://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd" ';
    payload += specs_line;
    payload += query_line;
    payload += '<ogc:Filter>';
    payload += '<ogc:DWithin>';
    payload += value_reference_line + geom_line + distance_line;
    payload += '</ogc:DWithin>';
    payload += '</ogc:Filter>';
    payload += '</wfs:Query>';
    payload += '</wfs:GetFeature>';
    return payload;
  }
  /**-----------------------------------------------------------------------------
   * Called in: ProfileInteraction.onFinishDrawing()
   */
  getFeatures(options) {
    let self = this;

    console.log("#ProfileInteraction.getFeatures()");

    // Testing?
    if (this.app.config.TEST_USE_JSON_DATA_FILE) {
      console.log("### Using: TEST_USE_JSON_DATA_FILE");
      self.getFeaturesFile(options);
    } else {
      if (this.app.config.useNewProfileDataUrl) {
        self.getFeaturesNew(options);
      } else {
        self.getFeaturesOld(options);
      }
    }
  }
  /**-----------------------------------------------------------------------------
   * Called in: ProfileInteraction.getFeatures()
   */
  getFeaturesFile(options) {
    let self = this;
    let url;

    console.log("#ProfileInteraction.getFeaturesFile()");

    if (options.geometry.getType() === "Point") {
      url = options.url + this.app.config.testPointFile;
    } else {
      url = options.url + this.app.config.testLineFile;
    }

    console.log("Type     : " + options.geometry.getType());
    console.log("Using url: " + url);

    fetch(url,{}).then(function(response) {
      return response.json();
    }).then(function(json) {
      self.processFeatures(options,json);
    }).catch(function(error) {
      console.log("### Error: "+error);
    });
  }
  /**-----------------------------------------------------------------------------
   * Called in: ProfileInteraction.getFeatures()
   */
  getFeaturesNew(options) {
    let self = this;
    let featureOptions,featureRequest,fetchOptions,xml,url;
    let geom,geomFieldName,distance;

    console.log("#ProfileInteraction.getFeaturesNew()");

    featureOptions = {
      srsName: "EPSG:28992",
      featureNS: "freshem",
      featurePrefix: "freshem",
      featureTypes: ["freshem:profielen_v2"],
      outputFormat: "application/json",
    };

    // Set filter.
    geom = options.geometry;
    geomFieldName = options.geometry_field;
    distance = options.search_distance;
    featureOptions.filter = dwithin(geomFieldName,geom,distance,"m");

    featureRequest = new WFS().writeGetFeature(featureOptions);
    xml = new XMLSerializer().serializeToString(featureRequest);

    if (self.app.config.useProfileDataProxy) {
      url = self.app.config.proxyUrl+"location/"+btoa(options.url);
    } else {
      url = options.url;
    }

    console.log("Type     : " + options.geometry.getType());
    console.log("Using url: " + url);

    fetchOptions = {
      method: "POST",
      body: xml,
    }
    fetch(url,fetchOptions).then(function (response) {
      return response.json();
    }).then(function(json) {
      self.processFeatures(options,json);
    }).catch(function(error) {
      console.log("### Error: "+error);
    });
  }
  /**-----------------------------------------------------------------------------
   * Called in: ProfileInteraction.getFeatures()
   */
  getFeaturesOld(options) {
    let self = this;
    let payload,fetchOptions;

    console.log("#ProfileInteraction.getFeaturesOld()");

    // Get custom dwithin filter.
    payload = self.getWFSPayload(options);

    console.log("Type     : " + options.geometry.getType());
    console.log("Using url: " + options.url);
    if (payload !== "") {
      console.log("Payload:");
      console.log(payload);
    }

    fetchOptions =  {
      headers: new Headers({"Content-Type": "application/xml"}),
      method: "POST",
      body: payload
    };
    this.app.mouseStyle("progress");
    fetch(options.url,fetchOptions).then(function(response) {
      return response.json();
    }).then(function(text) {
      self.processFeatures(options,text);
      self.app.mouseStyle("default");
    }).catch(function(error) {
      console.log("### Error: "+error);
    });
  }
  /**-----------------------------------------------------------------------------
   * Stop drawing and create a profile graph.
   * @param {ol/interaction/DrawEvent} e
   * @private
   */
  onFinishDrawing(e) {
    let options;

    console.log("#ProfileInteraction - onFinishDrawing");

    options = this.wfs_options;
    options.evt = e;
    options.search_distance = this.search_distance;
    options.geometry = e.feature.getGeometry();
    options.src = this.src;
    options.result_layer = this.result_layer;
    options.result_src = this.result_src;
    options.z_field = this.z_field;
    options.z_interval = this.z_interval;
    options.value_fields = this.value_fields;
    options.value_units = this.value_units;
    options.default_plots = this.default_plots;
    options.div = this.div;
    options.plot_order = this.plot_order;
    options.button_type = this.button_type;

    if ((this.max_length > 0) && (options.geometry.getLength() > this.max_length)) {
      alert("Deze lijn is te lang. Probeer het nog eens met een kortere lijn.");
      this.src.clear();
      return
    }
    this.getFeatures(options);
  }
  /**-----------------------------------------------------------------------------
   * Clear the last drawing and start drawing.
   * @private
   */
  onStartDrawing() {
    console.log("#ProfileInteraction - onStartDrawing");
    this.src.clear();
    this.result_src.clear();
  }
  /**-----------------------------------------------------------------------------
   * Called in: ProfileInteraction.getFeaturesFile() and ProfileInteraction.getFeaturesWFS().
   */
  processFeatures(options,json) {
    let self = this;
    let features, minDistance, closestFeat, line;
    let i,len;

    console.log("#ProfileInteraction.processFeatures()");

    features = new GeoJSON().readFeatures(json);

    console.log("Nr. of features found: " + features.length);

    // Pointprofile and multiple points found? Look for the closest.
    if (options.geometry.getType() === "Point" && features.length > 1) {
      // We have multiple points, get the closest one.
      // We could have used o.source.vector.getClosestFeatureToCoordinate; but then, we need the source first.
      minDistance = 10000000;
      closestFeat = null;
      for (i = 0, len = features.length; i < len; i++) {
        line = new LineString(options.geometry.getCoordinates(),
            features[i].getGeometry().getCoordinates());
        if (line.getLength() < minDistance) {
          minDistance = line.getLength();
          closestFeat = features[i];
        }
      }
      if (closestFeat) {
        features = [closestFeat];
      }
    }
    // Features found? Add the features to result_src.
    if (features && features.length > 0) {
      options.result_src.addFeatures(features);
      // Show profiles.
      self.profilePopup.showPopup(options);
    } else {
      alert("Geen data gevonden.");
    }
  }
}
