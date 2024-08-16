/**----------------------------------------------------------------------------------------------------
 * OpenLayers utilities.
 *
 * European Union Public Licence V. 1.2
 * EUPL © the European Union 2007, 2016
 *
 * Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 */

import {easeOut} from "ol/easing";
import {Circle as CircleStyle, Fill, Stroke, Style, Text} from "ol/style";
import FillPattern from "ol-ext/style/FillPattern";
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";
import Point from "ol/geom/Point";

/**-----------------------------------------------------------------------------
 * @param x             middelpunt van onderkant box.
 * @param y             y is onderkant box.
 * @param width
 * @param height
 * @param style
 * @returns {Feature<Polygon>}
 */
export let createFeatureBox = function(x,y,width,height,style) {
  let x1, y1, x2, y2, hWidth;
  let coords;
  let feature;
  hWidth = width / 2;
  x1 = x - hWidth;
  y1 = y;
  x2 = x + hWidth;
  y2 = y + height;
  coords = [[[x1, y1], [x1, y2], [x2, y2], [x2, y1], [x1, y1]]];
  feature = new Feature({
    geometry: new Polygon(coords)
  });
  feature.setStyle(style)
  return feature;
}
/**-----------------------------------------------------------------------------
 * @param x             middelpunt van onderkant box tov. widthLeft en widthRight.
 * @param y             y is onderkant box.
 * @param widthLeft
 * @param widthRight
 * @param height
 * @param style
 * @returns {Feature<Polygon>}
 */
export let createFeatureRect = function(x,y,widthLeft,widthRight,height,style) {
  let x1, y1, x2, y2;
  let coords;
  let feature;
  x1 = x - widthLeft;
  y1 = y;
  x2 = x + widthRight;
  y2 = y + height;
  coords = [[[x1, y1], [x1, y2], [x2, y2], [x2, y1], [x1, y1]]];
  feature = new Feature({
    geometry: new Polygon(coords)
  });
  feature.setStyle(style)
  return feature;
}
/**-----------------------------------------------------------------------------
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @param color
 * @param width
 * @returns {Feature<LineString>}
 */
export let createFeatureLine = function(x1,y1,x2,y2,color=null,width=-1) {
  let points,feature,style;
  points = [[x1,y1],[x2,y2]];
  feature = new Feature({
    geometry: new LineString(points)
  });
  if (color) {
    if (width <= 0) {
      width = 1;
    }
    style = createLineStyle(color,width);
    feature.setStyle(style);
  }
  return feature;
}
/**-----------------------------------------------------------------------------
 * @param points        Points as [[x1,y1],[x2,y2]]
 * @param color
 * @param width
 * @returns {Feature<LineString>}
 */
export let createFeatureLineSegments = function(points,color=null,width=-1) {
  let feature,style;
  feature = new Feature({
    geometry: new LineString(points)
  });
  if (color) {
    if (width <= 0) {
      width = 1;
    }
    style = createLineStyle(color,width);
    feature.setStyle(style);
  }
  return feature;
}
/**-----------------------------------------------------------------------------
 * @param x
 * @param y
 * @param color
 * @param size
 * @returns {Feature<Point>}
 */
export let createFeaturePoint = function(x,y,color=null,size=-1) {
  let feature,style;
  feature = new Feature({
    geometry: new Point([x, y]),
  });
  if (color) {
    if (size <= 0) {
      size = 1;
    }
    style = createPointStyle(color, size);
    feature.setStyle(style);
  }
  return feature;
}
/**-----------------------------------------------------------------------------
 * @param text
 * @param x
 * @param y
 * @param font
 * @param hAlign
 * @param vAlign
 * @param backgroundColor
 * @param angle
 * @returns {Feature<Point>}
 */
export let createFeatureText = function (text,x,y,font,hAlign,vAlign,backgroundColor=null,angle=0) {
  let feature, style;
  feature = new Feature({
    geometry: new Point([x,y])
  });
  style = createTextStyle(text,font,hAlign,vAlign,backgroundColor,angle);
  feature.setStyle(style);
  return feature;
}
/**-----------------------------------------------------------------------------
 * @param fillColor
 * @param lineColor
 * @param lineWidth
 * @returns {Style}
 */
export let createFillStyle = function(fillColor,lineColor,lineWidth=1) {
  let style,fill,stroke;

  fill = undefined;
  if (fillColor) {
    fill = new Fill({
      color: fillColor
    });
  }
  if (lineColor) {
    stroke = new Stroke({
      color: lineColor,
      width: lineWidth,
    })
  } else {
    stroke = new Stroke({
      color: fillColor,
      width: 1,
    })
  }
  style = new Style({
    fill: fill,
    stroke: stroke,
  });
  return style;
}
/**-----------------------------------------------------------------------------
 * @param color
 * @param width
 * @returns {Style}
 */
export let createLineStyle = function(color,width) {
  return new Style({
    stroke : new Stroke({
      color: color,
      width: width,
    }),
  });
}
/**-----------------------------------------------------------------------------
 * @param {String} pattern       dot,square,cross,hatch
 * @param {String} color
 * @param {boolean} showOutLine
 * @param size
 * @param spacing
 * @param angle
 * @returns Style
 */
export let createPatternStyle = function(pattern,color,showOutLine=false,
                                         size=5,spacing=10,angle=0) {
  let stroke = undefined;
  if (showOutLine) {
    stroke = new Stroke({
      color: color,
      width: 1,
    })
  }
  // noinspection JSCheckFunctionSignatures
  return new Style({
    fill: new FillPattern({
      //pattern: "hatch", //"cross", //"dot", //(p!=='Image (PNG)') ? p : undefined,
      pattern: pattern,
      image: undefined,
      ratio: 1,
      icon: undefined,
      color: color,
      offset: 0,
      scale: 0.7,
      fill: undefined,
      size: size,
      spacing: spacing,
      angle: angle,
    }),
    stroke: stroke
  });
}
/**-----------------------------------------------------------------------------
 * @param color
 * @param size
 * @returns {Style}
 */
export let createPointStyle = function(color,size) {
  return new Style({
    image: new CircleStyle({
      radius: size,
      fill: new Fill({color: color}),
    }),
  });
}
/**-----------------------------------------------------------------------------
 * @param text
 * @param font
 * @param hAlign      text tov. punt (left,right,center).
 * @param vAligh      text tov. punt (bottom,middle,top).
 * @param backgroundColor
 * @param angle
 * @returns {Style}
 */
export let createTextStyle = function(text,font,hAlign,vAligh,backgroundColor=null,angle=0) {
  let fill;
  let style = new Style({
    text: new Text({
      font: font,
      text: text,
      textAlign: hAlign,
      justify: hAlign,
      textBaseline: vAligh,
      rotation: angle,
      fill: new Fill({
        color: "black",
      }),
    }),
  });
  if (backgroundColor) {
    fill = new Fill({
      color: backgroundColor,
    });
    style.getText().setBackgroundFill(fill);
  }
  return style;
}
/**---------------------------------------------------------------------------
 * @param v
 * @returns {boolean}
 */
export let isSet = function(v) {
  if (typeof v === 'undefined') {
    return false;
  } else {
    return v !== null;
  }
}
/**---------------------------------------------------------------------------
 * Zoom to extent.
 *
 * @method zoomToExtent
 * @param {Map} map - The map.
 * @param {Extent|Object} extent - Extent to zoom to.
 * - Example: [minx,miny,maxx,maxy] or {minx,miny,maxx,maxy}.
 * @param {Number} [duration] - Easing duration.
 * - Default: 250
 */
export let zoomToExtent = function(map,extent,duration=250) {
  let newExtent = null;

  // Check extent.
  if (!extent) {
    return;
  }

  // Do we have an array?
  if (Array.isArray(extent)) {
    // We have an array.
    newExtent = extent;
  } else {
    // We have an object with a minx property?
    if (isSet(extent.minx) && isSet(extent.miny) &&
      isSet(extent.maxx) && isSet(extent.maxx)) {
      newExtent = [Number(/** @type {?} */extent.minx),
        Number(/** @type {?} */extent.miny),
        Number(/** @type {?} */extent.maxx),
        Number(/** @type {?} */extent.maxy)];
    }
  }

  // Check new extent.
  if (!newExtent) {
    return;
  }
  // Zoom to extent.
  map.getView().fit(newExtent,/** @type {?} */{
    duration: duration,
    easing: easeOut
  });
}
