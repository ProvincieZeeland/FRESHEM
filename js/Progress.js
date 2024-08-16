/**----------------------------------------------------------------------------------------------------
 * For tile loading.
 *
 * European Union Public Licence V. 1.2
 * EUPL © the European Union 2007, 2016
 *
 * Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 */

export default class Progress {

  /**-----------------------------------------------------------------------------
   */
  constructor(el) {
    this.el = el;
    this.loading = 0;
    this.loaded = 0;
  }
  /**-----------------------------------------------------------------------------
   */
  addLoading() {
    if (this.loading === 0) {
      this.show();
    }
    ++this.loading;
    this.update();
  }
  /**-----------------------------------------------------------------------------
   */
  addLoaded() {
    let self = this;
    setTimeout(function () {
      ++self.loaded;
      self.update();
    }, 100);
  }
  /**-----------------------------------------------------------------------------
   */
  update() {
    let self = this;
    this.el.style.width = (this.loaded / this.loading * 100).toFixed(1) + "%";
    if (this.loading === this.loaded) {
      this.loading = 0;
      this.loaded = 0;
      setTimeout(function () {
        self.hide();
      }, 500);
    }
  }
  /**-----------------------------------------------------------------------------
   */
  show() {
    this.el.style.visibility = "visible";
  }
  /**-----------------------------------------------------------------------------
   */
  hide = function () {
    if (this.loading === this.loaded) {
      this.el.style.visibility = "hidden";
      this.el.style.width = 0;
    }
  }
}
