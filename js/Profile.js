/**----------------------------------------------------------------------------------------------------
 * Draws a point or line profile.
 *
 * European Union Public Licence V. 1.2
 * EUPL © the European Union 2007, 2016
 *
 * Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 */

import Feature from "ol/Feature";
import LineString from "../node_modules/ol/geom/LineString.js";
import VectorSource from "ol/source/Vector";
import {
  createFeatureBox,
  createFeatureLine,
  createFeatureLineSegments,
  createFeaturePoint,
  createFeatureRect,
  createFeatureText,
} from "./OLUtils";
import {createFillStyle} from "./OLUtils";
import {ProfileLayout} from "./ProfileLayout";

/**-----------------------------------------------------------------------------
 */
export default class Profile {

  app = null;

  voxelHeight = 0.5;

  columnWidth = 0;
  columnHeight = 0;

  columnLineWidth = 0.5;

  titleFont = "";
  titleFontSize = 10;
  titleHeight = 0;
  titleMargin = 2;

  tickFont = "";
  tickDeltaValueY = 0;
  tickLength = 0;
  tickTextMargin = 0;

  /**-----------------------------------------------------------------------------
   */
  constructor(app) {
    let layout,pixelSize;

    this.app = app;

    layout = ProfileLayout.getLegendLayout();

    pixelSize = layout.pixelSize;

    this.titleFont = layout.font;
    this.titleFontSize = layout.fontSize;
    this.titleHeight = this.titleFontSize * pixelSize;

    this.tickFont = layout.tickFont;

    this.tickDeltaValueY = 5;
  }
  /**-----------------------------------------------------------------------------
   * Calculates the distance between two points (a point is an array of
   * 2 coordinates).
   */
  calcPointDistance(p1,p2) {
    let line;
    line = new LineString([p1, p2]);
    return line.getLength();
  }
  /**-----------------------------------------------------------------------------
   * Code uit blok 99.
   *
   * Uitgangspunten:
   * - voxels hoogte = 0.5m.
   * - data depths = diepte onder maaiveld.
   * - data depths = middelpunt van de voxel.
   * - data depths = van laag naar hoog, ie. van -43.75 naar 0.25
   * [- data depths = met een vast interval ie. 0.5m]
   *
   * Geeft de minDepth en de opeenvolgende block hoogtes en bijbehorende values terug.
   *
   * @param depths            midpoint of voxels.
   * @param values            voxel values.
   * @param voxelHeight       default voxel height.
   */
  dataDensify(depths,values,voxelHeight) {
    let hVoxelHeightM,prevValue,prevDataBlockStart,currDataBlockStart;
    let lowerDataDepth, upperDataDepth;
    let dataBlockHeights,dataBlockHeight;
    let value,depth,newValues;
    let i,len;

    hVoxelHeightM = voxelHeight / 2;
    lowerDataDepth = depths[0] - hVoxelHeightM;
    upperDataDepth = depths[depths.length - 1] + hVoxelHeightM;

    dataBlockHeights = [];
    newValues = [];

    // Set beginof first block.
    prevDataBlockStart = lowerDataDepth;
    prevValue = values[0];

    for (i = 0, len = depths.length; i < len; ++i) {
      // Get data depth and value.
      depth = depths[i];
      value = values[i];
      // New value?
      if (value !== prevValue) {
        // Close current block.
        currDataBlockStart = depth - hVoxelHeightM;
        dataBlockHeight = currDataBlockStart - prevDataBlockStart
        // Save.
        dataBlockHeights.push(dataBlockHeight);
        newValues.push(prevValue);
        // Update.
        prevDataBlockStart = currDataBlockStart;
        prevValue = value;
      }
    }
    // Close last block.
    dataBlockHeight = (depth + hVoxelHeightM) - prevDataBlockStart
    dataBlockHeights.push(dataBlockHeight);
    newValues.push(value);

    return {
      lowerDataDepth: lowerDataDepth,
      upperDataDepth: upperDataDepth,
      dataBlockHeights: dataBlockHeights,
      values: newValues,
    }
  }
  /**-----------------------------------------------------------------------------
   * Draws one point profilecolumn, or one full line profile.
   *  "z": "[-43.75, -43.25, -42.75, -42.25, -41.75, -41.25, -40.75,
   *  "chloride_laag": "[15000, 15000, 15000, 15000, 15000, 15000,
   * @param source
   * @param options
   * @param positionX
   * @param positionY
   * @param chlorideType
   * @param colorTable
   * @param showSuitExtraction
   * @param fillTable
   */
  drawProfile(source, options, positionX, positionY, chlorideType, colorTable,
              showSuitExtraction, fillTable) {
    let inputSource,inputFeatures,geomType,features,feature,style;
    let lowerDataDepth,upperDataDepth;
    let maxNrFeatures,layout,isPoint,isLine,x,y;
    let origFeatures,searchDistance,totalProfileLength;
    let segments,profileFeature,chlorideData,suitExtractionData;
    let featuresToAdd,nrInputFeatures,isChloride;
    let title,breakAt;
    let USE;

    console.log("#Profile.drawProfile()");

    // Get profile geometry type.
    geomType = options.geometry.getType()
    isPoint = (geomType === "Point");
    isLine = !isPoint;

    console.log("Geometry Type: " + geomType);

    features = [];

    // Get search distance (caution: is different for point and line profile).
    searchDistance = options.search_distance;

    // Get layout.
    layout = ProfileLayout.getProfileLayout(geomType);

    // Width and height of profile column in map units.
    this.columnWidth = layout.columnWidth;
    this.columnHeight = layout.columnHeight;

    // Ticks length and margin.
    this.tickLength = layout.tickLength;
    this.tickTextMargin = layout.tickTextMargin;

    // Create temporary vector source.
    inputSource = new VectorSource();

    // Clone original input features.
    origFeatures = options.result_src.getFeatures();
    inputFeatures = this.featuresClone(origFeatures)

    inputSource.addFeatures(inputFeatures);

    //----------------------------------------------------------
    // Check input features.
    //----------------------------------------------------------

    if (inputFeatures.length === 0) {
      $('#geodesic_profile').innerHTML = "Geen data gevonden binnen de zoekafstand.";
      return;
    }

    if (isPoint) {
      maxNrFeatures = 1;
    } else {
      maxNrFeatures = inputFeatures.length;
    }

    //----------------------------------------------------------
    // Testing? Simulate drawing the test geometry.
    //----------------------------------------------------------
    if (this.app.config.TEST_SIMULATE_DRAW) {
      console.log("### Using: TEST_SIMULATE_DRAW");
      this.testSimulateDraw(options);
    }

    //----------------------------------------------------------
    // Get segments of drawn line.
    //----------------------------------------------------------

    // Get drawn point or line feature.
    profileFeature = options.src.getFeatures()[0];
    segments = [];
    totalProfileLength = 0;
    if (isLine) {
      chlorideData = this.lineCreateSegments(profileFeature);
      segments = chlorideData.segments;
      totalProfileLength = chlorideData.totalProfileLength;
    }
    console.log("Nr. segments: " + segments.length);

    //----------------------------------------------------------
    // Add "profile_posx" to input features, ie. cum. distance.
    //----------------------------------------------------------

    // For each returned profile point see which segment(s) is closer than the search distance given.
    // Find the closest pont on that segment and add the cummulative distance from the beginning of
    // the profile as an attribute.

    featuresToAdd = [];
    nrInputFeatures = inputFeatures.length;
    if (nrInputFeatures > 1) {
      console.log("### Add profile_posx");
      console.log("searchDistance: " + searchDistance);
      featuresToAdd = this.featuresSetProfilePositionX(inputFeatures,segments,searchDistance);
      // Add extra features.
      console.log("Features to Add: " + featuresToAdd.length);
      inputSource.addFeatures(featuresToAdd);
    } else {
      feature = inputFeatures[0];
      feature.set("profile_posx",searchDistance);
      totalProfileLength = searchDistance;
    }

    //----------------------------------------------------------
    // Sort the points in order along the line.
    //----------------------------------------------------------

    console.log("Sorting inputfeatures...");

    // Sort features on profile_posx.
    inputFeatures = inputSource.getFeatures().sort(function(a,b) {
      // noinspection JSUnresolvedReference
      return parseFloat(a.get("profile_posx")) - parseFloat(b.get("profile_posx"));
    });

    //----------------------------------------------------------
    // Set early stop.
    //----------------------------------------------------------
    //breakAt = 0;          // 1 subprofile.
    // breakAt = 1;
    breakAt = -1;
    if (breakAt >= 0) {
      console.log("######### breakAt: " + breakAt);
    }

    //----------------------------------------------------------
    // Draw Chloride.
    //----------------------------------------------------------
    if (chlorideType !== "") {

      // Get Chloride data.
      chlorideData = this.featuresGetChlorideData(options,inputFeatures,
          maxNrFeatures,chlorideType,this.voxelHeight);

      // Add some extra space at the top and bottom of the profiles.
      chlorideData.upperDataDepth += 1;
      chlorideData.lowerDataDepth -= 1;

      lowerDataDepth = chlorideData.lowerDataDepth;
      upperDataDepth = chlorideData.upperDataDepth;

      // Draw.
      isChloride = true;
      this.drawProfileColumns(features,maxNrFeatures,chlorideData,positionX,positionY,
                searchDistance,totalProfileLength,isPoint,isChloride,colorTable);
    }

    // Draw suitable for extraction.
    if (showSuitExtraction) {

      // Get extraction data.
      suitExtractionData = this.featuresGetChlorideData(options,inputFeatures,
                                    maxNrFeatures,"suit_extraction",this.voxelHeight);

      // No chloride data?
      if (chlorideType === "") {
        // Add some extra space at the top and bottom of the profiles.
        suitExtractionData.upperDataDepth += 1;
        suitExtractionData.lowerDataDepth -= 1;

        lowerDataDepth = suitExtractionData.lowerDataDepth;
        upperDataDepth = suitExtractionData.upperDataDepth;
      }

      // Draw.
      isChloride = false;
      this.drawProfileColumns(features,maxNrFeatures,suitExtractionData,positionX,positionY,
          searchDistance,totalProfileLength,isPoint,isChloride,fillTable);
    }

    USE = false;
    //USE = true;
    if (USE) {
      console.log("############################# TICKS");
      console.log("upperDataDepth  : " + upperDataDepth);
      console.log("lowerDataDepth  : " + lowerDataDepth);
      console.log("tickLength      : " + this.tickLength);
      console.log("#############################");
    }

    //---------------------------------------------------------
    // Draw y-axis ticks.
    //---------------------------------------------------------
    x = positionX;
    y = positionY;
    this.drawTicksYAxis(features,x,y,lowerDataDepth,upperDataDepth);

    //---------------------------------------------------------
    // Draw x-axis ticks.
    //---------------------------------------------------------
    if (isLine) {
      x = positionX;
      y = positionY;
      this.drawTicksXAxis(features,x,y,totalProfileLength);
    }

    //---------------------------------------------------------
    // Draw column box.
    //---------------------------------------------------------
    x = positionX;
    y = positionY;
    style = createFillStyle(null,"black",this.columnLineWidth);
    feature = createFeatureBox(x,y,this.columnWidth,this.columnHeight,style);
    features.push(feature);

    //---------------------------------------------------------
    // Draw title.
    //---------------------------------------------------------

    // Add title margin.
    x = positionX;
    y = positionY + this.columnHeight + this.titleMargin;

    title = "Profiel grondwater\n";
    if (chlorideType !== "") {
      title += chlorideType.replace("_", " ");
    } else {
      title += "Geschiktheid onttrekking"
    }
    this.drawTitle(features,x,y,title);

    //---------------------------------------------------------
    // Add all features.
    //---------------------------------------------------------
    source.addFeatures(features);
  }
  /**-----------------------------------------------------------------------------
   */
  drawProfileColumns(features,maxNrFeatures,profileData,
                     positionX,positionY,searchDistance,totalProfileLength,
                     isPoint,isChloride,styleTable,breakAt) {

    let dataBlockHeights,dataBlockHeightsList;
    let values,valuesList;
    let subLowerDataDepth,subLowerDataDepthList;
    let profileX,profileXList,linkId,linkIdList;
    let searchDistance2,searchDistance4;
    let profileWidth1,profileWidth2;
    let factorX,factorY,boxOffsetX,boxOffsetY,boxX,boxY,boxWidth1,boxWidth2;
    let lowerDataDepth,upperDataDepth,dataHeight;
    let i;

    valuesList = profileData.valuesList;
    dataBlockHeightsList = profileData.dataBlockHeightsList;
    subLowerDataDepthList = profileData.subLowerDataDepthList;
    profileXList = profileData.profileXList;
    linkIdList = profileData.linkIdList;
    lowerDataDepth = profileData.lowerDataDepth;
    upperDataDepth = profileData.upperDataDepth;

    searchDistance2 = searchDistance * 2;
    searchDistance4 = searchDistance * 4;

    dataHeight = Math.abs(upperDataDepth - lowerDataDepth);
    factorY = this.columnHeight / dataHeight;
    factorX = this.columnWidth / totalProfileLength;

    // Set start position, in mapunits.
    if (isPoint) {
      boxOffsetX = 0;
    } else {
      // Set origin, in mapunits.
      boxOffsetX = positionX - (this.columnWidth / 2);
    }

    console.log("### searchDistance    : " + searchDistance);
    console.log("### totalProfileLength: " + totalProfileLength);
    console.log("### boxOffsetX        : " + boxOffsetX);
    console.log("---------------------------------------");

    // Draw one of more profile columns.
    for (i = 0; i < maxNrFeatures; i++) {
      dataBlockHeights = dataBlockHeightsList[i];
      values = valuesList[i];
      subLowerDataDepth = subLowerDataDepthList[i];
      profileX = profileXList[i];
      linkId = linkIdList[i];

      if (isPoint) {
        // Always one feature.
        boxX = positionX;
        boxWidth1 = this.columnWidth / 2;
        boxWidth2 = boxWidth1;
      } else {
        // Lines. Calculate the boxX and boxWidth in mapunits based on the profileDistance.
        // Calculate profileWidth1.
        if (i === 0) {
          profileWidth1 = profileX;
          if (profileWidth1 > searchDistance4) profileWidth1 = searchDistance4;
        } else {
          profileWidth1 = (profileX - profileXList[i-1]) / 2;
          if (profileWidth1 > searchDistance2) profileWidth1 = searchDistance2;
        }
        // Calculate profileWidth2.
        if (i === (maxNrFeatures-1)) {
          profileWidth2 = totalProfileLength - profileX;
          if (profileWidth2 > searchDistance4) profileWidth2 = searchDistance4;
        } else {
          profileWidth2 = profileXList[i+1] - profileX;
          if (profileWidth2 > searchDistance2) profileWidth2 = searchDistance2;
        }
        boxWidth1 = profileWidth1 * factorX;
        boxWidth2 = profileWidth2 * factorX;
        boxX = profileX * factorX;
        boxX = boxOffsetX + boxX
      }

      // Draw profile, from bottom to top.
      boxOffsetY = Math.abs(lowerDataDepth - subLowerDataDepth) * factorY;
      boxY = positionY + boxOffsetY;

      this.drawProfileColumn(features,dataBlockHeights,values,linkId,
          isChloride,subLowerDataDepth,factorY,
          boxX,boxY,boxWidth1,boxWidth2,styleTable);

      // Set position next column.
      boxX += boxWidth1 + boxWidth2;
      if ((breakAt >= 0) && (i === breakAt)) {
        break;
      }
    }
  }
  /**-----------------------------------------------------------------------------
   */
  drawProfileColumn(features, dataBlockHeights, values, linkId,
                    isChloride, subLowerDataDepth,
                    factorY, boxX, boxY, boxWidth1, boxWidth2, styleTable) {
    let dataBlockEnd,dataBlockHeight,value,boxHeight,style,feature,text;
    let i,len;

    dataBlockEnd = subLowerDataDepth;
    for (i = 0, len = dataBlockHeights.length; i < len; i++) {

      // Get block/segment height and value.
      dataBlockHeight = dataBlockHeights[i];
      value = values[i];

      // Calculate box height.
      boxHeight = dataBlockHeight * factorY;

      // Create box.
      style = styleTable.getStyle(value)
      feature = createFeatureRect(boxX,boxY,boxWidth1,boxWidth2,boxHeight,style);

      if (isChloride) {
        text = (dataBlockEnd + dataBlockHeight).toFixed(1) + " tot " + dataBlockEnd.toFixed(1);
        text += " : " + value;
        text += " mg/l";
        feature.set("text", text, true);
        feature.set("linkId", linkId, true);
        feature.set("tag", "Chlo", true);
      } else {
        text = (dataBlockEnd + dataBlockHeight).toFixed(1) + " tot " + dataBlockEnd.toFixed(1);
        text += " : " + styleTable.getText(value) + " (" + value + ")";
        feature.set("text", text, true);
        feature.set("linkId", linkId, true);
        feature.set("tag", "Suit", true);
      }

      features.push(feature);
      boxY += boxHeight;

      dataBlockEnd += dataBlockHeight;
    }
  }
  /**-----------------------------------------------------------------------------
   * @param features
   * @param x
   * @param y
   * @param dataLength
   */
  drawTicksXAxis(features,x,y,dataLength) {
    let feature,text;
    let tickX,tickY1,tickY2,tickTextY,tickValue,tickDeltaValue,offsetX,factorX;

    offsetX = x - this.columnWidth / 2;
    tickY2 = y;
    tickY1 = tickY2 - this.tickLength;
    tickTextY = tickY1 - this.tickTextMargin;

    // 1 data unit is x col units.
    factorX = this.columnWidth / dataLength;

    // Max. length is 10000.
    if (dataLength <= 500) {
      tickDeltaValue = 100;
    } else if (dataLength <= 1000) {
      tickDeltaValue = 200;
    } else if (dataLength <= 3000) {
      tickDeltaValue = 500;
    } else if (dataLength <= 5000) {
      tickDeltaValue = 1000;
    } else {
      tickDeltaValue = 2000;
    }

    // Loop de ticks.
    tickValue = 0;
    while (true) {
      if (tickValue > dataLength) {
        break;
      }
      tickX = offsetX + (tickValue * factorX);

      // Draw tick.
      feature = createFeatureLine(tickX, tickY1, tickX, tickY2, "black", 1);
      features.push(feature);

      // Draw box label.
      text = "" + tickValue;
      feature = createFeatureText(text,tickX,tickTextY,this.tickFont,"middle","top");
      features.push(feature);

      tickValue += tickDeltaValue;
    }
  }
  /**-----------------------------------------------------------------------------
   * @param features
   * @param x
   * @param y
   * @param lowerDataDepth
   * @param upperDataDepth
   */
  drawTicksYAxis(features,x,y,lowerDataDepth,upperDataDepth) {
    let feature,text;
    let hColumnWidth,colTop,colDepth,factorY,dataHeight,dataOffsetY;
    let tickX1,tickX2,tickY,tickTextX,tickValue;
    let USE;

    // Draw top down.
    hColumnWidth = this.columnWidth / 2;

    tickX2 = x - hColumnWidth;
    tickX1 = tickX2 - this.tickLength;
    tickTextX = tickX1 - this.tickTextMargin;

    colTop = y + this.columnHeight;

    dataHeight = Math.abs(upperDataDepth - lowerDataDepth);

    // 1 data unit is x col units.
    factorY = this.columnHeight / dataHeight;

    dataOffsetY = upperDataDepth;                    // Afstand naar 0.

    // Loop the ticks.
    tickValue = 0;
    while (true) {
      if (tickValue < lowerDataDepth) {
        // Lower limit.
        break;
      }
      if (tickValue <= upperDataDepth) {

        dataOffsetY = upperDataDepth;                    // Afstand naar 0.
        colDepth = (tickValue - dataOffsetY) * factorY;
        tickY = colTop + colDepth;

        if (tickY < 0) {
          break;
        }

        USE = false;
        if (USE) {
          console.log("colTop      : " + colTop);
          console.log("tickValue   : " + tickValue);
          console.log("colDepth    : " + colDepth);
          console.log("dataOffsetY : " + dataOffsetY);
          console.log("tickY       : " + tickY);
          console.log("tickX1 - X2 : " + tickX1 + " " + tickX2);
        }

        // Draw tick.
        feature = createFeatureLine(tickX1, tickY, tickX2, tickY, "black", 1);
        features.push(feature);

        // Draw box label.
        text = "" + tickValue;
        feature = createFeatureText(text,tickTextX,tickY,this.tickFont,"right","middle");
        features.push(feature);
      }
      tickValue -= this.tickDeltaValueY;
    }
  }
  /**-----------------------------------------------------------------------------
   * @param features
   * @param x
   * @param y
   * @param title
   */
  drawTitle(features,x,y,title) {
    let feature;
    feature = createFeatureText(title,x,y,this.titleFont,"center","bottom");
    features.push(feature);
  }
  /**-----------------------------------------------------------------------------
   */
  featuresClone(features) {
    let newFeatures,feature;
    let i,len;
    newFeatures = [];
    for (i = 0, len = features.length; i < len; i++) {
      feature = features[i].clone();
      feature.setId(features[i].getId());
      newFeatures.push(feature);
    }
    return newFeatures;
  }
  /**-----------------------------------------------------------------------------
   */
  featuresGetChlorideData(options, features, maxNrFeatures, chlorideType, voxelHeight) {
    let valuesList,dataBlockHeightsList,subLowerDataDepthList,profileXList,linkIdList;
    let depths,values,profileX,linkId,profileData;
    let lowerDataDepth,upperDataDepth;
    let i;

    console.log("#Profile.featuresGetChlorideData()");

    valuesList = [];
    dataBlockHeightsList = [];
    subLowerDataDepthList = [];
    profileXList = [];
    linkIdList = [];
    lowerDataDepth = Number.MAX_VALUE;
    upperDataDepth = Number.MIN_VALUE;
    for (i = 0; i < maxNrFeatures; i++) {

      // Get depths, values, profileLengths, linkIds(for highlighting) .
      // Caution: Z values must be sorted ascending.
      depths = JSON.parse(features[i].get(options.z_field));
      values = JSON.parse(features[i].get(chlorideType));
      profileX = features[i].get("profile_posx");
      linkId = features[i].getId();

      // Densify voxels to blocks.
      profileData = this.dataDensify(depths,values,voxelHeight);

      // Calculate lower and upper data depth.
      if (profileData.lowerDataDepth < lowerDataDepth) {
        lowerDataDepth = profileData.lowerDataDepth;
      }
      if (profileData.upperDataDepth > upperDataDepth) {
        upperDataDepth = profileData.upperDataDepth;
      }

      // Add to lists.
      valuesList.push(profileData.values);
      dataBlockHeightsList.push(profileData.dataBlockHeights);
      subLowerDataDepthList.push(profileData.lowerDataDepth);
      profileXList.push(profileX);
      linkIdList.push(linkId);
    }
    return {
      valuesList: valuesList,
      dataBlockHeightsList: dataBlockHeightsList,
      subLowerDataDepthList: subLowerDataDepthList,
      profileXList: profileXList,
      linkIdList: linkIdList,
      lowerDataDepth: lowerDataDepth,
      upperDataDepth: upperDataDepth,
    }
  }
  /**-----------------------------------------------------------------------------
   */
  featuresSetProfilePositionX(features, segments, searchDistance) {
    let featuresToAdd,feature,cumLength,segment,closestPntOnSegment,pntDist;
    let i,j,len;
    featuresToAdd = [];
    if (features.length > 1) {

      console.log("###Profile.featuresSetProfilePositionX()");
      console.log("searchDistance: " + searchDistance);

      for (i = 0; i < features.length;i++) {
        feature = features[i];
        cumLength = 0;
        for (j = 0, len = segments.length; j < len; j++) {
          segment = segments[j];
          if (j > 0) {
            cumLength += segments[j-1].get("length");
          }
          closestPntOnSegment = segment.getGeometry().getClosestPoint(feature.getGeometry().getCoordinates()[0]);

          pntDist = this.calcPointDistance(closestPntOnSegment,feature.getGeometry().getCoordinates()[0])

          // console.log("closestPntOnSegment: " + closestPntOnSegment);
          // console.log("pntDist: " + pntDist);
          // console.log("searchDistance: " + searchDistance);

          if (pntDist < searchDistance) {
            if (feature.getKeys().indexOf("profile_posx") > -1) {
              // The point is on another segment as well, eg. inward of a sharp corner. So we'll duplicate the
              // point and add a new distance.
              featuresToAdd.push(feature.clone());
            }
            pntDist = this.calcPointDistance(segment.getGeometry().getFirstCoordinate(),closestPntOnSegment)
            feature.set("profile_posx", cumLength + pntDist);
          }
        }
      }
    } else {
      feature = features[0];
      feature.set("profile_posx",searchDistance);
    }
    return featuresToAdd;
  }
  /**-----------------------------------------------------------------------------
   */
  lineCreateSegments(lineFeature) {
    let segments,vertices,lastVertex,vertex,tmpSegment,tmpSegmentLength,tmpFeature,totalProfileLength;
    let i,len;
    segments = [];
    totalProfileLength = 0;
    vertices = lineFeature.getGeometry().getCoordinates();
    lastVertex = false;
    for (i = 0,len = vertices.length; i < len; i++) {
      vertex = vertices[i];
      if (!lastVertex) {
        lastVertex = vertex;
      } else {
        // Create temporary linesegment.
        tmpSegment = new LineString([lastVertex,vertex]);
        tmpSegmentLength = tmpSegment.getLength();
        tmpFeature = new Feature({
          geometry: tmpSegment,
          length: tmpSegmentLength,
        });
        segments.push(tmpFeature);
        totalProfileLength += tmpSegmentLength;
        lastVertex = vertex;
      }
    }
    return {
      segments: segments,
      totalProfileLength: totalProfileLength,
    }
  }
  /**-----------------------------------------------------------------------------
   */
  testSimulateDraw(options) {
    let config,x1,y1,points,index,testFeature,geomType,isPoint;
    let i,len;

    geomType = options.geometry.getType()
    isPoint = (geomType === "Point");

    console.log("Geometry Type: " + geomType);

    config = this.app.config;
    if (isPoint) {
      x1 = config.testPointFeature[0];
      y1 = config.testPointFeature[1];
      testFeature = createFeaturePoint(x1,y1,null,1);
    } else {
      points = [];
      index = 0;
      for (i = 0, len = config.testLineFeature.length / 2; i < len; i++) {
        x1 = config.testLineFeature[index];
        index += 1;
        y1 = config.testLineFeature[index];
        index += 1;
        points.push([x1,y1]);
      }
      testFeature = createFeatureLineSegments(points,null,1);
    }
    options.src.clear()
    options.src.addFeatures([testFeature]);
  }
}