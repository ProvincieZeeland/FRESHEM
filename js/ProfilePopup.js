/**----------------------------------------------------------------------------------------------------
 * Creates the profile popup.
 *
 * European Union Public Licence V. 1.2
 * EUPL © the European Union 2007, 2016
 *
 * Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 */

import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Map from "ol/Map";
import View from "ol/View";
import MousePosition from "ol/control/MousePosition";
import {createStringXY} from "ol/coordinate";
import {jsPDF} from "jspdf/dist/jspdf.es.min";

import ColorTable from "./ColorTable";
import FillTable from "./FillTable";
import {createFeatureText,zoomToExtent} from "./OLUtils";
import Profile from "./Profile";
import ProfileLegend from "./ProfileLegend";
import {ProfileLayout} from "./ProfileLayout";

/**-----------------------------------------------------------------------------
 */
export class ProfilePopup {

  app = null;

  showCoords = false;
  //showCoords = true;

  mapTip = null;

  profile = null;
  profileData = null;
  profileOptions = null;

  legend = null;

  nrCheckButtons = 0;

  /**-----------------------------------------------------------------------------
   */
  constructor(app) {

    this.app = app;

    // Create the profiles.
    this.profile = new Profile(this.app);

    // Create the legend.
    this.legend = new ProfileLegend(this.app);
  }
  /**-----------------------------------------------------------------------------
   * @param target
   * @param showCoords
   * @param disableZoom
   */
  createMap(target,showCoords,disableZoom) {
    let map,source,layer;
    let result,mousePosition;

    console.log("#ProfilePopup.createMap() - Target: "+target);

    // Create vector source.
    source = new VectorSource({
    });

    // Create vector layer.
    layer = new VectorLayer({
      source: source,
    });

    // Create chart 'map'.
    map = new Map({
      controls: [],
      layers: [layer],
      target: target,
      view: new View({
        center: [0, 3000000],
        zoom: 2,
      }),
    });

    // Create coordinates control?
    if (showCoords) {
      mousePosition = new MousePosition({
        className: "custom-mouse-position",
        target: document.getElementById("coordinates"),
        //coordinateFormat: createStringXY(5),
        coordinateFormat: createStringXY(1),
        undefinedHTML: "&nbsp;"
      });
      map.addControl(mousePosition);
    }

    // Disable zoom?
    if (disableZoom) {
      map.getInteractions().clear();
    }

    result = {
      map: map,
      source: source,
      layer: layer,
    }
    return result;
  }
  /**-----------------------------------------------------------------------------
   * Zie profileinteraction.
   * @param options
   */
  createPopup(options) {
    let self = this;
    let geomType,value_fields,panel;
    let d, value, input, inputType, group, labelText, checked, btn;
    let i, len;

    console.log("#ProfilePopup.createPopup()");

    console.log("Options:");
    console.log(options);

    // Get profile geometry type.
    geomType = options.geometry.getType()

    value_fields = options.value_fields;

    this.nrCheckButtons = value_fields.length;

    // Get main container div and show.
    panel = document.getElementById("chartpopup");
    panel.style.display = "block";

    // Close button.
    d = '<a href="#" id="btnClose" class="chartclosebtn"><i class="fa fa-times" aria-hidden="true"></i></a>';

    //------------------------------------------------------------------------
    // Sidebar.
    //------------------------------------------------------------------------
    d += "<div id='chartsidebar'>";

    if (geomType === "Point") {
      inputType = "type='checkbox'";
      group = "";
    } else {
      inputType = "type='radio'";
      group = "name='line'";
    }

    for (i = 0, len = value_fields.length; i < len; i++) {
      value = value_fields[i];
      input = "<input id='chartcheck_" + i + "'" + " class='chartinput' " + inputType + group + "/>";
      labelText = value.replace("_", " ");
      d += "  <div class='chartcheck'><label>" + input + labelText + "</label></div>";
    }

    if (this.app.showSuitExtraction) {
      checked = "checked";
    } else {
      checked = "";
    }
    input = "<input id='chartsuit' class='chartinput' type='checkbox' " + checked + "/>";
    labelText = "geschiktheid onttrekking"
    d += "<div class='chartcheck chartsuit'><label>" + input + labelText + "</label></div>";
    d += "<a id='image-download' download='map.png'></a>";

    // Download PDF.
    d += "<div>";
    d += "  <button id='btnDownloadPDF' class='chartprintbtn' type='button'>Download als PDF</button>";
    d += "</div>";

    //------------------------------------------------------------------------
    // Panel.
    //------------------------------------------------------------------------

    d += "</div>";
    d += "<div id='chartpanel'>";
    d += "  <div id='charttopbar'>"
    d += "<span id='btnDownloadPNG' class='charticon' title='Download als PNG'>";
    d += "<svg viewBox='0 0 1000 1000' height='1em' width='1em'>";
    d += "<path ";
    d += "d='m500 450c-83 0-150-67-150-150 0-83 67-150 150-150 83 0 150 67 150 150 0 83-67 150-150 150z m400 150h-120c-16 0-34 13-39 29l-31 93c-6 15-23 28-40 28h-340c-16 0-34-13-39-28l-31-94c-6-15-23-28-40-28h-120c-55 0-100-45-100-100v-450c0-55 45-100 100-100h800c55 0 100 45 100 100v450c0 55-45 100-100 100z m-400-550c-138 0-250 112-250 250 0 138 112 250 250 250 138 0 250-112 250-250 0-138-112-250-250-250z m365 380c-19 0-35 16-35 35 0 19 16 35 35 35 19 0 35-16 35-35 0-19-16-35-35-35z' ";
    d += "transform='matrix(1 0 0 -1 0 850)'></path>";
    d += "</svg>";
    d += "</span>";
    d += "<span id='btnHome' class='charticon' title='Helemaal uitzoomen'>";
    d += "<svg viewBox='0 0 1000 1000' height='1em' width='1em'>";
    d += "<path ";
    d += "d='m250 850l-187 0-63 0 0-62 0-188 63 0 0 188 187 0 0 62z m688 0l-188 0 0-62 188 0 0-188 62 0 0 188 0 62-62 0z m-875-938l0 188-63 0 0-188 0-62 63 0 187 0 0 62-187 0z m875 188l0-188-188 0 0-62 188 0 62 0 0 62 0 188-62 0z m-125 188l-1 0-93-94-156 156 156 156 92-93 2 0 0 250-250 0 0-2 93-92-156-156-156 156 94 92 0 2-250 0 0-250 0 0 93 93 157-156-157-156-93 94 0 0 0-250 250 0 0 0-94 93 156 157 156-157-93-93 0 0 250 0 0 250z' ";
    d += "transform='matrix(1 0 0 -1 0 850)'></path>";
    d += "</svg>";
    d += "</a>";

    //------------------------------------------------------------------------
    // ChartContainer with ChartProfile and ChartLegend.
    //------------------------------------------------------------------------

    d += "  </div>";
    d += "  <div id='chartcontainer'>";
    d += "    <div id='chartprofile' class='chartprofile'>";
    d += "      <div id='chartinfo' class='chartinfo'></div>";
    d += "    </div>";
    d += "    <div id='chartlegend' class='chartlegend'></div>";
    d += "  </div>";
    d += "  <div id='chartcoordinates'></div>";
    d += "</div>";

    panel.innerHTML = d;

    // Add event handlers and create profile(s).
    console.log("Value_fields:");
    console.log(value_fields);

    for (i = 0, len = value_fields.length; i < len; i++) {
      btn = document.getElementById("chartcheck_" + i);
      btn.addEventListener('click', function () {
        self.onOptionsChanged();
      });
    }
    btn = document.getElementById("chartsuit");
    btn.addEventListener('click', function () {
      self.onOptionsChanged();
    });

    // Show the default plots.
    this.onOptionsChanged();
  }
  /**-----------------------------------------------------------------------------
   * Draw legends (from bottom to top).
   */
  drawLegends(legendData) {
    let layout, colorTable, fillTable, title;
    let positionX,positionY,currentPosition;

    console.log("##########ProfilePopup.drawLegends()");

    layout = ProfileLayout.getLegendLayout();

    title = "Geschiktheid onttrekking";
    fillTable = new FillTable();
    positionX = layout.positionsX[0];
    positionY = layout.positionsY[0];
    currentPosition = this.legend.drawLegend(legendData.source,title,positionX,positionY,fillTable,true);

    title = "Chloridegehalte (mg/l)";
    colorTable = new ColorTable();
    positionX = currentPosition.currentX;
    positionY = currentPosition.currentY;
    this.legend.drawLegend(legendData.source,title,positionX,positionY,colorTable,false);
  }
  /**-----------------------------------------------------------------------------
   */
  drawProfiles(profileData,profileOptions,checkedOptions) {
    let layout,feature,geomType,chlorideTypes,showSuitExtraction;
    let index,x,y,titleX,titleY,title,angle;
    let i,len;

    console.log("#ProfilePopup.drawProfiles()");

    console.log("profileOptions:");
    console.log(profileOptions);

    // Get profile geometry type.
    geomType = profileOptions.geometry.getType()
    console.log("Geometry Type: " + geomType);

    // Get layout.
    layout = ProfileLayout.getProfileLayout(geomType);

    // Zoom.
    zoomToExtent(profileData.map,layout.zoomExtent);
    console.log("ZoomExtent: " + layout.zoomExtent);

    if ((geomType === "Point") || (geomType === "LineString")) {

      // Create color table?
      if (!this.app.colorTable) {
        this.app.colorTable = new ColorTable();
      }

      // Create fill table?
      if (!this.app.fillTable) {
        this.app.fillTable = new FillTable();
      }

      // Get profile chloride types.
      chlorideTypes = profileOptions.value_fields;

      // Get last checkOption, ie. show suitability for extraction.
      showSuitExtraction = this.isSuitExtractionChecked(checkedOptions);

      //---------------------------------------------------------
      // Draw profiles.
      //---------------------------------------------------------
      index = 0;
      if (this.isChlorideChecked(checkedOptions)) {
        for (i = 0, len = chlorideTypes.length; i < len; i++) {
          if (checkedOptions[i]) {
            x = layout.positionsX[index];
            y = layout.positionsY[index];
            // Chloride and suitability for extraction.
            this.profile.drawProfile(profileData.source,profileOptions,x,y,
                chlorideTypes[i],this.app.colorTable,
                showSuitExtraction,this.app.fillTable);
            index += 1;
          }
        }
      } else if (showSuitExtraction) {
        // Only suitability for extraction.
        x = layout.positionsX[index];
        y = layout.positionsY[index];
        this.profile.drawProfile(profileData.source,profileOptions,x,y,
            "",null,showSuitExtraction,this.app.fillTable);
      }

      //---------------------------------------------------------
      // Draw X-as title.
      //---------------------------------------------------------
      if (geomType !== "Point") {
        titleX = layout.positionsX[0];
        titleY = layout.axisXPositionY;
        title = "Afstand (m)";
        feature = createFeatureText(title,titleX,titleY,layout.axisFont,
            "center","center",null,0);
        profileData.source.addFeatures([feature])
      }

      //---------------------------------------------------------
      // Draw Y-as title.
      //---------------------------------------------------------
      titleX = layout.axisYPositionX;
      titleY = layout.positionsY[0] + layout.columnHeight / 2;
      angle = 3.14 / -2;
      title = "Diepte tov. NAP (m)";
      feature = createFeatureText(title,titleX,titleY,layout.axisFont,
          "center","center",null,angle);

      profileData.source.addFeatures([feature])
    } else {
      alert("Geen geldig geometry type: " + geomType + " (drawProfiles)");
    }
  }
  /**-----------------------------------------------------------------------------
   */
  elementGetClientXY(id) {
    let elt, clientRect;
    elt = document.getElementById(id);
    clientRect = elt.getBoundingClientRect();
    return [clientRect.left, clientRect.top];
  }
  /**-----------------------------------------------------------------------------
   */
  exportRenderLayers(map,mapContext) {
    let opacity,matrix,transform;
    let backgroundColor;

    Array.prototype.forEach.call(
        map.getViewport().querySelectorAll(".ol-layer canvas, canvas.ol-layer"),
        function (canvas) {
          if (canvas.width > 0) {
            opacity = canvas.parentNode.style.opacity || canvas.style.opacity;
            mapContext.globalAlpha = opacity === "" ? 1 : Number(opacity);
            transform = canvas.style.transform;
            if (transform) {
              // Get the transform parameters from the style"s transform matrix.
              matrix = transform
                  .match(/^matrix\(([^\(]*)\)$/)[1]
                  .split(",")
                  .map(Number);
            } else {
              matrix = [parseFloat(canvas.style.width) / canvas.width, 0, 0,
                parseFloat(canvas.style.height) / canvas.height, 0, 0,
              ];
            }
            // Apply the transform to the export map context.
            CanvasRenderingContext2D.prototype.setTransform.apply(
                mapContext,
                matrix,
            );
            backgroundColor = "white";
            if (backgroundColor) {
              mapContext.fillStyle = backgroundColor;
              mapContext.fillRect(0, 0, canvas.width, canvas.height);
            }
            mapContext.drawImage(canvas, 0, 0);
          }
        }
    );
  }
  /**-----------------------------------------------------------------------------
   */
  exportToPDF() {
    let self = this;
    let dims,format,resolution,dim,width,height,size,viewResolution;
    let btn,mapCanvas,mapContext;
    let pdf,printSize,printScaling;
    let map;
    map = this.profileData.map;
    btn = document.getElementById("btnDownloadPDF");
    btn.disabled = true;
    dims = {a0: [1189, 841],a1: [841, 594],a2: [594, 420],a3: [420, 297],a4: [297, 210],a5: [210, 148]};
    format = "a4";
    resolution = 72; // 150, 300
    dim = dims[format];
    width = Math.round((dim[0] * resolution) / 25.4);
    height = Math.round((dim[1] * resolution) / 25.4);
    size = map.getSize();
    viewResolution = map.getView().getResolution();
    map.once("rendercomplete", function () {
      mapCanvas = document.createElement("canvas");
      mapCanvas.width = width;
      mapCanvas.height = height;
      mapContext = mapCanvas.getContext("2d");
      // Render the layers.
      self.exportRenderLayers(map,mapContext);
      // Setup for saving.
      mapContext.globalAlpha = 1;
      mapContext.setTransform(1, 0, 0, 1, 0, 0);
      pdf = new jsPDF("landscape", undefined, format);
      pdf.addImage(mapCanvas.toDataURL("image/jpeg"),"JPEG",0,0,dim[0],dim[1]);
      pdf.save("freshem_profiel.pdf");
      // Reset original map size
      map.setSize(size);
      map.getView().setResolution(viewResolution);
      btn.disabled = false;
      //document.body.style.cursor = "auto";
    });
    // Set print size.
    printSize = [width, height];
    map.setSize(printSize);
    printScaling = Math.min(width / size[0], height / size[1]);
    map.getView().setResolution(viewResolution / printScaling);
    // Do final render.
    map.renderSync();
  }
  /**-----------------------------------------------------------------------------
   */
  exportToPNG() {
    let self = this;
    let mapCanvas,size,mapContext,link;
    let map;
    map = this.profileData.map;
    map.once("rendercomplete", function () {
      mapCanvas = document.createElement("canvas");
      size = map.getSize();
      mapCanvas.width = size[0];
      mapCanvas.height = size[1];
      mapContext = mapCanvas.getContext("2d");
      self.exportRenderLayers(map,mapContext);
      mapContext.globalAlpha = 1;
      mapContext.setTransform(1, 0, 0, 1, 0, 0);
      link = document.getElementById("image-download");
      link.download = "freshem_profiel.png";
      link.href = mapCanvas.toDataURL();
      link.click();
    });
    map.renderSync();
  }
  /**-----------------------------------------------------------------------------
   */
  getCheckedOptions() {
    let btn,result;
    let i,len;
    result = [];
    for (i = 0, len = this.nrCheckButtons; i < len; i++) {
      btn = document.getElementById("chartcheck_" + i);
      result.push(btn.checked);
    }
    btn = document.getElementById("chartsuit");
    result.push(btn.checked);
    return result;
  }
  /**-----------------------------------------------------------------------------
   * Install the button event handlers.
   */
  initControls() {
    let self = this;
    let btn;

    console.log("#ProfilePopup - initControls");

    btn = document.getElementById("btnClose");
    if (btn) {
      btn.addEventListener("click", function () {
        self.onButtonCloseClick();
      }, false);
    }

    btn = document.getElementById("btnDownloadPDF");
    if (btn) {
      btn.addEventListener("click", function () {
        self.onButtonDownloadPDFClick();
      }, false);
    }
    btn = document.getElementById("btnDownloadPNG");
    if (btn) {
      btn.addEventListener("click", function () {
        self.onButtonDownloadPNGClick();
      }, false);
    }
    btn = document.getElementById("btnHome");
    if (btn) {
      btn.addEventListener("click", function () {
        self.onButtonZoomFullExtentClick();
      }, false);
    }
  }
  /**-----------------------------------------------------------------------------
   * @param map
   */
  installHoverHandler(map) {
    let self = this;

    // Get the map tip element.
    self.mapTip = document.getElementById("chartinfo");

    // Install map event handlers for hovering.
    map.on("pointermove", function (evt) {
      if (evt.dragging) {
        self.mapTip.style.visibility = "hidden";
        self.currentFeature = undefined;
        return;
      }
      self.onHover(map,self.mapTip,evt);
    });
  }
  /**-----------------------------------------------------------------------------
   */
  isChlorideChecked(checkOptions) {
    let i,len;
    for (i = 0, len = checkOptions.length-1; i < len; i++) {
      if (checkOptions[i]) {
        return true;
      }
    }
    return false;
  }
  /**-----------------------------------------------------------------------------
   */
  isSuitExtractionChecked(checkOptions) {
    return checkOptions[checkOptions.length-1];
  }
  /**-----------------------------------------------------------------------------
   */
  onButtonCloseClick() {
    $("#btnClose").parent().hide();
    this.profileOptions.src.clear();
    this.profileOptions.result_src.clear();
  }
  /**-----------------------------------------------------------------------------
   */
  onButtonDownloadPDFClick() {
    this.exportToPDF();
  }
  /**-----------------------------------------------------------------------------
   */
  onButtonDownloadPNGClick() {
    this.exportToPNG();
  }
  /**-----------------------------------------------------------------------------
   */
  onButtonZoomFullExtentClick() {
    let layout;
    layout = ProfileLayout.getProfileLayout();
    zoomToExtent(this.profileData.map,layout.zoomExtent);
  }
  /**-----------------------------------------------------------------------------
   */
  onHover(map, mapTip, evt) {
    let features,feature,pixel,clientXY1,clientXY2;
    let offsetX,offsetY,mapTipX,mapTipY,mapTipText,text,linkId;
    let controlHighlight,highlightFeature,selectedFeatures;

    pixel = map.getEventPixel(evt.originalEvent);

    features = [];
    map.forEachFeatureAtPixel(pixel,function(feature) {
      features.push(feature);
    });

    if (features.length > 0) {

      // feature = features[0];
      // console.log(feature);

      // Get map offset.
      clientXY1 = this.elementGetClientXY("chartprofile");
      clientXY2 = this.elementGetClientXY("chartpopup");
      offsetX = clientXY1[0] - clientXY2[0];
      offsetY = clientXY1[1] - clientXY2[1];

      // Must be relative to chartpopup.
      mapTipX = offsetX + pixel[0];
      mapTipY = offsetY + pixel[1] - mapTip.offsetHeight;

      mapTip.style.left = mapTipX + "px";
      mapTip.style.top = mapTipY + "px";
      mapTipText = "";

      linkId = null;

      let tag,tagsFound;
      let i,len;
      tagsFound = []
      for (i = 0, len = features.length; i < len; i++) {
        feature = features[i];
        tag = feature.get("tag");
        if (tagsFound.includes(tag)) {
          continue;
        }
        tagsFound.push(tag);
        text = feature.get("text");
        if (text !== undefined) {
          if (mapTipText === "") {
            mapTipText = text; // + "\n";
          } else {
            mapTipText = text + "\n" + mapTipText;
          }
        }
        linkId = feature.get("linkId");
        if (tagsFound.length===2) {
          break;
        }
      }
      if (linkId) {
        highlightFeature = this.profileOptions.result_src.getFeatureById(linkId);
        if (highlightFeature) {
          controlHighlight = this.app.controlHighlight;
          selectedFeatures = controlHighlight.getFeatures();
          selectedFeatures.clear();
          selectedFeatures.push(highlightFeature);
        }
      }
      if (mapTipText !== "") {
        mapTip.style.visibility = "visible";
        mapTip.innerText = mapTipText;
      } else {
        mapTip.style.visibility = "hidden";
      }
    } else {
      mapTip.style.visibility = "hidden";
    }
  }
  /**-----------------------------------------------------------------------------
   */
  onOptionsChanged() {
    let checkedProfileOptions;
    console.log("#ProfilePopup.onButtonZoomFullExtend");

    // Check if initialized.
    if (!this.profileData) {
      return;
    }

    // Clear profiles and legend.
    this.profileData.source.clear();

    // Draw the legend.
    this.drawLegends(this.profileData);

    // Get checked profile options and draw the corresponding profiles.
    checkedProfileOptions = this.getCheckedOptions();

    // Update showSuitExtraction flag.
    this.app.showSuitExtraction = checkedProfileOptions[checkedProfileOptions.length-1];

    // Redraw profiles.
    this.drawProfiles(this.profileData,this.profileOptions,checkedProfileOptions);
  }
  /**-----------------------------------------------------------------------------
   */
  setCheckedOptions(profileOptions) {
    let value,checkElt;
    let i,len;
    for (i = 0, len = profileOptions.value_fields.length; i < len; i++) {
      value = profileOptions.value_fields[i];
      if (profileOptions.default_plots.includes(value)) {
        //console.log("#ProfilePopup.setCheckedOptions() - CheckedOption ON");
        checkElt = document.getElementById("chartcheck_"+i);
        if (checkElt) {
          checkElt.checked = true;
        }
      }
    }
  }
  /**-----------------------------------------------------------------------------
   * Shows the popup.
   * @param options
   */
  showPopup(options) {
    let checkedProfileOptions;

    console.log("#ProfilePopup.showPopup()");

    // Save options.
    this.profileOptions = options;

    // Create the popup.
    this.createPopup(options);

    // Create the map.
    this.profileData = this.createMap("chartprofile",this.showCoords, false);

    // Create the profile map tip.
    this.installHoverHandler(this.profileData.map);

    // Install event handlers.
    this.initControls();

    // Set checked profile options based on the general options.
    this.setCheckedOptions(options);

    // Draw the legends.
    this.drawLegends(this.profileData);

    // Get checked profile options and draw the corresponding profiles.
    checkedProfileOptions = this.getCheckedOptions();
    this.drawProfiles(this.profileData,this.profileOptions,checkedProfileOptions);
  }
}
