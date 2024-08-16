/**----------------------------------------------------------------------------------------------------
 * The main App.
 *
 * European Union Public Licence V. 1.2
 * EUPL © the European Union 2007, 2016
 *
 * First version of this App, Marco Duiker, OpenGeoGroep
 *
 * Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 *           - Redesign and new functionality added.
 */

import "../node_modules/@fortawesome/fontawesome-free/css/solid.css";          // For the font files.
import "../node_modules/@fortawesome/fontawesome-free/css/fontawesome.css";    //For the icons.
import "../node_modules/ol/ol.css";
import "../node_modules/jquery-ui/dist/themes/base/jquery-ui.min.css";
import "../node_modules/ol-ext/dist/ol-ext.min.css";
import "../node_modules/magnify/dist/css/magnify.css";

import "../css/App.css";

import {Circle as CircleStyle, Fill, Stroke, Style} from "../node_modules/ol/style";
import Control from "ol/control/Control";
import {defaults as controlDefaults} from "../node_modules/ol/control/defaults";
import LayerGroup from "../node_modules/ol/layer/Group";
import Map from "../node_modules/ol/Map.js";
import Overlay from "../node_modules/ol/Overlay";
import Projection from "../node_modules/ol/proj/Projection";
import ScaleLine from "../node_modules/ol/control/ScaleLine";
import Select from "../node_modules/ol/interaction/Select";
import TileGrid from "../node_modules/ol/tilegrid/TileGrid";
import TileLayer from "../node_modules/ol/layer/Tile";
import TileWMS from "../node_modules/ol/source/TileWMS";
import Toggle from "ol-ext/control/Toggle";
import VectorSource from "../node_modules/ol/source/Vector";
import VectorLayer from "../node_modules/ol/layer/Vector";
import View from "../node_modules/ol/View";
import Bar from "ol-ext/control/Bar";

import "./ImportJQuery";
import "jquery-ui/dist/jquery-ui.min";
import "magnify";
import {createFeatureLine,createFeaturePoint} from "./OLUtils";
import {disableConsoleLog} from "./Utils";
import olLayerSwitcherExt from "./LayerSwitcherExt";
import ProfileInteraction from "./ProfileInteraction";
import Progress from "./Progress";

/**-----------------------------------------------------------------------------
 */
export default class App {

  config = null;

  progress = null;

  app = null;

  // Used in featureInfoGet().
  featureInfoRequest = false;

  // Layer groups.
  layerGroupBase = null;
  layerGroupFreshem = null;
  layerGroupExtra = null;

  view = null;
  map = null;
  overlay = null;

  geocoderPopupContent = null;
  geocoderOverlay = null;

  showSuitExtraction = false;

  profileLayerVector = null;
  profileLayerResult = null;

  // Toolbar controls.
  controlFeatureInfo = null;
  controlPointProfile = null;
  controlLineProfile = null;

  // Map controls.
  controlHighlight = null;
  controlLayerSwitcher = null;

  // Color and fill table for classification.
  colorTable = null;
  fillTable = null;

  /**-----------------------------------------------------------------------------
   */
  constructor(app) {

    this.app = app;

    // Get the global config.
    this.config = window.config;

    // Set the app version.
    $(".map-version").html(this.config.VERSION);

    // Disable logging.
    if (!this.config.TEST_LOG_ON) {
      disableConsoleLog();
    }

    // Set the showSuitExtraction flag.
    this.showSuitExtraction = this.config.showSuitExtraction;

    this.init();
  }
  /**-----------------------------------------------------------------------------
   */
  async onLoad() {
    let self = window.app;   // Needed!
    let elt,delay,timer;

    //console.log("#App.onLoad");

    $(function () {
      $("#gp_container").draggable();
      $("#fl_container").draggable();
      $("#chartpopup").draggable({cancel: "#chartcontainer"});
    });

    delay = (() => {
      timer = 0;
      return function (callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
      };
    })();

    self.popupContent = document.getElementById("popup-content");

    elt = document.getElementById("ol3_search_form_lookup");
    elt.addEventListener("keyup", function () {
      delay(function () {
        self.onGeocoderAutoComplete();
      }, 500);
    });

    // For testing.
    if (self.config.TEST_ACTIVATE_CONTROL_AT_STARTUP) {
      self.activateControl();
    }
    // For testing.
    if (self.config.TEST_RUN_AT_STARTUP) {
      await self.testRunAtStartup();
    }
  }
  /**-----------------------------------------------------------------------------
   */
  activateControl() {
    let geomType,control;

    console.log("#App.activateControl");

    geomType = this.config.testGeomType;
    if (geomType === "Point") {
      control = this.controlPointProfile;
    } else {
      control = this.controlLineProfile;
    }
    control.toggle();
  }
  /**-----------------------------------------------------------------------------
   */
  createControlFeatureInfo() {
    return new Toggle({
      html: '<i class="fa fa-location-dot"></i>',
      className: "select",
      title: "Informatie",
      active: true,
    });
  }
  /**-----------------------------------------------------------------------------
   */
  createControlLineProfile(app) {
    return new Toggle({
      html: "<i class='fa fa-ellipsis-h'></i>",
      className: "line_profile",
      title: "Lijn profiel",
      interaction: new ProfileInteraction({
        app: app,
        type: "LineString",
        layer: this.profileLayerVector,
        result_layer: this.profileLayerResult,
        wfs: {
          url: this.config.profileDataWfsUrl,
          typeNames: "freshem:profielen",
          geometry_field: "wkb_geometry",
          srsName: "urn:ogc:def:crs:EPSG::28992",
          outputFormat: "application/json"
        },
        z_field: "z",
        z_interval: 0.5,
        value_fields: ["chloride_laag", "chloride_midden", "chloride_hoog"],
        value_units: ["mg/L", "mg/L", "mg/L"],
        default_plots: ["chloride_midden"],
        div: "gp_container",
        button_type: "radio",
        search_distance: 25,
        max_length: 10000
      }),
    });
  }
  /**-----------------------------------------------------------------------------
   */
  createControlPointProfile(app) {
    return new Toggle({
      html: "<i class='fa fa-sort-amount-asc'></i>",
      className: "point_profile",
      title: "Punt profiel",
      interaction: new ProfileInteraction({
        app: app,
        type: "Point",
        layer: this.profileLayerVector,
        result_layer: this.profileLayerResult,
        wfs: {
          url: this.config.profileDataWfsUrl,
          typeNames: "freshem:profielen",
          geometry_field: "wkb_geometry",
          srsName: "urn:ogc:def:crs:EPSG::28992",
          outputFormat: "application/json"
        },
        z_field: "z",
        z_interval: 0.5,
        value_fields: ["chloride_laag", "chloride_midden", "chloride_hoog"],
        value_units: ["mg/L", "mg/L", "mg/L"],
        default_plots: ["chloride_midden"],
        div: "gp_container",
        button_type: "checkbox",
        search_distance: 35.36
      }),
    });
  }
  /**-----------------------------------------------------------------------------
   * Create base layers group.
   * @param proj
   */
  createLayerGroupBase(proj) {
    let source, layer, layers;
    let layerGroup;

    layers = [];

    // Topografische kaart (grijstinten).
    // noinspection JSCheckFunctionSignatures
    source = new TileWMS({
      url: "https://s.map5.nl/map/prze.zu1952/service",
      projection: proj,
      params: {"LAYERS": "map5topo_gray", "version": "1.3.0",}
    });
    // noinspection JSCheckFunctionSignatures
    layer = new TileLayer({
      title: "Topografische kaart (grijstinten)",
      baseLayer: true,
      visible: false,
      projection: proj,
      hide_opacity: true,
      source: source,
      fid: "map5topo_grey"
    });
    layers.push(layer);

    // Topografische kaart.
    source = new TileWMS({
      url: "https://s.map5.nl/map/prze.zu1952/service",
      projection: proj,
      params: {"LAYERS": "map5topo", "version": "1.3.0",}
    });
    // noinspection JSCheckFunctionSignatures
    layer = new TileLayer({
      title: "Topografische kaart",
      baseLayer: true,
      visible: true,
      projection: proj,
      hide_opacity: true,
      source: source,
      fid: "map5topo"
    });
    layers.push(layer);

    // noinspection JSCheckFunctionSignatures
    layerGroup = new LayerGroup({
      fid: "ondergronden",
      layers: layers,
      openInLayerSwitcher: false,
      title: "Ondergronden",
    });

    return layerGroup;
  }
  /**-----------------------------------------------------------------------------
   * Create extra layers group.
   * @param extent
   * @param origin
   */
  createLayerGroupExtra(extent, origin) {
    let url, source, layer, layers;
    let layerNames,layerNamesLong, layerTitle, layerGroup;

    layers = [];

    // Waterschaps Lagen
    //
    // https://geo.scheldestromen.nl/arcgis/services/Extern/EXT_JZ_Grondwaterbeheer/MapServer/WMSServer?Service=WMS&request=GetCapabilities
    // 0 = Bevoegd gezag
    // 1 = Zoute kwel
    // 2 = Kwetsbare gebieden
    // 3 = Grondwaterbeschermingsgebieden
    // 4 = Zoetwatervoorkomens
    // 5 = Infiltraties
    // 6 = Grondwateronttrekkingen
    url = "https://geo.scheldestromen.nl/arcgis/services/Extern/EXT_JZ_Grondwaterbeheer/MapServer/WMSServer?";
    layerNames = [
      "Zoute_kwel40833", "Kwetsbare_gebieden43220", "Grondwaterbeschermingsgebieden",
      "Zoetwatervoorkomens", "Infiltraties", "Grondwateronttrekkingen"
    ];
    layerNamesLong = [
      "Zoute_kwel", "Kwetsbare_gebieden_2019", "Grondwater_Beschermingsgebied",
      "Zoetwatervoorkomens", "Infiltraties", "Grondwater_Onttrekkingen"
    ];
    for (let i = 0, len = layerNames.length; i < len; i++) {
      source = new TileWMS({
        url: url,
        crossOrigin: "anonymous",
        params: {
          "VERSION": "1.1.0",
          "LAYERS": layerNames[i]
        }
      });
      // Set title.
      layerTitle = layerNamesLong[i];
      if (layerTitle === "Grondwater_Beschermingsgebied") {
        layerTitle = "Grondwaterbeschermingsgebied";
      } else if (layerTitle === "Grondwater_Onttrekkingen") {
        layerTitle = "Grondwateronttrekkingen";
      }
      // noinspection JSCheckFunctionSignatures
      layer = new TileLayer({
        title: layerTitle.replace(/_/g, " "),
        fid: layerNames[i],
        extent: extent,
        source: source,
        hide_opacity: true,
        visible: false,
        baseLayer: false,
        displayInLayerSwitcher: true,
        allwaysOnTop: false
      });
      layers.push(layer);
    }

    // Kadastrale percelen
    source = new TileWMS({
      url: "https://opengeodata.zeeland.nl/geoserver/zeeland/wms?",
      params: {
        "TILED": true,
        tilesorigin: origin,
        "VERSION": "1.1.0",
        "LAYERS": "zeeland:georok_brkvlk"
      }
    });
    // noinspection JSCheckFunctionSignatures
    layer = new TileLayer({
      title: "Kadastrale percelen",
      fid: "kadastrale_percelen",
      extent: extent,
      source: source,
      hide_opacity: true,
      visible: false,
      baseLayer: false,
      displayInLayerSwitcher: true,
      allwaysOnTop: false
    });
    layers.push(layer);

    // Grondwateraanvulling
    source = new TileWMS({
      url: "https://opengeodata.zeeland.nl/geoserver/water/wms?",
      params: {
        "TILED": true,
        tilesorigin: origin,
        "VERSION": "1.1.0",
        "LAYERS": "water:geonam_grwtvlvlk"
      }
    });
    // noinspection JSCheckFunctionSignatures
    layer = new TileLayer({
      title: "Geen grondwateraanvulling",
      fid: "gwa",
      extent: extent,
      source: source,
      hide_opacity: true,
      visible: false,
      baseLayer: false,
      displayInLayerSwitcher: true,
      allwaysOnTop: false
    });
    layers.push(layer);

    // Grondwaterstanden.
    source = new TileWMS({
      url: "https://opengeodata.zeeland.nl/geoserver/water/wms?",
      params: {
        "TILED": true,
        tilesOrigin: 17331.869140625 + "," + 360603.125,
        "VERSION": "1.1.1",
        "LAYERS": "water:PMG_kwantiteit"
      }
    });
    // noinspection JSCheckFunctionSignatures
    layer = new TileLayer({
      title: "Grondwaterstanden",
      fid: "grondwaterstanden",
      // Enable identify.
      identify: {
        tabTitle: "Grondwaterstanden",
        infoFormat: "application/json",
        featureCount: 1,
      },
      extent: extent,
      source: source,
      hide_opacity: true,
      visible: false,
      baseLayer: false,
      displayInLayerSwitcher: true,
      allwaysOnTop: false
    });
    layers.push(layer);

    // AHN4
    source = new TileWMS({
      url: "https://service.pdok.nl/rws/ahn/wms/v1_0?",
      params: {
        "TILED": true,
        tilesorigin: origin,
        "VERSION": "1.1.0",
        "LAYERS": "dtm_05m"
      }
    });
    // noinspection JSCheckFunctionSignatures
    layer = new TileLayer({
      title: "Actueel Hoogtebestand Nederland",
      fid: "ahn4",
      // Enable identify.
      identify: {
        tabTitle: "AHN4",
        infoFormat: "application/json",
        featureCount: 1,
      },
      extent: extent,
      source: source,
      hide_opacity: true,
      visible: false,
      baseLayer: false,
      displayInLayerSwitcher: true,
      allwaysOnTop: false
    });
    layers.push(layer);

    // noinspection JSCheckFunctionSignatures
    layerGroup = new LayerGroup({
      title: "Extra Kaartlagen",
      fid: "Extra_kaartlagen",
      layers: layers,
      openInLayerSwitcher: false,
      visible: true,
      opacity: 0.8
    });

    return layerGroup;
  };
  /**-----------------------------------------------------------------------------
   * Create overlay layers group.
   * @param extent
   * @param origin
   * @param resolutions
   * @param proj
   */
  createLayerGroupFreshem(extent, origin, resolutions, proj) {
    let source, layer, layers;
    let defInfoFormat, defFeatureCount,layerGroup;

    layers = [];

    defInfoFormat = "text/html";
    defFeatureCount = 50;

    // Geschiktheid voor grondwateronttrekking.
    source = new TileWMS({
      url: this.config.suitExtractionWmsUrl,
      projection: proj,
      tileGrid: new TileGrid({
        origin: origin,
        resolutions: resolutions
      }),
      params: {
        "VERSION": "1.1.0",
        "LAYERS": "freshem:suit_extraction",
        "ELEVATION": -20.25,
        "TILED": true
      }
    });
    // noinspection JSCheckFunctionSignatures
    layer = new TileLayer({
      title: "Geschiktheid onttrekking op diepte (m NAP)",
      extent: extent,
      source: source,
      fid: "suit_extraction_op_diepte",
      hide_opacity: true,
      visible: false,
      baseLayer: true,
      dimension: {
        "name": "ELEVATION",
        "initialValue": -20.25,
        // Nr values = 7 * 8 + 6 = 62
        // Remark: will be converted to centimeters when value is send as WMS parameters.
        "list": [-25.25, -24.75, -24.25, -23.75, -23.25, -22.75, -22.25, -21.75,
          -21.25, -20.75, -20.25, -19.75, -19.25, -18.75, -18.25, -17.75,
          -17.25, -16.75, -16.25, -15.75, -15.25, -14.75, -14.25, -13.75,
          -13.25, -12.75, -12.25, -11.75, -11.25, -10.75, -10.25, -9.75,
          -9.25, -8.75, -8.25, -7.75, -7.25, -6.75, -6.25, -5.75,
          -5.25, -4.75, -4.25, -3.75, -3.25, -2.75, -2.25, -1.75,
          -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75, 2.25,
          2.75, 3.25, 3.75, 4.25, 4.75, 5.25],
        // Delta = 6
        "ticks": [-25.25, -18.75, -12.75, -6.75, -0.75, 5.25],
        "scaling": "count"
      }
    });
    layers.push(layer);

    // Chloridegehalte.
    source = new TileWMS({
      url: this.config.chlorideWmsUrl,
      projection: proj,
      tileGrid: new TileGrid({
        origin: origin,
        resolutions: resolutions
      }),
      params: {
        "VERSION": "1.1.0",
        "LAYERS": "freshem:chloride",
        "ELEVATION": -20.25,
        "TILED": true
      }
    });
    // noinspection JSCheckFunctionSignatures
    layer = new TileLayer({
      title: "Chloridegehalte op diepte (m NAP)",
      extent: extent,
      source: source,
      fid: "chloridegehalte_op_diepte",
      // Enable identify.
      identify: {
        tabTitle: "Chloridegehalte",
        infoFormat: defInfoFormat,
        featureCount: defFeatureCount,
      },
      hide_opacity: true,
      visible: false,
      baseLayer: true,
      dimension: {
        "name": "ELEVATION",
        // Nr values = 7 * 8 + 6 = 62
        "list": [-25.25, -24.75, -24.25, -23.75, -23.25, -22.75, -22.25, -21.75,
          -21.25, -20.75, -20.25, -19.75, -19.25, -18.75, -18.25, -17.75,
          -17.25, -16.75, -16.25, -15.75, -15.25, -14.75, -14.25, -13.75,
          -13.25, -12.75, -12.25, -11.75, -11.25, -10.75, -10.25, -9.75,
          -9.25, -8.75, -8.25, -7.75, -7.25, -6.75, -6.25, -5.75,
          -5.25, -4.75, -4.25, -3.75, -3.25, -2.75, -2.25, -1.75,
          -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75, 2.25,
          2.75, 3.25, 3.75, 4.25, 4.75, 5.25],
        // Delta = 6
        "ticks": [-25.25, -18.75, -12.75, -6.75, -0.75, 5.25],
        "scaling": "count"
      }
    });
    layers.push(layer);

    // Grensvlak met chloridegehalte.
    source = new TileWMS({
      url: this.config.grensvlakWmsUrl,
      projection: proj,
      tileGrid: new TileGrid({
        origin: origin,
        resolutions: resolutions
      }),
      params: {
        "VERSION": "1.1.0",
        "LAYERS": "freshem:grensvlak",
        "ELEVATION": 1000,
        "TILED": true
      }
    });
    // noinspection JSCheckFunctionSignatures
    layer = new TileLayer({
      title: "Grensvlak met chloridegehalte (mg/l)",
      extent: extent,
      source: source,
      fid: "grensvlak_met_chloridegehalte",
      // Enable identify.
      identify: {
        tabTitle: "Grensvlak",
        infoFormat: defInfoFormat,
        featureCount: defFeatureCount,
      },
      hide_opacity: true,
      baseLayer: true,
      dimension: {
        "name": "ELEVATION",
        "list": [150, 300, 1000, 1500, 3000, 10000],
        "ticks": [150, 300, 1000, 1500, 3000, 10000],
        "scaling": "count"
      }
    });
    layers.push(layer);

    // Vlieglijnen.
    source = new TileWMS({
      url: "https://projectgeodata.zeeland.nl/geoserver/gwc/service/wms",
      projection: proj,
      tileGrid: new TileGrid({
        origin: origin,
        resolutions: resolutions
      }),
      params: {
        "VERSION": "1.1.0",
        "LAYERS": "freshem:vlieglijnen",
        "TILED": true
      }
    });
    // noinspection JSCheckFunctionSignatures
    layer = new TileLayer({
      title: "Vlieglijnen",
      extent: extent,
      source: source,
      fid: "vlieglijnen",
      // Enable identify.
      identify: {
        tabTitle: "Vlieglijnen",
        infoFormat: defInfoFormat,
        featureCount: defFeatureCount,
      },
      visible: false,
      hide_opacity: true,
      baseLayer: false,
    });
    layers.push(layer);

    // noinspection JSCheckFunctionSignatures
    layerGroup = new LayerGroup({
      "title": "Kaartlagen Freshem",
      layers: layers,
      openInLayerSwitcher: true,
      opacity: 0.8,
      fid: "kaartlagen"
    });

    return layerGroup;
  }
  /**-----------------------------------------------------------------------------
   */
  createLayerSwitcher() {
    let self= this;
    return new olLayerSwitcherExt({
      reordering: false,
      show_progress: true,
      show_opacity: false,
      onInfo: function(layer) {
        self.showLayerSwitcherInfo(layer);
      }
    });
  }
  /**-----------------------------------------------------------------------------
   * Add a vector layer to persist profile in the profile tool.
   */
  createProfileLayerVector() {
    let profileSrc, profileVector;
    profileSrc = new VectorSource();
    // noinspection JSCheckFunctionSignatures
    profileVector = new VectorLayer({
      source: profileSrc,
      displayInLayerSwitcher: false,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 0, 255, 1)'
        }),
        stroke: new Stroke({
          color: 'rgba(255, 0, 255, 1)',
          width: 2
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: 'rgba(255, 0, 255, 1)'
          }),
          fill: new Fill({
            color: 'rgba(255, 0, 255, 0.5)'
          })
        })
      })
    });
    this.map.addLayer(profileVector);
    return profileVector;
  }
  /**-----------------------------------------------------------------------------
   */
  createProfileLayerResult() {
    let resultSrc, resultVector;
    resultSrc = new VectorSource();
    // noinspection JSCheckFunctionSignatures
    resultVector = new VectorLayer({
      source: resultSrc,
      displayInLayerSwitcher: false,
      style: new Style({
        image: new CircleStyle({
          radius: 4,
          stroke: new Stroke({
            color: 'rgba(255, 0, 255, 0.4)'
          }),
          fill: new Fill({
            color: 'rgba(255, 0, 255, 0.1)'
          })
        })
      })
    });
    this.map.addLayer(resultVector);
    return resultVector;
  }
  /**-----------------------------------------------------------------------------
   * @param layerInfos
   * @returns {String}
   */
  featureInfoCreateTabs(layerInfos) {
    let layerInfo,html;
    let i,len;

    if (layerInfos.length === 0) {
      return "Geen informatie gevonden."
    }

    html = "<div id='featureInfoTabs' class='featureInfoTabs'>";

    // Create the tabs.
    html += "  <ul>";
    for (i = 0,len = layerInfos.length;i < len;i++) {
      layerInfo = layerInfos[i]
      html += `    <li><a href='#featureInfoTabs-${(i+1)}'>${layerInfo.tabTitle}</a></li>`;
    }
    html += "  </ul>";

    // Create the tab content.
    for (i = 0, len = layerInfos.length; i < len; i++) {
      layerInfo = layerInfos[i]
      html += `  <div id='featureInfoTabs-${(i+1)}' class='featureInfoTabPanel'>`;
      html += `    ${layerInfo.html}`;
      html += "  </div>";
    }

    html += "</div>";

    return html;
  }
  /**-----------------------------------------------------------------------------
   * Generates the html for the tabs.
   * If needed, merges html of LayerInfo objects.
   * @param layerInfos
   * @param dataList        A list of data as response of the GetFeatureInfo.
   * @return {Array}
   */
  featureInfoProcess(layerInfos,dataList) {
    let layerInfo, data, vlgLayerInfo, vlgIndex, vlgData;
    let newLayerInfos;
    let html,feature,value;
    let i,len;

    console.log("#App.featureInfoProcess()");

    newLayerInfos = [];

    // Loop the layer info.
    for (i = 0, len = layerInfos.length; i < len; i++) {
      layerInfo = layerInfos[i];
      data = dataList[i];

      if ((layerInfo.fid === "chloridegehalte_op_diepte") ||
          (layerInfo.fid === "grensvlak_met_chloridegehalte")) {

        //console.log(layerInfo.fid);
        //console.log(data);

        // Chloridegehalte or Grensvlak.
        value = layerInfo.params["ELEVATION"];
        html = "<strong>" + layerInfo.title + "</strong><br>(huidige waarde: " + value + ")<hr>";
        if (data === "") {
          html += "<p>Geen gegevens gevonden.</p>";
        } else {
          html += data;
        }

        // Get flightline info too.
        vlgIndex = this.getLayerInfoIndex(layerInfos, "vlieglijnen");
        if (vlgIndex >= 0) {
          vlgLayerInfo = layerInfos[vlgIndex];
          vlgData = dataList[vlgIndex];
          if (vlgData !== "") {
            let imageResponse = $(vlgData).filter(".vlieglijn-gfi-response");
            let hasImage = imageResponse.length;
            let vlgHtml = "<ul>";
            if (hasImage > 0) {
              // Add flightline info.
              imageResponse.find("ul li").each(function () {
                let image = $(this).text();
                vlgHtml += "<li><a href='javascript:app.showFlight(\"" + image + "\");'>Bekijk vlieglijnen profiel</a></li>";
              });
              vlgHtml += "</ul>";
              html += vlgHtml;
            }
          }
        }
        layerInfo.html = html;
        newLayerInfos.push(layerInfo)
      } else if (layerInfo.fid === "grondwaterstanden") {
        // Grondwaterstanden.
        console.log(data);
        html = "<strong>" + layerInfo.title + "</strong><br><hr>";
        if (data === "") {
          html += "<p>Geen gegevens gevonden.</p>";
        } else {
          feature = data.features[0];
          if (feature === undefined) {
            html += "<p>Geen gegevens gevonden.</p>";
          } else {

            let templ,title;

            templ = "<li><div class='column1'>$1</div><div class='column2'>$2</div></li>";

            html += "<div class='freshem-gfi-response'>";
            html += "<ul>";

            title = "NITG code:";
            // noinspection JSUnresolvedReference
            value = feature.properties.nitg_code;
            html += this.valuesToStr(templ,title,value);

            title = "BRO code:";
            // noinspection JSUnresolvedReference
            value = feature.properties.bro_id;
            html += this.valuesToStr(templ,title,value);

            title = "Tijdstip meting:";
            // noinspection JSUnresolvedReference
            value = feature.properties.tijdstip_meting;
            html += this.valuesToStr(templ,title,value);

            title = "Grondwaterstand:";
            // noinspection JSUnresolvedReference
            value = feature.properties.grondwaterstand_nap.toFixed(2) + " meter";
            html += this.valuesToStr(templ,title,value);

            title = "Maaiveldhoogte:";
            // noinspection JSUnresolvedReference
            value = feature.properties.maaiveldpositie.toFixed(2) + " meter";
            html += this.valuesToStr(templ,title,value);

            title = "Peilbuis filter:";
            // noinspection JSUnresolvedReference
            value = feature.properties.filternummer;
            html += this.valuesToStr(templ,title,value);

            title = "Bovenkant filter:";
            // noinspection JSUnresolvedReference
            value = feature.properties.bovenkant_filter.toFixed(2) + " meter NAP";
            html += this.valuesToStr(templ,title,value);

            title = "Onderkant filter:";
            // noinspection JSUnresolvedReference
            value = feature.properties.onderkant_filter.toFixed(2) + " meter NAP";
            html += this.valuesToStr(templ,title,value);

            html += "</ul>";
            html += "</div>";
          }
        }
        layerInfo.html = html;
        newLayerInfos.push(layerInfo)
      } else if (layerInfo.fid === "ahn4") {
        // AHN4.
        html = "<strong>" + layerInfo.title + "</strong><br><hr>";
        if (data === "") {
          html += "<p>Geen gegevens gevonden.</p>";
        } else {
          feature = data.features[0];
          if (feature === undefined) {
            html += "<p>Geen gegevens gevonden.</p>";
          } else {
            // noinspection JSUnresolvedReference
            value = feature.properties.value_list;
            value = parseFloat(value);
            html += "Hoogte: " + value.toFixed(2) + " meter";
          }
        }
        layerInfo.html = html;
        newLayerInfos.push(layerInfo)
      }
    }
    return newLayerInfos;
  }
  /**-----------------------------------------------------------------------------
   */
  getLayerInfoIndex(layerInfos,fid) {
    let i,len;
    for (i = 0, len = layerInfos.length; i < len; i++) {
      if (layerInfos[i].fid === fid) {
        return i;
      }
    }
    return -1;
  }
  /**-----------------------------------------------------------------------------
   */
  featureInfoGet(evt) {
    let self = this;
    let viewResolution, viewProjection;
    let layerGroup,layer,layers,layerInfo,layerInfos;
    let visible,title,fid,url,params,identify,tabTitle,infoFormat,featureCount;
    let deferred = [];
    let clickedOn;
    let html;
    let i,len;

    console.log("#App.featureInfoGet()");

    viewResolution = this.view.getResolution();
    viewProjection = this.view.getProjection();

    // Set mouse to like where doing something.
    this.mouseStyle("progress");

    // Reset overlay content.
    let popupContent = document.getElementById("popup-content");
    popupContent.innerHTML = "";

    $("#popup").removeClass("ol-popup-low");

    clickedOn = null;

    // Get the freshem layers.
    layerGroup = this.layerGroupFreshem;
    layers = layerGroup.getLayers().getArray();

    // Get the extra layers.
    layerGroup = this.layerGroupExtra;
    layers = layers.concat(layerGroup.getLayers().getArray());

    console.log("Nr. of Layers:" + layers.length);

    clickedOn = this.map.getCoordinateFromPixel(evt.pixel);

    //#########################################################
    //# Get layer info.
    //#########################################################

    layerInfos = [];
    for (i = 0, len = layers.length; i < len; i++) {
      layer = layers[i];
      visible = layer.isVisible();
      identify = layer.get("identify");
      // Not visible?
      if (!visible) {
        continue;
      }
      // No identify?
      if (identify === undefined) {
        continue;
      }
      // Get layer properties.
      title = layer.get("title");
      fid = layer.get("fid");
      params = layer.getSource().getParams();
      tabTitle = "Kaartlaag"+(i+1);
      if (identify.tabTitle !== undefined) {
        tabTitle = identify.tabTitle;
      }
      infoFormat = "text/html";
      if (identify.infoFormat !== undefined) {
        infoFormat = identify.infoFormat;
      }
      featureCount = 1;
      if (identify.featureCount !== undefined) {
        featureCount = identify.featureCount;
      }

      url = layer.getSource().getFeatureInfoUrl(evt.coordinate, viewResolution, viewProjection, {
        "INFO_FORMAT": infoFormat,
        "FEATURE_COUNT": featureCount
      });

      if (url === undefined) {
        console.log("No getFeatureInfoUrl!!!");
        continue;
      }

      // Create layer info object and add to list.
      layerInfo = {};
      layerInfo.title = title;
      layerInfo.tabTitle = tabTitle;
      layerInfo.fid = fid;
      layerInfo.url = url;
      layerInfo.params = params;
      layerInfos.push(layerInfo);

      if (self.config.useIdentifyProxy) {
        url = self.config.proxyUrl+"location/"+btoa(url);
      }
      console.log("getFeatureInfoUrl: " + url);
      deferred.push($.ajax({url: url, cache: false}));
    }

    console.log("Layers found: " + layerInfos.length);

    //#########################################################
    //# Get layer feature info (as html).
    //#########################################################

    html = "";
    $.when.apply(null,deferred).done(function() {
      let dataList,newLayerInfos,i,len;

      //console.log("Arguments length - " + arguments.length)
      //console.log(arguments)

      dataList = [];
      if (layerInfos.length === 1) {
        // 1 layer.
        dataList.push(arguments[0]);
      } else {
        // Multiple layers.
        for (i = 0, len = arguments.length; i < len; i++) {
          dataList.push(arguments[i][0]);
        }
      }

      newLayerInfos = self.featureInfoProcess(layerInfos,dataList);

      // Create tabs.
      html = self.featureInfoCreateTabs(newLayerInfos);
      popupContent.innerHTML = html;
      $(function() {
        $("#featureInfoTabs").tabs();
      });

      self.overlay.setPosition(clickedOn);

      self.mouseStyle("default");

    }).fail(function () {
      popupContent.innerHTML += "Fout tijdens ophalen van de data.";
      self.overlay.setPosition(clickedOn);

      self.mouseStyle("default");

    });
  }
  /**-----------------------------------------------------------------------------
   * For getting tiles in TMS.
   */
  getTile(url, format, tileCoord) {
    let zxy = tileCoord;
    if (zxy[1] < 0 || zxy[2] < 0) {
      return "";
    }
    return url +
      zxy[0].toString() + "/" + zxy[1].toString() + "/" +
      zxy[2].toString() + "." + format;
  }
  /**-----------------------------------------------------------------------------
   */
  /**-----------------------------------------------------------------------------
   */
  init() {
    let self = this;
    let extent,origin,center,resolutions,proj,extentZeeland;
    let element,container,closer,button,infoControl,onInfo;
    let mainBar,nestedBar,progressElement,USE;

    $("body").addClass("showPercent");

    // Definitions of Dutch RD and tilescheme.
    extent = [-285401.92, 22598.08, 595401.92, 903401.92];
    origin = extent.slice(0, 2);
    center = [45400, 378700];
    resolutions = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880,
      13.440, 6.720, 3.360, 1.680, 0.840, 0.420];
    proj = new Projection({code: "EPSG:28992", units: "m", extent: extent});

    extentZeeland = extent;

    //#########################################################
    //# Create layer groups.
    //#########################################################
    this.layerGroupBase = this.createLayerGroupBase(proj);
    this.layerGroupFreshem = this.createLayerGroupFreshem(extentZeeland, origin, resolutions, proj);
    this.layerGroupExtra = this.createLayerGroupExtra(extentZeeland, origin);

    //#########################################################
    //# Create overlay for pupups.
    //#########################################################
    container = document.getElementById("popup");
    closer = document.getElementById("popup-closer");
    // noinspection JSCheckFunctionSignatures
    this.overlay = new Overlay(({
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 250
      }
    }));
    closer.onclick = function () {
      self.overlay.setPosition(undefined);
      closer.blur();
      return false;
    };

    //#########################################################
    //# Create view.
    //#########################################################
    this.view = new View({
      center: center,
      projection: proj,
      zoom: 6
    });

    //#########################################################
    //# Create the map.
    //#########################################################
    this.map = new Map({
      layers: [this.layerGroupBase, this.layerGroupFreshem, this.layerGroupExtra],
      overlays: [this.overlay],
      logo: false,
      controls: controlDefaults({
        zoom: true,
        zoomOptions: {
          zoomInTipLabel: "Zoom in",
          zoomOutTipLabel: "Zoom uit",
        },
        attribution: false,
        rotate: false
      }),
      target: "map",
      view: this.view
    });

    //#########################################################
    //# Create the map controls.
    //#########################################################
    this.map.addControl(new ScaleLine({units: "metric"}));

    //#########################################################
    //# Create info button.
    //#########################################################
    button = document.createElement("button");
    button.innerHTML = "<i class='fa fa-info-circle' aria-hidden='true'></i>";
    button.title = "Algemene informatie over deze kaart";
    element = document.createElement("div");
    element.className = "freshem-info-button ol-unselectable ol-control";
    onInfo = function () {
      self.showAppInfo();
    };

    button.addEventListener("click", onInfo, false);
    button.addEventListener("touchstart", onInfo, false);
    element.appendChild(button);

    infoControl = new Control({element: element});
    this.map.addControl(infoControl);

    //#########################################################
    //# Create profile layers.
    //#########################################################
    this.profileLayerVector = this.createProfileLayerVector();
    this.profileLayerResult = this.createProfileLayerResult();

    //#########################################################
    //# Create feature highlight interaction.
    //#########################################################
    // noinspection JSCheckFunctionSignatures
    this.controlHighlight = new Select({
      layer: this.profileLayerResult,
    });
    this.map.addInteraction(this.controlHighlight);

    //#########################################################
    //# Create map click handler for handling feature info.
    //#########################################################
    this.map.on("singleclick", function (evt) {
      self.onMapClick(evt);
    });

    //#########################################################
    //# Create the toolbars.
    //#########################################################
    mainBar = new Bar();
    this.map.addControl(mainBar);
    // Nested toobar with one control activated at once.
    nestedBar = new Bar({
          toggleOne: true,
          group: true
        }
    );
    mainBar.addControl(nestedBar);

    //#########################################################
    //# Create the toolbar controls.
    //#########################################################
    this.controlFeatureInfo = this.createControlFeatureInfo();
    nestedBar.addControl(this.controlFeatureInfo);

    this.controlPointProfile = this.createControlPointProfile(this);
    nestedBar.addControl(this.controlPointProfile);

    this.controlLineProfile = this.createControlLineProfile(this);
    nestedBar.addControl(this.controlLineProfile);

    //#########################################################
    //# Create the layerswitcher.
    //#########################################################
    this.controlLayerSwitcher = this.createLayerSwitcher();
    this.map.addControl(this.controlLayerSwitcher);

    //#########################################################
    //# Create the progress control.
    //#########################################################
    progressElement = document.getElementById("progress");
    this.progress = new Progress(progressElement);

    //#########################################################
    //# Dummy reference some methods.
    //#########################################################
    USE = false;
    if (USE) {
      // Dummy call.
      this.showFlight("");
    }
  }
  /**-----------------------------------------------------------------------------
   *  Set the mousepointer to the specific style
   *  @param style
   */
  mouseStyle(style) {
    document.body.style.cursor = style;
  }
  /**-----------------------------------------------------------------------------
   * Get the geocoder info.
   * The response html uses the following global variables or methods:
   * - content.innerHTML = text;
   * - overlay.setPosition(position);
   * - zoom_to_location();
   */
  onGeocoderAutoComplete() {
    let inputElt,inputValue,resultElt,url,inputLength;

    console.log("#App.onGeocoderAutoComplete()");

    inputLength = 3;
    if (this.config.TEST_USE_GEOCODDER_FILE) {
      inputLength = 1;
    }

    inputElt = $("#ol3_search_form_lookup");
    resultElt = $("#map_search_simple_result");

    $("#popup").addClass("ol-popup-low");

    inputValue = inputElt.val();
    if (inputValue.length >= inputLength) {
      if (this.config.TEST_USE_GEOCODDER_FILE) {
        url = this.config.geocoderUrl;
      } else {
        url = this.config.geocoderUrl.replace("[SEARCH]",inputValue);
      }

      console.log("Using url: " + url);

      resultElt.show();

      fetch(url).then(function (response) {
        return response.text();
      }).then(function(html) {
        //console.log(html);
        resultElt.html(html);
      }).catch(function (error) {
        console.log("Error: " + error);
      })
    } else {
      resultElt.hide();
      resultElt.html("");
    }
  }
  /**-----------------------------------------------------------------------------
   */
  onMapClick(evt) {
    let isActive;
    isActive = this.controlFeatureInfo.getActive();
    //console.log("App.onMapClick() - isActive = " + isActive);
    if (isActive) {
      this.featureInfoGet(evt);
    }
  }
  /**-----------------------------------------------------------------------------
   */
  showAppInfo() {
    let url, container, content, elt;

    url = this.config.infoUrl + "algemene_info.html";

    console.log("#App.showAppInfo() - url: " + url);

    container = $("#fl_container");
    container.html("");
    container.click(function () {
      container.hide();
    });

    content = "<a href='#' id='fl-container-closer' class='ol-popup-closer' >";
    content += '<i class="fa fa-times" aria-hidden="true"></i>';
    content += "</a>";

    fetch(url)
        .then(response => {
          if (!response.ok) {
          }
          return response.text();
        })
        .then(text => {
          content += text;
          content += "</div>";
          elt = $("#fl_container");
          elt.html(content);
          elt.show();
        })
        .catch(function (error) {
          console.log("###Error: " + error);
        })
  }

  /**-----------------------------------------------------------------------------
   * @param {String} image
   */
  showFlight(image) {
    let content, elt, flightUrl;

    console.log("#App.showFlight() - image: "+image);

    flightUrl = this.config.flightUrl;

    console.log("Url: "+flightUrl);

    // noinspection JSUnresolvedReference
    // content = '<a href="#" id="fl-container-closer" class="ol-popup-closer" ' +
    //     'onclick="this.parentNode.style.display =' + " 'none' " + ';"></a>';
    // noinspection JSUnresolvedReference
    content = '<a href="#" id="fl-container-closer" class="ol-popup-closer" ' +
        'onclick="this.parentNode.style.display =' + " 'none' " + ';">';
    content += '<i class="fa fa-times" aria-hidden="true"></i>';
    content += '</a>';

    content += '<div class="fl-container-content"><br>';
    content += '<img id="fl-image" data-magnify-magnifiedwidth="1200" ' +
        'data-magnify-magnifiedheight="1200" ' +
        'data-magnify-src="' + flightUrl + image +'" ' +
        'class="fl-zoom fl-container-image" src="' + flightUrl + image + '" alt="">';
    content += "</div>";
    content += "<script type='text/javascript'>";
    content += "$zoom = $('.fl-zoom').magnify({afterLoad: function() {console.log('Magnification on!');}});";
    content += "</script>";
    content += "<hr>";
    content += '<a target="_new" href="' + flightUrl + image + '">Download profiel als PNG bestand</a>';
    elt = $("#fl_container");
    elt.html(content);
    elt.show();
  }
  /**-----------------------------------------------------------------------------
   * Toont een panel naast de LayerSwitcher.
   * freshem.js - openFreshemInfoWindow
   */
  showLayerSwitcherInfo(layer) {
    let fid,title;
    let url;
    let layerPanel;
    let infoPanel;
    let infoContent;
    let html;
    let height;
    let request;

    fid = layer.get("fid");
    title = layer.get("title");

    url = this.config.infoUrl + fid + ".html";

    console.log("#App.showLayerSwitcherInfo() - url: "+url);

    layerPanel = $("ul.panel");
    height = layerPanel.height();
    infoPanel = $(".ol-layerswitcher-info");
    infoContent = $(".ol-layerswitcher-info-content");
    html = "<span class='ol-layerswitcher-info-content-title'>"+title+"</span>";
    request = $.ajax({url: url, cache: false});
    $.when.apply(null,[request]).done(function(response) {
      html += response;
      infoContent.html(html);
      infoPanel.height(height-4);
      infoPanel.show();
    });
  }
  /**-----------------------------------------------------------------------------
   * Replaces in template $1 and $2 with value1 and value2.
   * @param template
   * @param value1
   * @param value2
   */
  valuesToStr(template,value1,value2) {
    template = template.replace("$1",value1);
    if (value2) {
      template = template.replace("$2",value2);
    }
    return template;
  }
  /**-----------------------------------------------------------------------------
   * Called in injected html by Geocoder.
   */
  zoomToLocation(x,y,zoom) {
    this.view.setCenter([x,y]);
    this.view.setZoom(zoom);
  }
  /**-----------------------------------------------------------------------------
   */
  async testRunAtStartup() {
    this.testShowProfilePopup();
  }
  /**-----------------------------------------------------------------------------
   */
  testShowProfilePopup() {
    let geomType,control,feature,evt;

    console.log("#App.testShowProfilePopup");

    geomType = this.config.testGeomType;
    if (geomType === "Point") {
      control = this.controlPointProfile;
      feature = createFeaturePoint(1,1);
    } else {
      control = this.controlLineProfile;
      feature = createFeatureLine(1,1,2,2);
    }
    // Enable control.
    control.toggle();
    if (this.config.TEST_SIMULATE_DRAW) {
      // Simulate draw end.
      evt = {
        feature: feature,
      };
      control.interaction_.onFinishDrawing(evt);
    }
  }
}
