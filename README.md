# Inleiding

[FRESHEM Zeeland](https://www.deltares.nl/expertise/projecten/freshem-onderzoek-naar-mogelijkheden-van-infiltratie-van-zoet-water-in-zeeland) is een onderzoeksprogramma van Deltares, TNO en BGR.
Het [resultaat](https://data.overheid.nl/dataset/8077-freshem-zeeland--start-pagina-) is onder meer een 3D model van de ondergrond waarin voor
elke [voxel](https://nl.wikipedia.org/wiki/Voxel) het chloridegehalte van het grondwater is vastgelegd.

Dit Git project bevat de code voor de [FRESHEM viewer](https://kaarten.zeeland.nl/map/freshem#) zoals ontsloten
door de provincie Zeeland. Daarnaast bevat dit Git project de documentatie
waarin beschreven staat hoe vanuit de brondata de onder de viewer liggende
geo-webservice ingericht kunnen worden.

## Meting en modellering

Metingen zijn met behulp van een electromagnetisch meetinstrument onder een helikopter verricht, langs vlieglijnen. De gegevens zijn vervolgens met behulp van informatie over de lithologie van de ondergrond en meetgegevens uit peilbuizen gemodelleerd en geïnterpoleerd tot een 3D model van de ondergrond waarin voor elke [voxel](https://nl.wikipedia.org/wiki/Voxel) het chloridegehalte van het grondwater is vastgelegd.

Het model kent 3 uitkomsten:

- laag
- midden
- hoog

De mate waarin deze met elkaar overeenkomen geeft een indruk van de betrouwbaarheid van de modellering.

## Geschiktheid voor grondwateronttrekking

Na publicatie van Freshem Zeeland in 2017 is een toename waargenomen in het
aantal grondwateronttrekkingen in Zeeland. Freshem geeft daarentegen enkel
inzicht in de aanwezigheid van zoetwater lenzen, en geen directe informatie
over de mate van geschiktheid van grondwateronttrekkingen.
Een GIS-analyse waarin Freshem, GeoTOP en relatieve infiltratie zijn
gecombineerd is ontwikkeld en resulteert in een geschiktheidstool voor
grondwateronttrekkingen. Voor iedere dataset zijn afzonderlijke
geschiktheidsfactoren opgesteld. Per 0.5 meter in de ondergrond is
voor iedere cel (100x100 meter) de geschiktheidsfactor berekend, door de
afzonderlijke factoren te vermenigvuldigen met een gewicht. Voor
Freshem, GeoTOP en relatieve infiltratie zijn de gewichten respectievelijk
0.5, 0.4 en 0.1. De som resulteert in de geschiktheidsfactor voor
grondwateronttrekking [Afstudeerstage Provincie Zeeland: Geschiktheidstool grondwateronttrekking, Arnoud Goossen, 2022].

Naast het chloridegehalte is in 2024 ook deze data opgenomen in de FRESHEM vieuwer.

# Viewer

De viewer is zo ingericht dat middels diverse 2D kaarten en tools een goede
indruk gekregen kan worden van de saliniteit van het grondwater. 

De viewer toont alle gegevens op basis van geo-webservices die werken langs
de open standaarden [WMS](https://www.ogc.org/standard/wms/) en [WFS](https://www.ogc.org/standard/wfs/).

De volgende lagen en tools worden gebruikt:

## Kaartlagen

### Grensvlak met chloridegehalte (mg/l)

Deze kaartlaag toont de diepte (t.o.v. maaiveld) waarop een bepaald
chloridegehalte voor het eerst wordt aangetroffen. Het betreft hierbij
de modeluitkomst "midden".

Middels een schuif kan het chloridegehalte worden gekozen uit een set
vaste waarden. De viewer gebruikt het principe van WMS-dimensions om de
met de schuif ingestelde kaartlagen op te halen.

> WMS dimensions worden beschreven in de [OpenGIS Web Map Service (WMS) Implementation Specification](https://portal.ogc.org/files/?artifact_id=14416) Annex C.

Een voorbeeldrequest voor het ophalen van een kaart met het grensvlak
"1500" is:

```
https://projectgeodata.zeeland.nl/geoserver/gwc/service/wms?SERVICE=WMS&VERSION=1.1.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=freshem:grensvlak&ELEVATION=1500&TILED=true&WIDTH=256&HEIGHT=256&SRS=EPSG:28992&STYLES=&BBOX=58662.080000000016,397627.84,62102.720000000016,401068.48000000004
```

### Chloridegehalte op diepte (m NAP)

Deze kaartlaag toont de chlorideconcentratie van het grondwater op een
bepaalde diepte (in meters t.o.v. NAP). Het betreft hierbij de
modeluitkomst "midden".

Middels een schuif kan de diepte worden gekozen uit een set vaste
waarden. De viewer gebruikt het principe van WMS-dimensions om de met
de schuif ingestelde kaartlagen op te halen.

> WMS dimensions worden beschreven in de [OpenGIS Web Map Service (WMS) Implementation Specification](https://portal.ogc.org/files/?artifact_id=14416) Annex C.

Een voorbeeldrequest voor het ophalen van een kaart op diepte "-10.25" is:

```
https://projectgeodata.zeeland.nl/geoserver/gwc/service/wms?SERVICE=WMS&VERSION=1.1.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=freshem:chloride&ELEVATION=-9.75&TILED=true&WIDTH=256&HEIGHT=256&SRS=EPSG:28992&STYLES=&BBOX=38018.23999999999,397627.84,41458.87999999999,401068.48000000004
```

### Vlieglijnen

De vlieglijnen geven aan waar er gevlogen is met het elektromagnetisch
meetinstrument.

### Geschiktheid onttrekking op diepte (m NAP)

Deze kaartlaag toont de diepte (t.o.v. maaiveld) waarop een bepaald
geschiktheid voor grondwateronttrekking voor het eerst wordt aangetroffen.

Voor deze data wordt de volgende klassificatie gebruikt:

| Waarde      | Klasse         |
|-------------|----------------|
| 0 - 0.25    | Niet geschikt  |
| 0.25 - 0.5  | Matig geschikt |
| 0.5 - 0.75  | Geschikt       |
|  0.75 - 1.0 | Zeer geschikt  |

## Tools

### Punt profiel

De punt profiel tool toont een diepteprofiel met chloridewaarden op een in de
kaart aangeklikte plek. De gebruiker kan vervolgens kiezen uit de modeluitkomst
"Laag", "Midden", "Hoog".

De geschiktheid voor grondwateronttrekking wordt in de profiel getoond in de
vorm van een arcering. 

De gegevens worden door de viewer opgehaald middels een WFS POST request. Een
voorbeeld van de POST-payload is:

```xml
<wfs:GetFeature 	xmlns:xlink="http://www.w3.org/1999/xlink" 
					xmlns:gml="http://www.opengis.net/gml" 
					xmlns:ogc="http://www.opengis.net/ogc" 
					xmlns:wfs="http://www.opengis.net/wfs" 
					xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
					xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd" 
                	outputFormat="application/json" 
                	service="WFS" 
                	version="1.0.0">
    <wfs:Query xmlns:freshem="http://www.deegree.org/app" typeName="freshem:profielen">
        <ogc:Filter>
            <ogc:DWithin>
                <ogc:PropertyName>wkb_geometry</ogc:PropertyName>
                <gml:Point gml:id="P1" srsName="urn:ogc:def:crs:EPSG::28992">
                    <gml:coordinates>49268.417095297904,392378.85766963597</gml:coordinates>
                </gml:Point>
                <ogc:Distance units="m">35.36</ogc:Distance>
            </ogc:DWithin>
        </ogc:Filter>
    </wfs:Query>
</wfs:GetFeature>
```

Een voorbeeld van een response die op zo'n soort request terugkomt is:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "profielen_v2.570480",
      "geometry": {
        "type": "MultiPoint",
        "coordinates": [
          [
            43125,
            387425
          ]
        ]
      },
      "geometry_name": "wkb_geometry",
      "properties": {
        "z": "[-41.25, -40.75, -40.25, -39.75, -39.25, -38.75, -38.25, -37.75, -37.25, -36.75, -36.25, -35.75, -35.25, -34.75, -34.25, -33.75, -33.25, -32.75, -32.25, -31.75, -31.25, -30.75, -30.25, -29.75, -29.25, -28.75, -28.25, -27.75, -27.25, -26.75, -26.25, -25.75, -25.25, -24.75, -24.25, -23.75, -23.25, -22.75, -22.25, -21.75, -21.25, -20.75, -20.25, -19.75, -19.25, -18.75, -18.25, -17.75, -17.25, -16.75, -16.25, -15.75, -15.25, -14.75, -14.25, -13.75, -13.25, -12.75, -12.25, -11.75, -11.25, -10.75, -10.25, -9.75, -9.25, -8.75, -8.25, -7.75, -7.25, -6.75, -6.25, -5.75, -5.25, -4.75, -4.25, -3.75, -3.25, -2.75, -2.25, -1.75, -1.25, -0.75, -0.25, 0.25, 0.75]",
        "chloride_laag": "[15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 10000, 5000, 5000, 5000, 5000, 3000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]",
        "chloride_midden": "[15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 10000, 10000, 10000, 10000, 5000, 2000, 2000, 2000, 1500, 300, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]",
        "chloride_hoog": "[15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 7500, 3000, 5000, 5000, 3000, 2000, 150, 500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]",
        "suit_extraction": "[0, 0, 0.03, 0.19, 0.33, 0.33, 0.19, 0.33, 0.33, 0.33, 0.19, 0.19, 0.19, 0.33, 0.19, 0.03, 0.03, 0.03, 0.03, 0.03, 0.07, 0.07, 0.07, 0.07, 0, 0.03, 0.07, 0.07, 0.33, 0.33, 0.07, 0.07, 0.03, 0.33, 0.07, 0.33, 0.33, 0.33, 0.33, 0.19, 0.19, 0.33, 0.33, 0.19, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.69, 0.83, 0.83, 0.83, 0.83, 0.83, 0.69, 0.69, 0.69, 0.69, 0.69, 0.69, 0.57, 0, 0.57]"
      },
      "bbox": [
        43125,
        387425,
        43125,
        387425
      ]
    }
  ],
  "totalFeatures": 1,
  "numberMatched": 1,
  "numberReturned": 1,
  "timeStamp": "2024-06-16T09:03:45.504Z",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:EPSG::28992"
    }
  },
  "bbox": [
    43125,
    387425,
    43125,
    387425
  ]
}
```

### Lijn profiel

De lijn profiel tool laat de gebruiker een lijn over de kaart trekken en toont
vervolgens diepteprofiel met chloridewaarden. 

De gebruiker kan vervolgens kiezen uit de modeluitkomst "Laag", "Midden", "Hoog".

De geschiktheid voor grondwateronttrekking wordt in de profiel getoond in de
vorm van een arcering.

De gegevens worden door de viewer opgehaald middels een WFS POST request.
Een voorbeeld van de POST-payload is:

```xml
<GetFeature xmlns="http://www.opengis.net/wfs" service="WFS" version="1.1.0" outputFormat="application/json"
            xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <Query typeName="freshem:profielen_v2" srsName="EPSG:28992" xmlns:freshem="freshem">
        <Filter xmlns="http://www.opengis.net/ogc">
            <DWithin>
                <PropertyName>wkb_geometry</PropertyName>
                <LineString xmlns="http://www.opengis.net/gml">
                    <posList srsDimension="2">42519.10748603135 394532.31999999995 44400.2870850443 391575.51999999996
                    </posList>
                </LineString>
                <Distance units="m">25</Distance>
            </DWithin>
        </Filter>
    </Query>
</GetFeature>
```

De response is overeenkomstig met de response op de tool punt profiel.

## Ondersteunende kaartlagen

Voor meer inzicht in de gegevens worden nog extra kaartlagen en ondergronden
ontsloten. 

Deze extra kaartlagen en ondergronden komen uit externe bronnen en worden hier
niet verder beschreven.

# Web services

De viewer betrekt de getoonde gegevens uit de geowebservices langs de open
standaarden [WMS](https://www.ogc.org/standard/wms/) en [WFS](https://www.ogc.org/standard/wfs/). Deze kunnen worden ingericht
met [Geoserver](https://geoserver.org/) zoals hieronder beschreven. Naar verwachting kan dit
ook met andere producten goed zoals bijvoorbeeld [Mapserver](https://mapserver.org/). 

Uit performance overwegingen kan ook gebruik gemaakt worden van een tile
service, in dit geval ingericht met [GeowebCache](https://docs.geoserver.org/stable/en/user/geowebcache/index.html) zoals hieronder
beschreven. Naar verwachting kan dit ook met andere producten goed zoals
bijvoorbeeld [Mapproxy](https://www.mapproxy.org/). 

## Geoserver

webinterface bereikbaar op: https://projectgeodata.zeeland.nl/geoserver/web

Inmiddels 23 omgevingen; 1 daarvan is FRESHEM

### Omgeving FRESHEM

#### Basic Info

naam: freshem

Naespace URI: http://freshem

v Standaardomgeving

#### Service settings

Aantal decimalen: 4
v Gedetailleerde berichten

Proxy: https://projectgeodata.zeeland/geoserver

### WMS

De kaartlagen "Grensvlak met chloridegehalte (mg/l)", "Chloridegehalte
op diepte (m NAP)" en "Geschiktheid onttrekking op diepte (m NAP)" worden
geserveerd vanuit een geotiff databron.
Onder [Data Conversie](#data-conversie) wordt uitgelegd hoe de geotiffs worden gemaakt
vanuit de brondata.

De geotiffs worden geplaats in de folder:

- `geoserver_data/freshem/raster_chloride/hoog`
- `geoserver_data/freshem/raster_chloride/midden`
- `geoserver_data/freshem/raster_chloride/laag`
- `geoserver_data/freshem/raster_grensvlakken/hoog`
- `geoserver_data/freshem/raster_grensvlakken/midden`
- `geoserver_data/freshem/raster_grensvlakken/laag`
- `geoserver_data/freshem/raster_suit_extraction100m`

### WFS

De data voor de WFS services staan opgeslagen in de [Postgis database](#database).
De koppeling tussen de WMS-bron in de vorm van geotiff en de WFS data in
Postgis wordt gelegd door het plaatsen van een aantal bestanden in de
juiste folders.

#### "Chloridegehalte op diepte (m NAP)"

Plaats in de folder met geotiffs (`geoserver_data/freshem/raster_chloride/`) de volgende bestanden (drie keer (laag-midden-hoog)):

`datastore.properties`:

    SPI=org.geotools.data.postgis.PostgisNGDataStoreFactory
    host=geopg-ext.zeeland.nl
    port=5432
    database=freshem
    schema=chloride_index
    user=freshem
    passwd=***
    Loose\ bbox=true
    Estimated\ extends=false
    validate\ connections=true
    Connection\ timeout=10
    preparedStatements=true

`indexer.properties`:

    ElevationAttribute=elevation
    Schema=*the_geom:Polygon,location:String,elevation:Integer
    PropertyCollectors=IntegerFileNameExtractorSPI[elevationregex](elevation)
    Caching=false
    AbsolutePath=false

`elevationregex.properties`:

    regex=(-?[0-9]*)\.

Vervolgens kunnen in de Geoserver admin webinterface de stores toegevoegd worden. 

#### "Grensvlak met chloridegehalte (mg/l)"

`datastore.properties`:

    SPI=org.geotools.data.postgis.PostgisNGDataStoreFactory
    host=geopg-ext.zeeland.nl
    port=5432
    database=freshem
    schema=grenswaarde_index
    user=freshem
    passwd=***
    Loose\ bbox=true
    Estimated\ extends=false
    validate\ connections=true
    Connection\ timeout=10
    preparedStatements=true

`indexer.properties`:

    ElevationAttribute=elevation
    AdditionalDomainAttributes=grenswaarde
    Schema=*the_geom:Polygon,location:String,grenswaarde:Integer, elevation: Integer
    PropertyCollectors=IntegerFileNameExtractorSPI[grenswaarderegex](grenswaarde)
    PropertyCollectors=IntegerFileNameExtractorSPI[grenswaarderegex](elevation)
    Caching=false
    AbsolutePath=false

`grenswaarderegex.properties`:

    regex=_([0-9]*)_

Vervolgens kunnen in de Geoserver admin webinterface de stores toegevoegd worden. 

#### "Geschiktheid onttrekking op diepte (m NAP)"

Plaats in de folder met geotiffs (`geoserver_data/freshem/raster_suit_extraction100m/`) 
de volgende bestanden:

`datastore.properties`:

    SPI=org.geotools.data.postgis.PostgisNGDataStoreFactory
    host=geopg-ext.zeeland.nl
    port=5432
    database=freshem
    schema=chloride_index
    user=freshem
    passwd=***
    Loose\ bbox=true
    Estimated\ extends=false
    validate\ connections=true
    Connection\ timeout=10
    preparedStatements=true

`indexer.properties`:

    ElevationAttribute=elevation
    Schema=*the_geom:Polygon,location:String,elevation:Integer
    PropertyCollectors=IntegerFileNameExtractorSPI[elevationregex](elevation)
    Caching=false
    AbsolutePath=false

`elevationregex.properties`:

    regex=-?[0-9]+

### Layers algemeen

De layers voor freshem zijn:

|                              |                          |                     |      |            |
|------------------------------|--------------------------|---------------------| ---- | ---------- |
| **Chloride hoog**            | freshem:chloride_hoog    | chloride_hoog       |      | EPSG:28992 |
| **Chloride laag**            | freshem:chloride_laag    | chloride_laag       |      | EPSG:28992 |
| **Chloride midden**          | freshem:chloride_midden  | chloride_midden     |      | EPSG:28992 |
| **Grensvlak hoog**           | freshem:grensvlak_hoog   | grensvlak_hoog      |      | EPSG:28992 |
| **Grensvlak laag**           | freshem:grensvlak_laag   | grensvlak_laag      |      | EPSG:28992 |
| **Grensvlak midden**         | freshem:grensvlak_midden | grensvlak_midden    |      | EPSG:28992 |
| **Geschiktheid onttrekking** | freshem:suit_extraction  | suit_extraction     |      | EPSG:28992 |
| **profielen_v2**             | freshem:profielen_v2     | freshem             |      | EPSG:28992 |
| **vlieglijnen**              | freshem:vlieglijnen      | freshem_vlieglijnen |      | EPSG:28992 |

Daarnaast zijn er nog 2 groepen:

- **grensvlak**
- **chloride**

### Layers chloride_hoog, chloride_midden, chloride_laag

#### Gegevens 

##### Projecties

EPSG:28992

##### Parameters voor Rasters

Excess Granule Removal: None
Footprint Behavior: None
Maximum number of granules to load: -1
Merge Behavior: FLAT
Overview Policy: QUALITY
Suggested Tile Size: 512,512
v Use JAI ImageRead (deferred loading)

##### Details van de rasterband

Band: GRAY_INDEX
NULL-waardes: -0,999 
minRange: -∞
maxRange: ∞
Eenheid:

#### Publiceren

##### Root Layer in Capabilities:

v WMS Global Settings

##### WCS instellingen

Projecties voor verzoeken: EPSG:28992
Projecties voor antwoorden: EPSG:28992

##### Interpolatie methodes

Standaard interpolatie methode: nearest neighbor
Geselecteerd: nearest neighbor, bilinear, bicubic

##### Formats

Formaat: ImageMosaic
Geselecteerde formaten: GIF, PNG, TIFF, GEOTIFF

##### WMS Instellingen

v Bevraagbaar
Standaard Stijl: chloride_transparant

#### Dimensies

##### Hoogte

v Ingeschakeld
eenheden: EPSG:28992
Symbool: m 
Presentatie: Lijst
Standaard waarde: Gebruik de domeinwaarde die zich het dichst bij de referentiewaarde bevindt
Referentie-waarde: 0

##### Tegels

**Let op: tegelinstellingen zijn niet correct; ze worden in Zeeland dan ook niet gebruikt**

v Tegels inschakelen
v Tegels mogelijk maken voor deze laag
BlobStore: (*) Default BlobStore
Metategel Instellingen: 4x4; 0 Overloop in pixels
Formaten: image/jpeg; image/png
Cache verloop: 0

###### STYLES

Standaard: STANDAARD LAAG
Alternatieve stijlen: v ALL STIJLEN

Beschikbare grids:

EPSG:4326; Niveaus: Min/Max; Begrenzingsrechthoek: Dynamisch
EPSG:900913; Niveaus: Min/Max; Begrenzingsrechthoek: Dynamisch



### Layers grensvlak_hoog, grensvlak_midden, grensvlak_laag

#### Gegevens 

##### Projecties

EPSG:28992

##### Parameters voor Rasters

Excess Granule Removal: None
Footprint Behavior: None
Maximum number of granules to load: -1
Merge Behavior: FLAT
Overview Policy: QUALITY
Suggested Tile Size: 512,512
v Use JAI ImageRead (deferred loading)

##### Details van de rasterband

Band: GRAY_INDEX
NULL-waardes: -0,999 
minRange: 0
maxRange: 100
Eenheid: m

#### Publiceren

##### Root Layer in Capabilities:

v WMS Global Settings

##### WCS instellingen

Projecties voor verzoeken: EPSG:28992
Projecties voor antwoorden: EPSG:28992

##### Interpolatie methodes

Standaard interpolatie methode: nearest neighbor
Geselecteerd: nearest neighbor, bilinear, bicubic

##### Formats

Formaat: ImageMosaic
Geselecteerde formaten: GIF, PNG, TIFF, GEOTIFF

##### WMS Instellingen

v Bevraagbaar
Standaard Stijl: Grensvlakken_transparant

#### Dimensies

##### Hoogte

v Ingeschakeld
eenheden: EPSG:28992
Symbool: m 
Presentatie: Lijst
Standaard waarde: Gebruik de domeinwaarde die zich het dichst bij de referentiewaarde bevindt
Referentie-waarde: 0

##### Tegels

**Let op: tegelinstellingen zijn niet correct; ze worden in Zeeland dan ook niet gebruikt**

v Tegels inschakelen
v Tegels mogelijk maken voor deze laag
BlobStore: (*) Default BlobStore
Metategel Instellingen: 4x4; 0 Overloop in pixels
Formaten: image/png8
Cache verloop: 0

###### STYLES

Standaard: STANDAARD LAAG
Alternatieve stijlen: v ALL STIJLEN

Beschikbare grids:

NL_EPSG_28992 0/13 Min/ Max 0.0,0.0,-1.0,-1.0

#### Layer vlieglijnen

##### Gegevens

Projectie: EPSG:28992

###### Attributen

|           |                 |      |      |
| --------- | --------------- | ---- | ---- |
| geom      | MultiLineString | true | 0/1  |
| lijn      | String          | true | 0/1  |
| Naam_lijn | String          | true | 0/1  |
| lengte_m  | Integer         | true | 0/1  |

##### Publiceren

v WMS Global Settings
v Bevraagbaar

Standaard Stijl: vlieglijnen

##### Tegels

**Let op: tegelinstellingen zijn niet correct; ze worden in Zeeland dan ook niet gebruikt**

v Tegels inschakelen
v Tegels mogelijk maken voor deze laag
BlobStore: (*) Default BlobStore
Metategel Instellingen: 4x4; 0 Overloop in pixels
Formaten: image/jpeg; image/png
Cache verloop: 0

###### STYLES

Standaard: STANDAARD LAAG
Alternatieve stijlen: v ALL STIJLEN

Beschikbare grids:
NL_EPSG_28992; Min/Max; Min/Max; 13705.1552734375,357781.21875,78312.84375,419349.8125	

#### Layer profielen

##### Gegevens

Projectie: EPSG:28992


###### Attributen

wkb_geometry	MultiPoint	true	0/1
z	String	true	0/1
chloride_laag	String	true	0/1
chloride_midden	String	true	0/1
chloride_hoog	String	true	0/1

##### Publiceren

v WMS Global Settings
v Bevraagbaar

Standaard Stijl: point

##### Tegels

**Let op: tegelinstellingen zijn niet correct; ze worden in Zeeland dan ook niet gebruikt**

v Tegels inschakelen
v Tegels mogelijk maken voor deze laag
BlobStore: (*) Default BlobStore
Metategel Instellingen: 4x4; 0 Overloop in pixels
Formaten: image/png8
Cache verloop: 0

###### STYLES

Standaard: STANDAARD LAAG
Alternatieve stijlen: v ALL STIJLEN

Beschikbare grids:
NL_EPSG_28992; 0/13; Min/Max; 0.0,0.0,-1.0,-1.0



### Groepen

#### Groep grensvlak

##### Gegevens

v Ingeschakeld
v Geadverteerd
Projectie: EPSG:28992
Modus: Named Tree
v Bevraagbaar

Het max. aantal features als resultaat op een getfeatureinfo request op deze groep moet ingesteld op 1.

###### Lagen

In onderstaande tabel is de grensvlak_midden laag de bovenste zodat deze als resultaat terugkomt

|      |       |                          |                          |
| ---- | ----- | ------------------------ | ------------------------ |
| 1    | Layer | freshem:grensvlak_midden | Grensvlakken             |
| 2    | Layer | freshem:grensvlak_laag   | Grensvlakken_transparant |
| 3    | Layer | freshem:grensvlak_hoog   | Grensvlakken_transparant |

v WMS Global Settings

##### Tegels

**Let op: tegelinstellingen zijn niet correct; ze worden in Zeeland dan ook niet gebruikt**

v Tegels inschakelen voor de groep
v Tegels mogelijk maken voor deze laag
v Enable In Memory Caching for this Layer.

BlobStore: grensvlak
Metategel: 4x4; Overloop 0
Formaten: image/png; image/png8
Cacheverlooop: 0

###### filters

ELEVATION

Standaardwaarde: 150
Toegestane getallen: 150, 300, 1000. 1500, 3000, 10000
Grenswaarde: 1

Beschikbare grids:
NL_EPSG_28992; Min/Max; Min/Max; 634.5732789819012,306594.5543000576,284300.0254094796,636981.7698870846

#### Groep chloride

v Ingeschakeld
V Geadverteerd
Projectie: EPSG:28992
Modus: Named Tree
v Bevraagbaar

Het max. aantal features als resultaat op een getfeatureinfo request op deze groep moet ingesteld op 1.

###### Lagen

In onderstaande tabel is de chloride_midden laag de bovenste zodat deze als resultaat terugkomt

|      |       |                         |                      |
| ---- | ----- | ----------------------- | -------------------- |
| 1    | Layer | freshem:chloride_midden | chloride             |
| 2    | Layer | freshem:chloride_laag   | chloride_transparant |
| 3    | Layer | freshem:chloride_hoog   | chloride_transparant |

##### Publiceren

v WMS Global Settings

##### Tegels

**Let op: tegelinstellingen zijn niet correct; ze worden in Zeeland dan ook niet gebruikt**

v Tegels inschakelen voor de groep
v Tegels mogelijk maken voor deze laag
v Enable In Memory Caching for this Layer.

BlobStore: grensvlak
Metategel: 4x4; Overloop 0
Formaten: image/png; image/png8
Cacheverlooop: 0

###### filters

ELEVATION

Standaardwaarde: -0.25
Toegestane getallen: -30.75, -30.25, -29.75, -29.25, -28.75, -28.25, -27.75, -27.25, -26.75, -26.25, -25.75, -25.25, -24.75, -24.25, -23.75, -23.25, -22.75, -22.25, -21.75, -21.25, -20.75, -20.25, -19.75, -19.25, -18.75, -18.25, -17.75, -17.25, -16.75, -16.25, -15.75, -15.25, -14.75, -14.25, -13.75, -13.25, -12.75, -12.25, -11.75, -11.25, -10.75, -10.25, -9.75, -9.25, -8.75, -8.25, -7.75, -7.25, -6.75, -6.25, -5.75, -5.25, -4.75, -4.25, -3.75, -3.25, -2.75, -2.25, -1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75, 4.25, 4.75, 5.25, 5.75, 6.25, 6.75, 7.25, 7.75, 8.25, 8.75, 9.25, 9.75, 10.25, 10.75, 11.25, 11.75, 12.25, 12.75, 13.25, 13.75, 14.25, 14.75, 15.25, 15.75, 16.25, 16.75, 17.25, 17.75, 18.25, 18.75, 19.25, 19.75, 20.25, 20.75, 21.25, 21.75, 22.25, 22.75, 23.25, 23.75
Grenswaarde: 1.0E-6

Beschikbare grids:
NL_EPSG_28992; Min/Max; Min/Max; 634.5732789819012,306594.5543000576,284300.0254094796,636981.7698870846

### GetFeatureInfo Request

Er wordt in Zeeland gebruik gemaakt van een proxy. De afwijkende inrichting van
het gfi request lijkt daarmee samen te hangen. De proxy mag vervallen.
Onderstaande waarschijnlijk ook.

De proxy details:

server: `kaarten-prod`

map: ``/data/www/kaarten-prod_v2/public/static_sites/freshem/``

PHP controller: `/data/www/kaarten-prod_v2/app/Controllers/PZ/Freshem.php`

```php
<?php namespace App\Controllers\PZ;

  use App\Interfaces\ServiceController;

  /**
   *  Freshem controller
   *
   *  Freshem related HTTP requests 
   *
   *  @author	Wim Kosten <w.kosten@zeeland.nl>
   *
   */
  class Freshem extends ServiceController
  {
    /** @var $m_freshemInfoPath */
    private $m_freshemInfoPath = FCPATH."static_sites/freshem/info/";
    
  
    /**
     *  CI4 controller constructor
     *
     *  @param \CodeIgniter\HTTP\RequestInterface $request
     *  @param \CodeIgniter\HTTP\ResponseInterface $response
     *  @param \Psr\Log\LoggerInterface$logger
     *
     */
     public function initController($request, $response, $logger)
     {
       parent::initController($request, $response, $logger);
       $this->validateRequest($request);
     }  
     

    /**
     *  location
     *
     *  Show feature info
     *
     *  @param string $partA
     *  @param string $partB
     *  @return void
     *
     */
     public function location($partA="", $partB="")
     {
       $encodedURL  = $partA."/".$partB;
       $decodedURL  = base64_decode($encodedURL);
       $response    = \App\Libraries\Mapperr\Map\Map_helper::rawCurlGet($decodedURL, array());       
       
       if (isset($response["data"]))
       {
         echo trim($response["data"]);
       }
       else
       {
         echo "Fout tijdens ophalen van de gegevens";
       }
       
       exit;
     }


    /**
     *  advancedView
     *
     *  Show info about point / flightline 
     *
     *  @param void
     *  @return void
     *
     */
     public function advancedView()
     {
       // Get HTTP request instance
       $request = \Config\Services::request();

       // Get POST data ($request->getRawInput() converts it into an array(
       $postData = file_get_contents('php://input');

       // Init cUrl
       $ch = curl_init();

       // Set properties
       curl_setopt($ch, CURLOPT_URL,            "https://projectgeodata.zeeland.nl/geoserver/freshem/wms" );
       curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1 );
       curl_setopt($ch, CURLOPT_POST,           1 );
       curl_setopt($ch, CURLOPT_POSTFIELDS,     $postData); 
       curl_setopt($ch, CURLOPT_HTTPHEADER,     array('Content-Type: text/plain')); 
       curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
       curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
       curl_setopt($ch, CURLOPT_TIMEOUT,        10);
       curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
       curl_setopt($ch, CURLOPT_VERBOSE,        true);

       // Call cUrl and bail-out
       echo curl_exec($ch);
       exit;
     }       
     

    /**
     *  layerInfo
     *
     *  Show info about layers etc
     *
     *  @param void
     *  @return void
     *
     */     
     public function layerInfo($what="")
     {
       $info = "Geen gegevens gevonden over dit onderdeel ({$what})";
       
       if (trim($what) !== "")
       {
         $item = strtolower($what); 
         $file = $this->m_freshemInfoPath."layerinfo_{$item}.html";
         
         if (is_file($file))
         {
           $info = file_get_contents($file);
         }
       }
       
       echo $info;
       exit;       
     }

  }
  
```



Er is gekozen voor het gebruik van html in het GetFeatureInfo request volgens:

>http://docs.geoserver.org/latest/en/user/tutorials/GetFeatureInfo/index.html 

Bovengenoemde link klopt niet helemaal. De `templates` folder bestaat nog niet in de geoserver data_dir. Aanmaken is genoeg.

in de `templates` folder een lege `header.ftl` en `footer.ftl` plaatsen.

En dan zoals in bovenstaande link genoemd `content.ftl` plaatsen bij elke laag:

In `geoserver_data/workspaces/freshem/chloride_hoog`:

```
<div class='freshem-gfi-response'>
	
	<ul>
	<#list features as feature>
		
		<#if type.name == "chloride_hoog">
			<li> Chloride hoog:
		</#if>	
		  <#list feature.attributes as attribute>
			<#if !attribute.isGeometry>
			    <#if attribute.value == "-9999.0">
					Geen meetwaarde
				<#else>
					${attribute.value} mg/l 
				</#if>
			</#if>
		  </#list>
	</#list>
	</ul>
	
</div>
```

In `geoserver_data/workspaces/freshem/grensvlak_hoog`:

```
<div class='freshem-gfi-response'>
	
	<ul>
	<#list features as feature>
		<#if type.name == "grensvlak_hoog">
			<li> Grensvlak hoog:
		</#if> 
		
		<#list feature.attributes as attribute>
			<#if !attribute.isGeometry>
				<#if attribute.value == "99.0">
					Grensvlak beneden meetdiepte
				<#elseif attribute.value == "-9999.0">
					Geen meetwaarde
				<#else>
					<#assign v = attribute.value>
					${v[0..3]} meter beneden maaiveld
				</#if>					
			</#if>
		</#list> 

	</#list>
	</ul>
	
</div>
```

In `geoserver_data/workspaces/freshem/vlieglijnen`:

```
<div class='vlieglijn-gfi-response'>
	
	<ul>
	<#list features as feature>
		<li>${feature.Naam_lijn.value}</li>
	</#list>
	</ul>
	
</div>
```

### Styles

#### point

```
<?xml version="1.0" encoding="ISO-8859-1"?>
<StyledLayerDescriptor version="1.0.0" 
		xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" 
		xmlns="http://www.opengis.net/sld" 
		xmlns:ogc="http://www.opengis.net/ogc" 
		xmlns:xlink="http://www.w3.org/1999/xlink" 
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		<!-- a named layer is the basic building block of an sld document -->

	<NamedLayer>
		<Name>Default Point</Name>
		<UserStyle>
		    <!-- they have names, titles and abstracts -->
		  
			<Title>A boring default style</Title>
			<Abstract>A sample style that just prints out a purple square</Abstract>
			<!-- FeatureTypeStyles describe how to render different features -->
			<!-- a feature type for points -->

			<FeatureTypeStyle>
				<!--FeatureTypeName>Feature</FeatureTypeName-->
				<Rule>
					<Name>Rule 1</Name>
					<Title>RedSquare</Title>
					<Abstract>A red fill with an 11 pixel size</Abstract>

					<!-- like a linesymbolizer but with a fill too -->
					<PointSymbolizer>
						<Graphic>
							<Mark>
								<WellKnownName>square</WellKnownName>
								<Fill>
									<CssParameter name="fill">#FF0000</CssParameter>
								</Fill>
							</Mark>
							<Size>6</Size>
						</Graphic>
					</PointSymbolizer>
				</Rule>

		    </FeatureTypeStyle>
		</UserStyle>
	</NamedLayer>
</StyledLayerDescriptor>

```

#### chloride

```
<?xml version="1.0" ?>
<sld:StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:sld="http://www.opengis.net/sld">
    <sld:UserLayer>
        <sld:LayerFeatureConstraints>
            <sld:FeatureTypeConstraint/>
        </sld:LayerFeatureConstraints>
        <sld:UserStyle>
            <sld:Name>chloride_midden</sld:Name>
            <sld:Title/>
            <sld:FeatureTypeStyle>
                <sld:Name/>
                <sld:Rule>
                    <sld:RasterSymbolizer>
                        <sld:Geometry>
                            <ogc:PropertyName>grid</ogc:PropertyName>
                        </sld:Geometry>
                        <sld:Opacity>1</sld:Opacity>
                        <sld:ColorMap>
	                        <sld:ColorMapEntry color="#1e5d84" label=" geen gegevens" opacity="0.0000001" quantity="0"/>
							<sld:ColorMapEntry color="#2b83ba" label=" 0 mg per liter" opacity="1.0" quantity="0"/>
                            <sld:ColorMapEntry color="#6fb3c5" label=" 500" opacity="1.0" quantity="500"/>
                            <sld:ColorMapEntry color="#a8ded6" label=" 1000" opacity="1.0" quantity="1000"/>
                            <sld:ColorMapEntry color="#e0fff5" label=" 1500" opacity="1.0" quantity="1500"/>
                            <sld:ColorMapEntry color="#f3e9b3" label=" 2500" opacity="1.0" quantity="2500"/>
                            <sld:ColorMapEntry color="#fec788" label=" 5000" opacity="1.0" quantity="5000"/>
                            <sld:ColorMapEntry color="#e88554" label=" 10000" opacity="1.0" quantity="10000"/>
                            <sld:ColorMapEntry color="#c14547" label=" 15000" opacity="1.0" quantity="15000"/>
	                    </sld:ColorMap>
                    </sld:RasterSymbolizer>
                </sld:Rule>
            </sld:FeatureTypeStyle>
        </sld:UserStyle>
    </sld:UserLayer>
</sld:StyledLayerDescriptor>
```

#### chloride_transparant

```
<?xml version="1.0" ?>
<sld:StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:sld="http://www.opengis.net/sld">
    <sld:UserLayer>
        <sld:LayerFeatureConstraints>
            <sld:FeatureTypeConstraint/>
        </sld:LayerFeatureConstraints>
        <sld:UserStyle>
            <sld:Name>chloride_transparant</sld:Name>
            <sld:Title/>
            <sld:FeatureTypeStyle>
                <sld:Name/>
                <sld:Rule>
                    <sld:RasterSymbolizer>
                        <sld:Geometry>
                            <ogc:PropertyName>grid</ogc:PropertyName>
                        </sld:Geometry>
                        <sld:Opacity>1</sld:Opacity>
                        <sld:ColorMap>
                            <sld:ColorMapEntry color="#FFFFFF" opacity="0.000001" quantity="0"/>
                            <sld:ColorMapEntry color="#FFFFFF" opacity="0.000001" quantity="15000"/>
                        </sld:ColorMap>
                    </sld:RasterSymbolizer>
                </sld:Rule>
            </sld:FeatureTypeStyle>
        </sld:UserStyle>
    </sld:UserLayer>
</sld:StyledLayerDescriptor>
```

#### Grensvlakken

```
<?xml version="1.0" ?>
<sld:StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:sld="http://www.opengis.net/sld">
    <sld:UserLayer>
        <sld:LayerFeatureConstraints>
            <sld:FeatureTypeConstraint/>
        </sld:LayerFeatureConstraints>
        <sld:UserStyle>
            <sld:Name>Zeeland_maaiveld_midden</sld:Name>
            <sld:Title/>
            <sld:FeatureTypeStyle>
                <sld:Name/>
                <sld:Rule>
                    <sld:RasterSymbolizer>
                        <sld:Geometry>
                            <ogc:PropertyName>grid</ogc:PropertyName>
                        </sld:Geometry>
                        <sld:Opacity>1</sld:Opacity>
                        <sld:ColorMap>
                            <sld:ColorMapEntry color="#ffffff" label="geen gegevens" opacity="0.000001" quantity="-1012"/>
                            <sld:ColorMapEntry color="#500000" label="0 m-maaiveld" opacity="1.0" quantity="0"/>
                            <sld:ColorMapEntry color="#740000" label="2.5" opacity="1.0" quantity="2.5"/>
                            <sld:ColorMapEntry color="#a80000" label="5" opacity="1.0" quantity="5"/>
                            <sld:ColorMapEntry color="#ffa900" label="7.5" opacity="1.0" quantity="7.5"/>
                            <sld:ColorMapEntry color="#ffd37f" label="10" opacity="1.0" quantity="10"/>
                            <sld:ColorMapEntry color="#ffff74" label="12.5" opacity="1.0" quantity="12.5"/>
                            <sld:ColorMapEntry color="#d1ff74" label="15" opacity="1.0" quantity="15"/>
                            <sld:ColorMapEntry color="#37a800" label="20" opacity="1.0" quantity="20"/>
                            <sld:ColorMapEntry color="#beffe8" label="25" opacity="1.0" quantity="25"/>
                            <sld:ColorMapEntry color="#00a9e6" label="30" opacity="1.0" quantity="30"/>
                            <sld:ColorMapEntry color="#0085a8" label="40" opacity="1.0" quantity="40"/>
                            <sld:ColorMapEntry color="#004d74" label="80 m-maaiveld" opacity="1.0" quantity="80"/>
                            <sld:ColorMapEntry color="#888888" label="beneden max. meetdiepte" opacity="1.0" quantity="98"/>
                        </sld:ColorMap>
                    </sld:RasterSymbolizer>
                </sld:Rule>
            </sld:FeatureTypeStyle>
        </sld:UserStyle>
    </sld:UserLayer>
</sld:StyledLayerDescriptor>
```

#### Grensvlakken_transparant

```
<?xml version="1.0" ?>
<sld:StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:sld="http://www.opengis.net/sld">
    <sld:UserLayer>
        <sld:LayerFeatureConstraints>
            <sld:FeatureTypeConstraint/>
        </sld:LayerFeatureConstraints>
        <sld:UserStyle>
            <sld:Name>Zeeland_maaiveld_transparant</sld:Name>
            <sld:Title/>
            <sld:FeatureTypeStyle>
                <sld:Name/>
                <sld:Rule>
                    <sld:RasterSymbolizer>
                        <sld:Geometry>
                            <ogc:PropertyName>grid</ogc:PropertyName>
                        </sld:Geometry>
                        <sld:Opacity>1</sld:Opacity>
                        <sld:ColorMap>
                            <sld:ColorMapEntry color="#ffffff" label="" opacity="0.000001" quantity="-1012"/>
                            <sld:ColorMapEntry color="#ffffff" label="" opacity="0.000001" quantity="98"/>
                        </sld:ColorMap>
                    </sld:RasterSymbolizer>
                </sld:Rule>
            </sld:FeatureTypeStyle>
        </sld:UserStyle>
    </sld:UserLayer>
</sld:StyledLayerDescriptor>

```

#### vlieglijnen

```
<?xml version="1.0" encoding="ISO-8859-1"?>
<StyledLayerDescriptor version="1.0.0" 
    xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" 
    xmlns="http://www.opengis.net/sld" 
    xmlns:ogc="http://www.opengis.net/ogc" 
    xmlns:xlink="http://www.w3.org/1999/xlink" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>vlieglijnen</Name>
    <UserStyle>
    <Title>vlieglijnen</Title>
      <FeatureTypeStyle>
         <Rule>
          <MinScaleDenominator>200000</MinScaleDenominator>
          <Name>vlieglijnen</Name>
          <LineSymbolizer>
          <Stroke>
              <CssParameter name="stroke">#000000</CssParameter>                           
              <CssParameter name="stroke-width">1.5</CssParameter> 
              <CssParameter name="stroke-linecap">round</CssParameter>  
            </Stroke>
          </LineSymbolizer>                                          
         </Rule>
      </FeatureTypeStyle>
      <FeatureTypeStyle>
         <Rule>		
          <MinScaleDenominator>200000</MinScaleDenominator>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#ffffff</CssParameter>                           
              <CssParameter name="stroke-width">0.5</CssParameter>    
              <CssParameter name="stroke-linecap">round</CssParameter>    
            </Stroke> 
          </LineSymbolizer>
        </Rule>
      </FeatureTypeStyle>
      
        <FeatureTypeStyle>
         <Rule>
          <MinScaleDenominator>50000</MinScaleDenominator>
          <MaxScaleDenominator>200000</MaxScaleDenominator>
          <Name>vlieglijnen</Name>
          <LineSymbolizer>
          <Stroke>
              <CssParameter name="stroke">#000000</CssParameter>                           
              <CssParameter name="stroke-width">2.5</CssParameter> 
              <CssParameter name="stroke-linecap">round</CssParameter>  
            </Stroke>
          </LineSymbolizer>                                          
         </Rule>
      </FeatureTypeStyle>
      <FeatureTypeStyle>
         <Rule>		
          <MinScaleDenominator>50000</MinScaleDenominator>
          <MaxScaleDenominator>200000</MaxScaleDenominator>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#ffffff</CssParameter>                           
              <CssParameter name="stroke-width">1.5</CssParameter>    
              <CssParameter name="stroke-linecap">round</CssParameter>    
            </Stroke> 
          </LineSymbolizer>
        </Rule>
      </FeatureTypeStyle>
      
      <FeatureTypeStyle>
         <Rule>
          <MinScaleDenominator>5000</MinScaleDenominator>
          <MaxScaleDenominator>50000</MaxScaleDenominator>
          <Name>vlieglijnen</Name>
          <LineSymbolizer>
          <Stroke>
              <CssParameter name="stroke">#000000</CssParameter>                           
              <CssParameter name="stroke-width">3.5</CssParameter> 
              <CssParameter name="stroke-linecap">round</CssParameter>  
            </Stroke>
          </LineSymbolizer>                                          
         </Rule>
      </FeatureTypeStyle>
      <FeatureTypeStyle>
         <Rule>		
          <MinScaleDenominator>5000</MinScaleDenominator>
          <MaxScaleDenominator>50000</MaxScaleDenominator>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#ffffff</CssParameter>                           
              <CssParameter name="stroke-width">2.5</CssParameter>    
              <CssParameter name="stroke-linecap">round</CssParameter>    
            </Stroke> 
          </LineSymbolizer>
        </Rule>
      </FeatureTypeStyle>
      
      <FeatureTypeStyle>
         <Rule>
          
          <MaxScaleDenominator>5000</MaxScaleDenominator>
          <Name>vlieglijnen</Name>
          <LineSymbolizer>
          <Stroke>
              <CssParameter name="stroke">#000000</CssParameter>                           
              <CssParameter name="stroke-width">3.5</CssParameter> 
              <CssParameter name="stroke-linecap">round</CssParameter>  
            </Stroke>
          </LineSymbolizer>                                          
         </Rule>
      </FeatureTypeStyle>
      <FeatureTypeStyle>
         <Rule>		
          
          <MaxScaleDenominator>5000</MaxScaleDenominator>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#ffffff</CssParameter>                           
              <CssParameter name="stroke-width">2.5</CssParameter>    
              <CssParameter name="stroke-linecap">round</CssParameter>    
            </Stroke> 
          </LineSymbolizer>
        </Rule>
      </FeatureTypeStyle>
      
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>

```

#### Geschiktheid onttrekking

```
<?xml version="1.0" encoding="ISO-8859-1"?>
<StyledLayerDescriptor version="1.0.0" 
    xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" 
    xmlns="http://www.opengis.net/sld" 
    xmlns:ogc="http://www.opengis.net/ogc" 
    xmlns:xlink="http://www.w3.org/1999/xlink" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>Two color gradient</Name>
    <UserStyle>
      <Title>SLD Cook Book: Two color gradient</Title>
      <FeatureTypeStyle>
        <Rule>
          <RasterSymbolizer>
            <ColorMap type="intervals">
              <ColorMapEntry quantity="0.25" label="Ongeschikt" color="#f7fbff"/>
              <ColorMapEntry quantity="0.5" label="Matig geschikt" color="#afd1e7"/>
              <ColorMapEntry quantity="0.75" label="Geschikt" color="#3e8ec4"/>
              <ColorMapEntry quantity="1.0" label="Zeer geschikt" color="#08306b"/>
            </ColorMap>
          </RasterSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
```

## GeoWebCache

**Let op: na de OGG inrichting is de GeoWebCache veranderd. Deze lijkt niet meer
te werken. Gezien de performance lijkt dit ook niet nodig.**

Directe WMS integratie uitgezet zodat:

>https://projectgeodata.zeeland.nl/geoserver/freshem/wms  verwijst naar de WMS
>https://projectgeodata.zeeland.nl/geoserver/gwc/service/wms  verwijst naar de cache.

Dit geeft later de mogelijkheid om directe WMS toegang te blokkeren.

Voor elke group layer (chloride, grensvlak) een TileCache BlobStore opgezet.

Bij de TileCache instellingen voor chloride een parameter filter ingesteld op ELEVATION met daarin alle waarden die in de dimension voorkomen.

Helaas kan dit niet voor de dimensie DIM_GRENSWAARDE! Er treden geen fouten op, maar de cache werkt niet! 

>er moet een workaround worden gezocht: we hernoemen DIM_GRENSWAARDE naar ELEVATION

Zie ook docs:

>http://geowebcache.org/docs/1.11.0/configuration/layers/parameterfilters.html
>http://docs.geoserver.org/stable/en/user/geowebcache/troubleshooting.html

# Database

De WFS en WMS geowebservices betrekken een deel van de data uit een database. Dit kan worden ingericht met behulp van [PostgreSQL/Postgis](https://postgis.net/) zoals hieronder beschreven. Naar verwachting kan dit ook goed met andere oplossingen zoals het gebruik van [Geopackage](https://www.geopackage.org/) als databron. 

## PostgreSQL/Postgis

De Zeeland PostgreSQL/ Postgis server: 

host: geopg-ext.zeeland.nl
port: 5432
database: freshem
schema: chloride
user: freshem 
passwd: ***

# Data conversie

## Geschiktheid voor grondwaterontrekking
De basisgegevens van de geschiktheid voor grondwaterontrekking zijn aangeleverd
in de vorm van .asc bestanden. Voor het kunnen tonen van deze gegevens in de
profielen samen met de chloride data was het nodig de geschiktheidsgegevens
te combineren met de chloride gegevens. Hiervoor zijn een tweetal scripts gemaakt 

## conv_suit_extaction.py

Dit script (Python 3) converteert de .asc bestanden met de geschiktheid voor grondwaterontrekking
naar 50m en 100m geotifs.

De oorspronkelijke .asc bestanden hebben een resolutie van 100x100m. Voor het
combineren met de chloride gegevens is de 50m geotif versie nodig. Voor het tonen
in de viewer als WMS laag wordt de geotif gebruikt met oorspronkelijke 100m resolutie. 

## data_to_csv.py

Dit script (Python 3) converteert de .asc bestanden met chloride en de geotifs de geschiktheid voor grondwaterontrekking
naar een .csv bestand met xyz-coordinaten.

LET OP: Voor het runnen van dit script is 24-28 GB memory nodig. 

## Inlezen in PostGIS

De data in PostGIS worden ingelezen door het aanmaken van een [ogr vrt bestand](https://gdal.org/drivers/vector/vrt.html):


```xml
<OGRVRTDataSource>
    <OGRVRTLayer name="point_data">
        <SrcDataSource>point_data.csv</SrcDataSource>
        <GeometryType>wkbPoint</GeometryType>
        <LayerSRS>EPSG:28992</LayerSRS>
        <GeometryField encoding="PointFromColumns" x="x" y="y"/>
        <Field name="z" src="z" type="Real" />
        <Field name="laag" src="chloride_laag" type="Real" />
        <Field name="midden" src="chloride_midden" type="Real" />
        <Field name="hoog" src="chloride_hoog" type="Real" />
        <Field name="suit_extraction" src="suit_extraction" type="Real" />
    </OGRVRTLayer>
</OGRVRTDataSource>
```

Inlezen in PostGIS kan dan met:

```
ogr2ogr -overwrite -f "PostgreSQL" PG:"host=geopg-ext.zeeland.nl port=5432 dbname=freshem user=freshem password=***" -a_srs EPSG:28992  ./point_data.vrt -nln chloride.klassen_v2 -nlt PROMOTE_TO_MULTI
```

Daarna kan er een tabel worden afgeleid waarin hoogteprofielen zijn opgenomen die kunnen worden uitgeserveerd met WFS:

```sql
CREATE TABLE chloride.profielen_v2 AS
SELECT
    wkb_geometry,
    json_agg(z ORDER BY z)::character varying as z, 
  json_agg(laag ORDER BY z)::character varying as chloride_laag,
  json_agg(midden ORDER BY z)::character varying as chloride_midden,
  json_agg(hoog ORDER BY z)::character varying as chloride_hoog,
  json_agg(doorlatendheid ORDER BY z)::character varying as doorlatendheid
FROM 
  chloride.klassen_v2
GROUP BY 
  wkb_geometry;

ALTER TABLE chloride.profielen_v2 ADD COLUMN ogc_fid serial PRIMARY KEY;

CREATE INDEX profielen_v2_wkb_geometry_geom_idx ON chloride.profielen_v2 USING GIST(wkb_geometry);
```
