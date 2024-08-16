/**----------------------------------------------------------------------------------------------------
 * Draws the legend.
 *
 * European Union Public Licence V. 1.2
 * EUPL © the European Union 2007, 2016
 *
 * Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 */

import {createFeatureBox, createFeaturePoint, createFeatureText, createFillStyle} from "./OLUtils";
import {ProfileLayout} from "./ProfileLayout";

/**-----------------------------------------------------------------------------
 */
export default class ProfileLegend {

  // Main app.
  app = null;

  // Legend margin.
  legendMargin = 1;

  // Title font, height and margin.
  titleFont = "";
  titleFontSize = 1;
  titleHeight = 0;
  titleMargin = 0;

  // Box font.
  boxFont = "";
  boxFontSize = 1;

  // Box width and height.
  boxWidth = 9;
  boxHeight = 3;

  // Box margins.
  boxMarginTop = 1;
  boxMarginRight = 1;

  /**-----------------------------------------------------------------------------
   */
  constructor(app) {
    let layout,pixelSize;

    this.app = app;

    layout = ProfileLayout.getLegendLayout();

    pixelSize = layout.pixelSize;

    this.titleFont = layout.legendTitleFont;
    this.titleFontSize = layout.legendTitleFontSize;

    this.titleHeight = this.titleFontSize * pixelSize;
    this.titleMargin = 0;

    this.boxFont = layout.legendBoxFont;
    this.boxFontSize = layout.legendBoxFontSize;

    this.legendMargin = this.boxFontSize * pixelSize;
  }
  /**-----------------------------------------------------------------------------
   * Called in ProfilePopup.drawLegends().
   * @param source
   * @param title
   * @param positionX
   * @param positionY
   * @param styleTable
   * @param showOutline
   */
  drawLegend(source,title,positionX,positionY,styleTable,showOutline){
    let features,feature,value,keys,style,text;
    let boxX,boxY,labelX,labelY,titleX,titleY,hWidth,hHeight,currentX,currentY;
    let i,len;

    features = [];

    // Get key values, from low to high.
    keys = styleTable.getKeys();

    console.log("#ProfileLegend.drawLegend - "+keys.length);
    console.log(keys);

    //---------------------------------------------------------
    // Draw legend boxes and labels (from down to top).
    //---------------------------------------------------------

    hWidth = this.boxWidth / 2;
    hHeight = this.boxHeight / 2;

    boxX = positionX;
    boxY = positionY;
    for (i = 0, len = keys.length; i < len; i++) {

      // Get value.
      value = keys[i];

      // Draw box fill.
      style = styleTable.getStyle(value)
      feature = createFeatureBox(boxX,boxY,this.boxWidth,this.boxHeight,style);
      features.push(feature);

      // Draw box outline.
      if (showOutline) {
        style = createFillStyle(null,"black");
        feature = createFeatureBox(boxX,boxY,this.boxWidth,this.boxHeight,style);
        features.push(feature);
      }

      // Draw box label.
      labelX = boxX + hWidth + this.boxMarginRight;
      labelY = boxY + hHeight;
      text = styleTable.getText(value)
      feature = createFeatureText(text,labelX,labelY,this.boxFont,"left","middle");
      features.push(feature);

      // DEBUG
      if (this.app.config.TEST_SHOW_LAYOUT_POINTS) {
        feature = createFeaturePoint(labelX,labelY,"black",1.5);
        features.push(feature);
      }

      boxY += this.boxHeight + this.boxMarginTop;
    }

    //---------------------------------------------------------
    // Draw title.
    //---------------------------------------------------------

    // Set title position.
    titleX = boxX - hWidth;
    titleY = boxY;

    // Add title margin.
    titleY += this.titleMargin;

    // For Testing.
    // if (this.test) {
    //   feature = createFeaturePoint(titleX,titleY,"black",1);
    //   features.push(feature);
    // }

    // Draw title.
    feature = createFeatureText(title,titleX,titleY,this.titleFont,"left","bottom");
    features.push(feature);

    // Update title position.
    titleY += this.titleHeight;

    // Add features.
    source.addFeatures(features);

    // Set current position.
    currentX = boxX;
    currentY = titleY;

    // Add legend margin.
    currentY += this.legendMargin;

    return {
      currentX: currentX,
      currentY: currentY,
    }
  }
}