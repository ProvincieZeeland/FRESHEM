/**----------------------------------------------------------------------------------------------------
 * Proper import of jQuery libs in Parcel.
 * See https://hexquote.com/import-jquery-and-jquery-ui-using-parcel-js/.
 *
 * European Union Public Licence V. 1.2
 * EUPL © the European Union 2007, 2016
 *
 * Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 */

import jquery from "jquery";

export default (window.$ = window.jQuery = jquery);
