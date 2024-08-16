/**----------------------------------------------------------------------------------------------------
 * Classification and patterns for Suitability Extraction.
 *
 * European Union Public Licence V. 1.2
 * EUPL © the European Union 2007, 2016
 *
 * Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 */

import ColorTable from "./ColorTable";
import {createFillStyle, createPatternStyle} from "./OLUtils";

/**-----------------------------------------------------------------------------
 */
export default class FillTable extends ColorTable {

  /**-----------------------------------------------------------------------------
   */
  constructor() {
    super();
    this.showOutLines = true;
  }
  /**-----------------------------------------------------------------------------
   * @param keys
   * @param patterns
   * @param spacings
   * @param texts
   * @param key
   * @param pattern
   * @param spacing
   * @param text
   * @private
   */
  add(keys,patterns,spacings,texts,key,pattern,spacing,text) {
    keys.push(key);
    patterns.push(pattern);
    spacings.push(spacing);
    texts.push(text);
  }
  /**-----------------------------------------------------------------------------
   * @private
   */
  init() {
    let floatKeys,patterns,spacings,texts,size,angle,color,transparent;
    let i,len;

    // Init keys, styles and texts.
    floatKeys = [];
    patterns = [];
    spacings = [];
    texts = [];

    // De arcering zou daarbij van zeer intensief bij 0 naar ontbrekend bij 1 moeten lopen.
    this.add(floatKeys,patterns,spacings,texts,0.25, "hatch",3,"Ongeschikt");
    this.add(floatKeys,patterns,spacings,texts,0.5, "hatch",5,"Matig geschikt");
    this.add(floatKeys,patterns,spacings,texts,0.75,"hatch",7,"Geschikt");
    this.add(floatKeys,patterns,spacings,texts,1,"",0,"Zeer geschikt");

    // Fill keys, styles and texts.
    size = 1;
    angle = 0;
    transparent = "rgba(255,255,255,0.0)";
    color = "black";
    for (i = 0, len = floatKeys.length; i < len; i++) {
      this.keys.push(floatKeys[i]);
      if (patterns[i] === "") {
        this.styles.push(createFillStyle(transparent, "transparent"));
        this.texts.push(texts[i]);
      } else {
        this.styles.push(createPatternStyle(patterns[i],color,false,size,spacings[i],angle));
        this.texts.push(texts[i]);
      }
    }

    // Fill reversed keys.
    this.keysReversed = this.keys.slice();
    this.keysReversed.reverse();
  }
  /**-----------------------------------------------------------------------------
   * @param value
   */
  getValueIndex(value) {
    let i, len;
    if (this.keys.length === 0) {
      this.init();
    }
    // With upper limit.
    for (i = 0, len = this.keysReversed.length; i < len; i++) {
      if (value <= this.keys[i]) {
        return i;
      }
    }
    return -1;
  }
}
