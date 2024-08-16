#---------------------------------------------------------------------------------------------------
# Converts chloride and suit_extraction points to a csv file.
#
# Needs 16-28 GB memory!
#
# Run:
#   activate <conda env>
#   python data_to_csv.py
#
# European Union Public Licence V. 1.2
# EUPL © the European Union 2007, 2016
#
# Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
#---------------------------------------------------------------------------------------------------

import os

import numpy as np
import traceback

import RasterUtils as RU

#---------------------------------------------------------------------------------------------------
class Data():
  #---------------------------------------------------------------------------------------------------
  def __init__(self,x: float,y: float,z: float):
    self.x = x
    self.y = y
    self.z = z
    self.laag = 0.0
    self.midden = 0.0
    self.hoog = 0.0
    self.suit_extraction = 0.0

#---------------------------------------------------------------------------------------------------
class Point():
  #---------------------------------------------------------------------------------------------------
  def __init__(self,x: float,y: float,z: float, value: float):
    self.x = x
    self.y = y
    self.z = z
    self.value = value

#---------------------------------------------------------------------------------------------------
#---------------------------------------------------------------------------------------------------
class DataToCsv():

  test = False

  #---------------------------------------------------------------------------------------------------
  def convertRasterToPoint(self,raster: RU.Raster,z: float) -> dict:
    pointDict = dict()
    hCellSize = int(raster.cellSize / 2)
    y = int(raster.extent[3]) - hCellSize
    for r in np.arange(0,raster.nrRows):
      x = int(raster.extent[0]) + hCellSize
      for c in np.arange(0,raster.nrCols):
        v = raster.raster[r,c]
        if v != raster.noDataValue:
          key = "%.0f_%.0f_%.2f" % (x,y,z)
          pointDict[key] = Point(x,y,z,v)
        x += raster.cellSize
      y -= raster.cellSize
    return pointDict

  #---------------------------------------------------------------------------------------------------
  # Voegt ook nieuwe punten toe.
  def mergeRasterData(self,dataDict: dict,pointDict: dict,valueName: str):
    for key,pointData in pointDict.items():
      if not key in dataDict:
        data = Data(pointData.x,pointData.y,pointData.z)
        dataDict[key] = data
      setattr(dataDict[key],valueName,pointData.value)

  #---------------------------------------------------------------------------------------------------
  # Voegt geen nieuwe punten toe.
  def joinRasterData(self,dataDict: dict,pointDict: dict,valueName: str):
    for key,pointData in pointDict.items():
      if not key in dataDict:
        continue
      setattr(dataDict[key],valueName,pointData.value)

  #---------------------------------------------------------------------------------------------------
  def readRasters(self,chlorideDir,suit_extractionDir) -> any:
    dataDict = dict()
    skipped = []

    # Fill z values.
    zValues = []
    zDelta = 0.5
    zStart = -49.75
    zEnd = 23.75

    if self.test:
      zStart = -12.25
      zEnd = -10.25

    zValue = zStart
    while True:
      zValues.append(zValue)
      if zValue == zEnd:
        break
      zValue += zDelta
      if len(zValues) > 1000:
        print("Early stop")
        break

    print("Z-values: ")
    print(zValues)

    #-----------------------------------------------------------------
    # Chloridegehalte
    #-----------------------------------------------------------------
    chlorideTypes = ["laag","midden","hoog"]

    for chlorideType in chlorideTypes:
      for i in range(len(zValues)):
        zValue = zValues[i]
        print("Processing %s,%s..." % (chlorideType,zValue))
        if abs(zValue) < 1:
          zName = str(zValue).replace("0.","")
        else:
          zName = str(zValue).replace(".","")
        rasterName = "chloride_%s_%s.asc" % (chlorideType,zName)
        rasterName = os.path.join(chlorideDir,rasterName)
        if not os.path.isfile(rasterName):
          print("Raster not found: %s" % rasterName)
          skipped.append(rasterName)
          continue

        # Read raster.
        raster = RU.readRaster(rasterName)
        # Convert to points.
        rasterDict = self.convertRasterToPoint(raster,zValue)
        # Merge with data.
        self.mergeRasterData(dataDict,rasterDict,chlorideType)

    #-----------------------------------------------------------------
    # Doorlatendheid
    #-----------------------------------------------------------------

    # ASC_Suitability_extraction_boven_2375cm.tif
    for i in range(len(zValues)):
      zValue = zValues[i]
      print("Processing %s..." % zValue)
      if abs(zValue) < 1:
        zName = str(zValue).replace("0.","")
      else:
        zName = str(zValue).replace(".","")
      if zValue < 0:
        zName = zName.replace("-","")
        zName = "onder_%scm" % zName
      else:
        zName = "boven_%scm" % zName
      rasterName = "ASC_Suitability_extraction_%s.tif" % zName
      rasterName = os.path.join(suit_extractionDir,rasterName)
      if not os.path.isfile(rasterName):
        print("Raster not found: %s" % rasterName)
        skipped.append(rasterName)
        continue
      # Read raster.
      raster = RU.readRaster(rasterName)
      # Convert to points.
      rasterDict = self.convertRasterToPoint(raster,zValue)
      # Join with data.
      self.joinRasterData(dataDict,rasterDict,"suit_extraction")

    return (dataDict,skipped)

  #---------------------------------------------------------------------------------------------------
  def writeToCSV(self,fileName,dataDict):
    with open(fileName,"w") as f:
      line = "x,y,z,chloride_laag,chloride_midden,chloride_hoog,suit_extraction\n"
      f.write(line)
      datas = dataDict.values()
      for data in datas:
        x = data.x
        y = data.y
        z = data.z
        laag = data.laag
        midden = data.midden
        hoog = data.hoog
        suit_extraction = data.suit_extraction
        line = "%.0f,%.0f,%.2f,%.0f,%.0f,%.0f,%.3f\n" % (x,y,z,laag,midden,hoog,suit_extraction)
        f.write(line)

  #---------------------------------------------------------------------------------------------------
  def run(self):

    #self.test = True

    if (self.test):
      print("### Mode: TEST")

    fromChlorideDir = r"C:\Freshem\3D\asc"
    fromSuitDir = r"C:\Freshem\SuitExtraction50m"
    toDir = r"C:\Freshem\PointData_CSV"

    try:
      # Check from dir.
      if not os.path.isdir(fromChlorideDir):
        raise Exception("Directory not found: %s" % fromChlorideDir)

      # Check to dir.
      if not os.path.isdir(fromSuitDir):
        raise Exception("Directory not found: %s" % fromSuitDir)

      # Check csv file.
      csvFileName = os.path.join(toDir,"point_data.csv")
      if self.test:
        if os.path.isfile(csvFileName):
          os.remove(csvFileName)
      else:
        if os.path.isfile(csvFileName):
          raise Exception("File already exist: %s" % csvFileName)

      print("From directory: %s" % fromChlorideDir)
      print("From directory: %s" % fromSuitDir)
      print("To directory  : %s" % toDir)

      # Read the input rasters.
      print("Reading rasters...")
      dataDict,skipped = self.readRasters(fromChlorideDir,fromSuitDir)

      # Show info.
      print("Data points found: %s" % len(dataDict.keys()))
      print("Rasters skipped  : %s" % len(skipped))

      # Write the csv.
      print("Writing to csv: %s" % csvFileName)
      self.writeToCSV(csvFileName,dataDict)

      # Show skipped files.
      if len(skipped) > 0:
        print("Rasters skipped:")
        for line in skipped:
          print("  %s" % line)

      print("From directory: %s" % fromChlorideDir)
      print("From directory: %s" % fromSuitDir)
      print("To directory  : %s" % toDir)

      # Show points with chloride data and also suit_extraction data.
      USE = True
      if USE:
        cnt = 0
        datas = dataDict.values()
        for data in datas:
          if (data.midden > 0) and (data.suit_extraction > 0):
            cnt += 1
        print("")
        print("Nr. of points with all data: %s" % cnt)
        print("")

    except Exception as ex:
      if self.test:
        traceback.print_exc()
      else:
        print(ex)

    if (self.test):
      print("### Mode: TEST")

#---------------------------------------------------------------------------------------------------
#---------------------------------------------------------------------------------------------------
if __name__ == "__main__":
  ap = DataToCsv()
  ap.run()
