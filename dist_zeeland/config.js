/**----------------------------------------------------------------------------------------------------
 *  CONFIG SETTINGS
 *
 *  This file will not be minimized during the parcel build proces.
 */

let cfg,hostDEV,hostPROD;

cfg = {};

hostDEV = "http://www.arisutr.nl/"
hostPROD = "https://kaarten.zeeland.nl/"

//----------------------------------------------------------------------------
// VERSION
//----------------------------------------------------------------------------

// Version and release date.
cfg.VERSION = "2.0";
cfg.RELEASE_DATE = "25-6-2024";

//----------------------------------------------------------------------------
// DEV/DEBUG/TEST SETTINGS
//----------------------------------------------------------------------------

// Main flag. If false, all debug and test flags are disabled.
cfg.DEV = true;
//cfg.DEV = false;

// If true, console.log messages are shown.
//cfg.TEST_LOG_ON = true;
cfg.TEST_LOG_ON = false;

// If true, layout test points are drawn.
//cfg.TEST_SHOW_LAYOUT_POINTS = true;
cfg.TEST_SHOW_LAYOUT_POINTS = false;

// If true, activates the point of line control at startup.
//cfg.TEST_ACTIVATE_CONTROL_AT_STARTUP = true;
cfg.TEST_ACTIVATE_CONTROL_AT_STARTUP = false;

// If true, a special test procedure is run at startup.
//cfg.TEST_RUN_AT_STARTUP = true;
cfg.TEST_RUN_AT_STARTUP = false;

// If true, drawing a point or line profile is simulated (used in Profile.drawProfile()).
//cfg.TEST_SIMULATE_DRAW = true;
cfg.TEST_SIMULATE_DRAW = false;

// If true, gets profile data from local json files (used in ProfileInteraction.getFeatures()).
//cfg.TEST_USE_JSON_DATA_FILE = true;
cfg.TEST_USE_JSON_DATA_FILE = false;

// If true, special dev urls are used.
//cfg.TEST_USE_DEV_URLS = true;
cfg.TEST_USE_DEV_URLS = false;

// If true, a geocoder response file is used.
//cfg.TEST_USE_GEOCODDER_FILE = true;
cfg.TEST_USE_GEOCODDER_FILE = false;

//----------------------------------------------------------------------------
// ADDITIONAL TEST SETTINGS
//----------------------------------------------------------------------------

// Test settings.
cfg.testGeomType = "Point";
//cfg.testGeomType = "Line";

cfg.testPointFile = "chloride_pnt_1.json";
cfg.testPointFeature = [44544,371404];

// Met gaten.
cfg.testLineFile = "chloride_line_6.json";
cfg.testLineFeature = [66908.97582969889,384199.17371690535,65242.41582969889,382210.05371690536];

//----------------------------------------------------------------------------
// Disable all test flags?
//----------------------------------------------------------------------------
if (!cfg.DEV) {
  cfg.TEST_LOG_ON = false;
  cfg.TEST_SHOW_LAYOUT_POINTS = false;
  cfg.TEST_ACTIVATE_CONTROL_AT_STARTUP = false;
  cfg.TEST_RUN_AT_STARTUP = false;
  cfg.TEST_SIMULATE_DRAW = false;
  cfg.TEST_USE_JSON_DATA_FILE = false;
  cfg.TEST_USE_DEV_URLS = false;
  cfg.TEST_USE_GEOCODDER_FILE = false;
}

//----------------------------------------------------------------------------
// APP SETTINGS
//----------------------------------------------------------------------------

// If true, shows suitable for extraction when profile popup is shown (option is checked on).
//cfg.showSuitExtraction = true;
cfg.showSuitExtraction = false;

// If true, gets profile data with an OpenLayers dwithin filter, otherwise an own xml
// dwithin filter is created (used in ProfileInteraction.getFeatures()).
cfg.useNewProfileDataUrl = true;
//cfg.useNewProfileDataUrl = false;

// If true, the freshem proxy is used when getting the identify data.
//cfg.useIdentifyProxy = true;
cfg.useIdentifyProxy = false;

// If true, the freshem proxy is used when getting the profile data.
//cfg.useProfileDataProxy = true;
cfg.useProfileDataProxy = false;

//----------------------------------------------------------------------------
// APP URL SETTINGS
//----------------------------------------------------------------------------

// Base url for the proxy.
cfg.proxyUrl = "./PZ/freshem/";

// Base url for the profile data points.
cfg.profileDataWfsUrl = "./PZ/freshem/advancedview/";

// Base url for the GeoServer (or GeoWebCache) wms service .
cfg.grensvlakWmsUrl = "https://projectgeodata.zeeland.nl/geoserver/gwc/service/wms";
cfg.chlorideWmsUrl = cfg.grensvlakWmsUrl;
//cfg.suitExtractionWmsUrl = cfg.grensvlakWmsUrl;
cfg.suitExtractionWmsUrl = "https://projectgeodata.zeeland.nl/geoserver/freshem/wms";

// Template url for the geocoder suggest.
cfg.geocoderUrl = "./services/search/suggest/[SEARCH]/html/freshem_pdok_suggest";

// Base url for info files.
cfg.infoUrl = "./info/";

// Base url for flight files.
cfg.flightUrl = "https://projectgeodata.zeeland.nl/vlieglijnprofielen/";

//----------------------------------------------------------------------------
// TEST SETTINGS - OVERRIDEN APP SETTINGS
//----------------------------------------------------------------------------

if (cfg.TEST_USE_DEV_URLS) {

  // Disable simulate draw?
  if (!cfg.TEST_USE_JSON_DATA_FILE) {
    cfg.TEST_SIMULATE_DRAW = false;
  }

  // Base url for info files.
  cfg.infoUrl = hostDEV + "freshem_app/info/";

  // Base url for the geocoder suggest.
  if (cfg.TEST_USE_GEOCODDER_FILE) {
    cfg.geocoderUrl = hostDEV + "freshem_app/test_html/adreszoeken_response.html?_cl=123";
  } else {
    cfg.geocoderUrl = hostPROD + "services/search/suggest/[SEARCH]/html/freshem_pdok_suggest";
  }

  // Base url for the profile data points.
  if (cfg.TEST_USE_JSON_DATA_FILE) {
    cfg.profileDataWfsUrl = hostDEV + "freshem_app/test_data/";
  } else {
    cfg.profileDataWfsUrl = "http://192.168.0.58:8080/geoserver/freshem/wfs";
  }

  // Base url for the GeoServer (or GeoWebCache) wms service.
  cfg.suitExtractionWmsUrl = "http://192.168.0.58:8080/geoserver/freshem/wms";
}

window.config = cfg;
