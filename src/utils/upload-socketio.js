const pdf2images = require('./pdf-to-images')
const dbServices = require('../mock-db-services/services')
const uploadCareServices = require('./upload-care-utils')
const socketio = require("socket.io")
const { v4: uuidv4 } = require('uuid')

module.exports = class UploadSocketIO {
    constructor(server) {
        this.io = socketio(server)
        this.socketsMap = {}
        this.io.on('connection', (socket) => {
            console.log('New WebSocket connection')
            const createdId = uuidv4();
            this.socketsMap[createdId] = socket;

            socket.emit('CreatedId', createdId)

            socket.on('disconnect', () => {
                console.log('close socket')
                delete this.socketsMap[createdId]
            })
        })
    }

    getSocket(socketId) {
        return this.socketsMap[socketId]
    }

    sendUploadProgressData(socketId, fileName, uploadData, totalNumOfPages) {
        const socket = this.getSocket(socketId)

        if (!socket) {
            return
        }

        socket.emit('uploadProgress',
            {
                fileName: fileName,
                uploadData: uploadData,
                totalNumOfPages, totalNumOfPages
            })
    }

    sendErrorMessage(socketId, errorMessage, username, fileName) {
        const socket = this.getSocket(socketId)

        if (!socket) {
            return
        }

        socket.emit('error', { errorMessage, fileName })
        setTimeout(() => {
            var deletedUuids = dbServices.deleteUploadedFile(username, fileName)
            uploadCareServices.revertUpload(socket, deletedUuids, fileName)
        }, 4000)
    }

    setHandlerOfCancelUploadSignals(socketId, username, fileName) {
        const socket = this.getSocket(socketId)

        if (!socket) {
            return
        }

        socket.on('cancel', () => {
            setTimeout(() => {
                var deletedUuids = dbServices.deleteUploadedFile(username, fileName)
                uploadCareServices.revertUpload(socket, deletedUuids, fileName)
            }, 4000)
        })
    }

    setHandlerOfContinueUploadSignals(socketId, username, fileName, dataBuffer, bulkSize, totalNumOfPages) {
        const socket = this.getSocket(socketId)

        if (!socket) {
            return
        }

        socket.on('contUpload' + fileName, (pageNum) => {
            if (pageNum > totalNumOfPages) {
                return
            }

            pdf2images.pdfBufferToImagesBatch(dataBuffer, pageNum, totalNumOfPages)
                .then((imagesBuffers) => uploadCareServices.saveImagesToCloud(imagesBuffers, username, fileName, (uploadData) => {
                    if (uploadData.error) {
                        this.sendErrorMessage("Error in saving images to cloud", username, fileName)
                    }
                    else {
                        dbServices.addPagesToUploadedFile(username, fileName, uploadData)
                        this.sendUploadProgressData(socketId, fileName, uploadData, totalNumOfPages)
                    }
                })).catch(err => {
                    uploadSocketIo.sendErrorMessage("Error in Converting pdf to images", username, fileName)
                })
        })
    }
}
