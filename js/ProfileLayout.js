/**----------------------------------------------------------------------------------------------------
 * Singleton instance with common layout settings.
 *
 * European Union Public Licence V. 1.2
 * EUPL © the European Union 2007, 2016
 *
 * Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 */

/**-----------------------------------------------------------------------------
 */
class ProfileLayout_ {

  baseLayout = null;

  /**-----------------------------------------------------------------------------
   */
  constructor() {
    let layout;
    layout = {};

    // See testDrawText.
    layout.pixelSize = 0.25 + 0.1;    // Ivm. line height.

    // The origin (0,0) is lowerleft.
    layout.mapWidth = 150;
    layout.mapHeight = 100;

    layout.zoomExtent = this.calcRectExtent(layout.mapWidth,layout.mapHeight);

    layout.columnWidth = 0;
    layout.columnHeight = 0;

    layout.positionsX = [];
    layout.positionsY = [];

    layout.fontName = "sans-serif";
    layout.fontSize = 13;
    layout.font = layout.fontSize + "px " + layout.fontName;

    layout.legendTitleFontName = layout.fontName;
    layout.legendTitleFontSize = 12;
    layout.legendTitleFont = layout.legendTitleFontSize + "px " + layout.legendTitleFontName;

    layout.legendBoxFontName = layout.fontName;
    layout.legendBoxFontSize = 12;
    layout.legendBoxFont = layout.legendBoxFontSize + "px " + layout.legendBoxFontName;

    layout.titleFontName = layout.fontName;
    layout.titleFontSize = layout.fontSize;
    layout.titleFont = layout.titleFontSize + "px " + layout.titleFontName;

    layout.axisFontName = layout.fontName;
    layout.axisFontSize = 12;
    layout.axisFont = layout.axisFontSize + "px " + layout.axisFontName;

    layout.axisXPositionY = 0;
    layout.axisYPositionX = 0;

    layout.tickFontName = layout.fontName;
    layout.tickFontSize = 12;
    layout.tickFont = layout.tickFontSize + "px " + layout.tickFontName;

    this.baseLayout = layout;
  }
  /**-----------------------------------------------------------------------------
   * Calculates extent with (0,0) at lower left corner.
   */
  calcRectExtent(width,height) {
    return [0,0,width,height];
  }
  /**-----------------------------------------------------------------------------
   */
  getLegendLayout() {
    let layout;
    layout = {...this.baseLayout};

    // Binnen de box van 100 tot 150.
    layout.positionsX = [120];
    layout.positionsY = [10];

    return layout;
  }
  /**-----------------------------------------------------------------------------
   */
  getProfileLayout(geomType) {
    let layout;
    layout = {...this.baseLayout};

    layout.tickLength = 2;
    layout.tickTextMargin = 1;

    if (geomType === "Point") {

      layout.columnWidth = 10;
      layout.columnHeight = 80;

      // Centerpoints, inside the box of 0 to 100.
      layout.positionsX = [20,50,80];
      layout.positionsY = [10,10,10];

    } else {

      layout.columnWidth = 95;
      layout.columnHeight = 80;

      // Centerpoints, 1 box.
      layout.positionsX = [64];
      layout.positionsY = [10];
    }

    layout.axisXPositionY = 1;
    layout.axisYPositionX = 4;

    return layout;
  }
}

// Create the singleton.
if (window.profileLayout_ === undefined) {
  window.profileLayout_ = new ProfileLayout_();
}
export let ProfileLayout = window.profileLayout_;
