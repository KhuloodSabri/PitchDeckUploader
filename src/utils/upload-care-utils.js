
const path = require('path')
const fs = require('fs')
const request = require('request')

const UPLOADCARE_BASE_URL = 'https://upload.uploadcare.com/base/'
const UPLOADCARE_BASE_API = 'https://api.uploadcare.com/'
const UPLOADCARE_PUB_KEY = '54f65d06e224c311a61f'
const UPLOADCARE_SECRET_KEY = '3d9c9679da4d76366c03'


const saveImagesToCloud = (imagesBuffers, username, fileName, callback) => {
    const tempPath = path.join(__dirname, `../temp/uploads/${username}/${fileName}/`)

    if (!fs.existsSync(tempPath)) {
        fs.mkdirSync(tempPath, { recursive: true })
    }


    const formData = {
        UPLOADCARE_PUB_KEY: UPLOADCARE_PUB_KEY,
        UPLOADCARE_STORE: 'auto',
    };

    imagesBuffers.forEach((imgBuff) => {
        const savePath = path.join(tempPath, `${imgBuff.page}.png`)
        fs.writeFileSync(savePath, imgBuff.base64, "base64")
        formData[`${imgBuff.page}`] = fs.createReadStream(savePath)
    })

    request.post({ url: UPLOADCARE_BASE_URL, formData: formData }, (error, httpResponse, body) => {
        fs.rmdirSync(tempPath, { recursive: true })

        if (error) {
            callback({ error: error });
        } else {
            callback(body)
        }
    });
}

const revertUpload = (socket, uuids, fileName) => {
    request({
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.uploadcare-v0.5+json',
            'Authorization': `Uploadcare.Simple ${UPLOADCARE_PUB_KEY}:${UPLOADCARE_SECRET_KEY}`
        },
        uri: UPLOADCARE_BASE_API + 'files/storage/',
        body: JSON.stringify(uuids),
        method: 'DELETE'
    }, function (err, res, body) {
        if (err || res.statusCode != 200) {
            socket.emit('error', { errorMessage: "Error in upload cancel", fileName })
        } else {
            socket.emit('canceled', fileName)
        }
    })
}


module.exports = {
    saveImagesToCloud,
    revertUpload,
}