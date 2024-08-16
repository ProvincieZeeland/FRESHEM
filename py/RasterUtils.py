#---------------------------------------------------------------------------------------------------
# Raster Utilities
#
# European Union Public Licence V. 1.2
# EUPL © the European Union 2007, 2016
#
# Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
#---------------------------------------------------------------------------------------------------

import numpy as np
from typing import Union

import osgeo.gdal as gd

#-------------------------------------------------------------------------------
def strAfter(s,after):
  index = s.lower().find(after.lower())
  if index < 0:
    return ""
  else:
    return s[(index+len(after)):]

#---------------------------------------------------------------------------------------------------
class Raster():
  #---------------------------------------------------------------------------------------------------
  def __init__(self,raster,cellSize,nrCols,nrRows,extent,dataType,noDataValue):
    self.raster = raster
    self.cellSize = cellSize
    self.nrCols = nrCols
    self.nrRows = nrRows
    self.extent = extent
    self.dataType = dataType
    self.noDataValue = noDataValue

#-------------------------------------------------------------------------------
# Align the extent with lower-left as origin (i.e. a multiple of cellsize).
def alignExtent(extent,cellSize):
  precision = 8
  nrCols,nrRows = calcNrColsRowsFromExtent(extent,cellSize)

  minx = round(extent[0] / cellSize,0) * cellSize
  miny = round(extent[1] / cellSize,0) * cellSize
  maxx = minx + nrCols * cellSize
  maxy = miny + nrRows * cellSize

  minx = round(minx,precision)
  miny = round(miny,precision)
  maxx = round(maxx,precision)
  maxy = round(maxy,precision)
  return [minx,miny,maxx,maxy]

#-------------------------------------------------------------------------------
def calcExtentFromGT(geotransform,nrCols,nrRows):
  precision = 9
  minx = geotransform[0]
  miny = geotransform[3] + nrRows * geotransform[5]
  maxx = geotransform[0] + nrCols * geotransform[1]
  maxy = geotransform[3]
  minx = round(minx,precision)
  miny = round(miny,precision)
  maxx = round(maxx,precision)
  maxy = round(maxy,precision)
  return [minx,miny,maxx,maxy]

#-------------------------------------------------------------------------------
# Extent is a list of [minx,miny,maxx,maxy].
def calcNrColsRowsFromExtent(extent,cellSize):
  return (int(round((extent[2]-extent[0]) / cellSize,0)),
          int(round((extent[3]-extent[1]) / cellSize,0)))

#-------------------------------------------------------------------------------
# Conversion between GDAL types and Numpy types.
def dataTypeGdalToNumpy(dataType):
  if dataType==gd.GDT_Byte:
    return np.uint8
    #return np.byte
  elif dataType==gd.GDT_Int16:
    return np.int16
  elif dataType==gd.GDT_Int32:
    return np.int32
  elif dataType==gd.GDT_UInt16:
    return np.uint16
  elif dataType==gd.GDT_UInt32:
    return np.uint32
  elif dataType==gd.GDT_Float32:
    return np.float32
  elif dataType==gd.GDT_Float64:
    return np.float64
  elif dataType==gd.GDT_CInt16:
    raise Exception("Invalid GDAL type.")
  elif dataType==gd.GDT_CInt32:
    raise Exception("Invalid GDAL type.")
  elif dataType==gd.GDT_CFloat32:
    raise Exception("Invalid GDAL type.")
  elif dataType==gd.GDT_CFloat64:
    raise Exception("Invalid GDAL type.")
  else:
    raise Exception("Invalid GDAL type.")

#-------------------------------------------------------------------------------
def dataTypeGdalToString(dataType):
  if dataType==gd.GDT_Byte:
    return "byte"
  elif dataType==gd.GDT_Int16:
    return "int16"
  elif dataType==gd.GDT_Int32:
    return "int32"
  elif dataType==gd.GDT_UInt16:
    return "uint16"
  elif dataType==gd.GDT_UInt32:
    return "uint32"
  elif dataType==gd.GDT_Float32:
    return "float32"
  elif dataType==gd.GDT_Float64:
    return "float64"
  elif dataType==gd.GDT_CInt16:
    return "cint16"
  elif dataType==gd.GDT_CInt32:
    return "cint32"
  elif dataType==gd.GDT_CFloat32:
    return "cfloat32"
  elif dataType==gd.GDT_CFloat64:
    return "cfloat64"
  else:
    return "unknown"

#---------------------------------------------------------------------------------------------------
def readRaster(fileName: str) -> Union[Raster,None]:

  dataset = gd.Open(fileName,gd.GA_ReadOnly)
  if dataset is None:
    print("Raster not found: %s" % fileName)
    return None

  band = dataset.GetRasterBand(1)
  cellSize = dataset.GetGeoTransform()[1]
  nrCols = dataset.RasterXSize
  nrRows = dataset.RasterYSize
  extent = calcExtentFromGT(dataset.GetGeoTransform(),nrCols,nrRows)
  dataType = dataTypeGdalToNumpy(band.DataType)
  noDataValue = band.GetNoDataValue()
  rasterData = band.ReadAsArray()

  del band
  gd.Dataset.__swig_destroy__(dataset)
  del dataset

  raster = Raster(rasterData,cellSize,nrCols,nrRows,extent,dataType,noDataValue)
  return raster

#---------------------------------------------------------------------------------------------------
def showRasterInfo(fileName: str):
  raster = readRaster(fileName)
  print("  cellSize     : %s" % raster.cellSize)
  print("  nrCols/nrRows: %s %s" % (raster.nrCols,raster.nrRows))
  print("  extent       : %s" % raster.extent)
  print("  dataType     : %s" % raster.dataType)
  print("  noDataValue  : %s" % raster.noDataValue)
