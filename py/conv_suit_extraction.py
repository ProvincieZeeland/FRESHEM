#---------------------------------------------------------------------------------------------------
# Converts the 100m .asc files with suitable for extraction to 100m and 50m tifs.
#
# 50m tifs are needed for combining with the chloride data.
#
# Run unther Ubuntu because of compression.
#
# European Union Public Licence V. 1.2
# EUPL © the European Union 2007, 2016
#
# Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
#---------------------------------------------------------------------------------------------------

import glob
import os
import subprocess

import RasterUtils as RU

#---------------------------------------------------------------------------------------------------
def main():

  fromDir = r"P:\Project\Freshem\Data\FreshemFiles20240517"
  toDir100m = r"P:\Project\Freshem\Data\SuitExtraction100m"
  toDir50m = r"P:\Project\Freshem\Data\SuitExtraction50m"

  #UX = False
  UX = True
  #VRT = True
  VRT = False
  CLEANUP = True

  if UX:
    fromDir = r"/Data/freshem/suitextraction"
    toDir100m = r"/Data/freshem/suitextraction100m"
    toDir50m = r"/Data/freshem/suitextraction50m"

  pattern = "*.asc"

  if not os.path.isdir(fromDir):
    print("Directory not found: %s" % fromDir)
  if not os.path.isdir(toDir100m):
    print("Directory not found: %s" % toDir100m)
  if not os.path.isdir(toDir50m):
    print("Directory not found: %s" % toDir50m)

  print("fromDir  : %s" % fromDir)
  print("toDir100m: %s" % toDir100m)
  print("toDir50m : %s" % toDir50m)
  print("pattern  : %s" % pattern)
  print()

  pattern = os.path.join(fromDir,pattern)
  fileNames = glob.glob(pattern)
  if len(fileNames) == 0:
    print("No files found.")
    return

  maxFileNames = -1
  cntFileNames = 0
  for fileName in fileNames:

    fromFileName = os.path.basename(fileName)
    print("Processing: %s" % fromFileName)

    # Use new filenames:
    #   From:
    #     ASC_Suitability_extraction_boven_25cm.asc
    #     ASC_Suitability_extraction_onder_75cm
    #   To:
    #     suit_extracttion_25.asc
    #     suit_extracttion_-75.asc
    newFileName = "suit_extracttion_"
    if fromFileName.find("_boven_") > 0:
      postfix = RU.strAfter(fromFileName,"_boven_")
    elif fromFileName.find("_onder_") > 0:
      postfix = "-" + RU.strAfter(fromFileName,"_onder_")
    else:
      print("Invalid filename: %s" % fromFileName)
      return
    postfix = postfix.replace("cm.",".")
    newFileName = newFileName + postfix

    # Set (temporary) filenames.
    srsFileName = newFileName.replace(".asc","_srs.tif")
    extentFileName = newFileName.replace(".asc","_ext.tif")
    compressFileName = newFileName.replace(".asc",".tif")
    resampFileName = newFileName.replace(".asc","_resamp.tif")
    compressFileName2 = newFileName.replace(".asc",".tif")

    # Set full filenames.
    fromFileName = os.path.join(fromDir,fromFileName)
    srsFileName = os.path.join(toDir100m,srsFileName)
    extentFileName = os.path.join(toDir100m,extentFileName)
    compressFileName = os.path.join(toDir100m,compressFileName)

    resampFileName = os.path.join(toDir50m,resampFileName)
    compressFileName2 = os.path.join(toDir50m,compressFileName2)

    if VRT:
      # For testing.
      srsFileName = srsFileName.replace(".tif",".vrt")
      extentFileName = extentFileName.replace(".tif",".vrt")
      compressFileName = compressFileName.replace(".tif",".vrt")
      resampFileName = resampFileName.replace(".tif",".vrt")
      compressFileName2 = compressFileName2.replace(".tif",".vrt")

    #--------------------------------------------------------
    # Set SRS.
    #--------------------------------------------------------
    if (os.path.isfile(srsFileName)):
      os.remove(srsFileName)
    setSRS(fromFileName,srsFileName)

    #--------------------------------------------------------
    # Align extent.
    #--------------------------------------------------------
    raster = RU.readRaster(srsFileName)
    newExtent = RU.alignExtent(raster.extent,raster.cellSize)
    if maxFileNames == 1:
      print("  cellSize     : %s" % raster.cellSize)
      print("  extent       : %s" % raster.extent)
      print("  new extent   : %s" % newExtent)

    if (os.path.isfile(extentFileName)):
      os.remove(extentFileName)
    alignExtent(srsFileName,extentFileName,newExtent)

    #--------------------------------------------------------
    # Compress.
    #--------------------------------------------------------
    if (os.path.isfile(compressFileName)):
      os.remove(compressFileName)
    compress(extentFileName,compressFileName)

    #--------------------------------------------------------
    # Add overview.
    #--------------------------------------------------------
    addOverview(compressFileName)

    #--------------------------------------------------------
    # Check.
    #--------------------------------------------------------
    if maxFileNames == 1:
      print()
      print("####### %s" % compressFileName)
      print()
      rasterInfo(compressFileName)
      print()

    #--------------------------------------------------------
    # Resample 50m.
    #--------------------------------------------------------

    if (os.path.isfile(resampFileName)):
      os.remove(resampFileName)
    resample(compressFileName,resampFileName,50)

    #--------------------------------------------------------
    # Compress.
    #--------------------------------------------------------
    if (os.path.isfile(compressFileName2)):
      os.remove(compressFileName2)
    compress(resampFileName,compressFileName2)

    #--------------------------------------------------------
    # Add overview.
    #--------------------------------------------------------
    addOverview(compressFileName2)

    #--------------------------------------------------------
    # Check.
    #--------------------------------------------------------
    if maxFileNames == 1:
      print()
      print("####### %s" % compressFileName2)
      print()
      rasterInfo(compressFileName2)
      print()

    # Early stop?
    cntFileNames += 1
    if (maxFileNames > 0) and (maxFileNames == cntFileNames):
      print("### Early stop!")
      break

  if CLEANUP:

    patterns = ["*_srs.tif","*_ext.tif"]
    cleanup(toDir100m,patterns,VRT)

    patterns = ["*_resamp.tif"]
    cleanup(toDir50m,patterns,VRT)


#---------------------------------------------------------------------------------------------------
def execCmd(cmd: str,cwd=None) -> str:
  result = subprocess.Popen(cmd,shell=True,stdout=subprocess.PIPE,cwd=cwd).stdout.read()
  if not result is None:
    result = result.decode("utf-8")
  else:
    result = ""
  return result

#---------------------------------------------------------------------------------------------------
def setSRS(fromFileName,toFileName):
  #cmd = "gdalwarp -of VRT -s_srs epsg:28992 -t_srs epsg:28992 %s %s" % (fromFileName,toFileName)
  cmd = "gdalwarp -s_srs epsg:28992 -t_srs epsg:28992 %s %s" % (fromFileName,toFileName)
  execCmd(cmd)

#---------------------------------------------------------------------------------------------------
def compress(fromFileName,toFileName):
  cmd = "gdal_translate -co 'TILED=YES' -co 'BLOCKXSIZE=512' -co 'BLOCKYSIZE=512' -co 'COMPRESS=DEFLATE' %s %s" % (fromFileName,toFileName)
  execCmd(cmd)

#---------------------------------------------------------------------------------------------------
def addOverview(fileName):
  cmd = "gdaladdo -r nearest %s 2 4 8 16 32 64 128" % fileName
  execCmd(cmd)

#---------------------------------------------------------------------------------------------------
def alignExtent(fromFileName,toFileName,newExtent):
  x1,y1,x2,y2 = newExtent
  # -a_ullr <ulx> <uly> <lrx> <lry>
  option = "-a_ullr %s %s %s %s" % (x1,y2,x2,y1)
  cmd = "gdal_translate %s %s %s" % (option,fromFileName,toFileName)
  execCmd(cmd)

#---------------------------------------------------------------------------------------------------
def resample(fromFileName,toFileName,newCellSize):
  option = "-tr %s %s" % (newCellSize,newCellSize)
  cmd = "gdal_translate %s %s %s" % (option,fromFileName,toFileName)
  execCmd(cmd)

#---------------------------------------------------------------------------------------------------
def rasterInfo(fileName):
  cmd = "gdalinfo %s" % fileName
  result = execCmd(cmd)
  print(result)

#---------------------------------------------------------------------------------------------------
def cleanup(dirName,patterns,VRT):
  for pattern in patterns:
    if VRT:
      pattern = pattern.replace(".tif",".vrt")
    pattern = os.path.join(dirName,pattern)
    fileNames = glob.glob(pattern)
    if len(fileNames) == 0:
      print("No files found: %s" % pattern)
      continue
    for fileName in fileNames:
      fileName = os.path.join(dirName,fileName)
      os.remove(fileName)

#---------------------------------------------------------------------------------------------------
#---------------------------------------------------------------------------------------------------
main()
