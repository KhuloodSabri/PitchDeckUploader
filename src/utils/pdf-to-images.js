const dbServices = require('../mock-db-services/services')
const uploadCareServices = require('./upload-care-utils')
const pdfPageCounter = require("pdf-page-counter")
const { fromBuffer } = require("pdf2pic");

const BULK_SIZE = 5

const pdfBufferToImagesBatch = (buffer, bulkStart, totalNumOfPages) => {
  if (bulkStart > totalNumOfPages) {
    return
  }

  const convert = fromBuffer(buffer, {});

  return convert.bulk(
    Array.from({ length: Math.min(BULK_SIZE, totalNumOfPages - bulkStart + 1) },
      (_, i) => i + bulkStart),
    true)
}

const pdfBufferToImages = (dataBuffer, username, fileName, clientId, uploadSocketIo) => {
  pdfPageCounter(dataBuffer).then((data) => {
    const numOfPages = data.numpages
    uploadSocketIo.setHandlerOfContinueUploadSignals(clientId, username, fileName, dataBuffer, BULK_SIZE, numOfPages)
    uploadSocketIo.setHandlerOfCancelUploadSignals(clientId, username, fileName)
    uploadSocketIo.sendUploadProgressData(clientId, fileName, {}, numOfPages)

    pdfBufferToImagesBatch(dataBuffer, 1, numOfPages)
      .then((imagesBuffers) => uploadCareServices.saveImagesToCloud(imagesBuffers, username, fileName, (uploadData) => {
        if (uploadData.error) {
          uploadSocketIo.sendErrorMessage("Error in saving images to cloud: ", username, fileName)
        }
        else {
          dbServices.addPagesToUploadedFile(username, fileName, uploadData)
          uploadSocketIo.sendUploadProgressData(clientId, fileName, uploadData, numOfPages)
        }
      })).catch(err => {
        uploadSocketIo.sendErrorMessage("Error in Converting pdf to images", username, fileName)
      })
  })
}


module.exports = {
  pdfBufferToImagesBatch,
  pdfBufferToImages,
}