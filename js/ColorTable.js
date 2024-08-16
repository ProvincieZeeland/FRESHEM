/**----------------------------------------------------------------------------------------------------
 * Classification and colors for Chloride.
 *
 * European Union Public Licence V. 1.2
 * EUPL © the European Union 2007, 2016
 *
 * Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 */

import {createFillStyle} from "./OLUtils";

/**-----------------------------------------------------------------------------
 */
export default class ColorTable {

  // Array of key values, ordered from low to high.
  keys = [];

  // Array of key values, ordered from high to low.
  keysReversed = [];

  styles = [];
  texts = [];
  showOutLines = false;
  noDataStyle = null;
  noDataText = "";

  /**-----------------------------------------------------------------------------
   */
  constructor() {
  }

  /**-----------------------------------------------------------------------------
   * @param keys
   * @param styles
   * @param texts
   * @param key
   * @param style
   * @param text
   * @private
   */
  add(keys, styles, texts, key, style, text) {
    keys.push(key);
    styles.push(style);
    texts.push(text);
  }

  /**-----------------------------------------------------------------------------
   * Initialize colors with keys from low to high.
   * @private
   */
  init() {
    let strKeys, colors, texts;
    let i, len;

    // Init keys, styles and texts.
    strKeys = [];
    colors = [];
    texts = [];
    this.add(strKeys, colors, texts, "0", "rgb(0,0,127)", "0");
    this.add(strKeys, colors, texts, "150", "rgb(0, 0, 250)", "150");
    this.add(strKeys, colors, texts, "300", "rgb(0, 88, 255)", "300");
    this.add(strKeys, colors, texts, "500", "rgb(0, 196, 255)", "500");
    this.add(strKeys, colors, texts, "750", "rgb(30,226,221)", "750");
    this.add(strKeys, colors, texts, "1000", "rgb(60, 255, 186)", "1000");
    this.add(strKeys, colors, texts, "1250", "rgb(104,255,143)", "1250");
    this.add(strKeys, colors, texts, "1500", "rgb(147, 255, 99)", "1500");
    this.add(strKeys, colors, texts, "2000", "rgb(190,255,56)", "2000");
    this.add(strKeys, colors, texts, "3000", "rgb(233, 254, 12)", "3000");
    this.add(strKeys, colors, texts, "5000", "rgb(255, 159, 0)", "5000");
    this.add(strKeys, colors, texts, "7500", "rgb(255,134,0)", "7500");
    this.add(strKeys, colors, texts, "10000", "rgb(255,109,0)", "10000");
    this.add(strKeys, colors, texts, "15000", "rgb(182, 0, 0)", "15000");

    // Fill keys, styles and texts.
    for (i = 0, len = strKeys.length; i < len; i++) {
      this.keys.push(parseInt(strKeys[i]));
      this.styles.push(createFillStyle(colors[i],null));
      this.texts.push(texts[i]);
    }

    // Create nodata style and text.
    this.noDataStyle = createFillStyle("white","black");
    this.noDataText = "Onbekend";

    // Fill reversed keys.
    this.keysReversed = this.keys.slice();
    this.keysReversed.reverse();
  }
  /**-----------------------------------------------------------------------------
   * From low to high.
   */
  getKeys() {
    if (this.keys.length === 0) {
      this.init();
    }
    return this.keys;
  }
  /**-----------------------------------------------------------------------------
   * From high to low.
   */
  getKeysReversed() {
    if (this.keysReversed.length === 0) {
      this.init();
    }
    return this.keysReversed;
  }
  /**-----------------------------------------------------------------------------
   * @param value
   */
  getStyle(value) {
    let index;
    index = this.getValueIndex(value);
    if (index >= 0) {
      return this.styles[index];
    } else {
      return this.noDataStyle;
    }
  }
  /**-----------------------------------------------------------------------------
   * @param value
   */
  getText(value) {
    let index;
    index = this.getValueIndex(value);
    if (index >= 0) {
      return this.texts[index];
    } else {
      return this.noDataText;
    }
  }

  /**-----------------------------------------------------------------------------
   * @param value
   */
  getValueIndex(value) {
    let i;
    if (this.keys.length === 0) {
      this.init();
    }
    for (i = this.keys.length; i >= 0; --i) {
      if (value >= this.keys[i]) {
        return i;
      }
    }
    return 0;
  }
}
