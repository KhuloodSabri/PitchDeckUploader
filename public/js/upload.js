const uploadForm = document.querySelector('form')
const fileInput = document.querySelector('input')
const filePathLabel = document.querySelector('#file-path')
const previewElement = document.querySelector('#preview-pitch-deck')
const progressDiv = document.querySelector('#upload-progress')
const progressBar = document.querySelector('#progress-bar')
const uploadStatusMessage = document.querySelector('#upload-status-message')
const uploadButton = document.querySelector("#upload-button")
const cancelUploadButton = document.querySelector("#cancel-upload-button")

const socket = io()
let clientId = undefined;
let isUploading = false
let isUploadCanceled = false

fileInput.addEventListener('change', (e) => {
    if (!fileInput || fileInput.value == '' || isUploading) {
        return
    }

    uploadButton.style.display = "none"
    isUploading = true
    progressDiv.style.display = "flex"
    progressBar.style.width = "0%"
    filePathLabel.textContent = fileInput.value
    previewElement.innerHTML = ''
    previewElement.style.maxHeight = '80%'
    uploadStatusMessage.innerText = "Uploading file to server ..."

    let formData = new FormData();
    formData.append("pitch-upload-file", fileInput.files[0]);

    fetch('/deckpitch?clientid=' + clientId + '&username=' + localStorage.getItem('username'),
        {
            method: "POST",
            body: formData
        }).then(response => {
            uploadStatusMessage.innerText = "File uploaded to server"
            setTimeout(() => {
                uploadStatusMessage.innerText = "Processing file on server, saving your files to cloud ..."
            }, 2000)
        }).catch(error => {
            uploadStatusMessage.innerText = "An error occured"
        });
})

cancelUploadButton.onclick = (e) => {
    uploadStatusMessage.innerText = "Canceling upload..."
    previewElement.innerHTML = ''
    isUploadCanceled = true
    progressBar.style.width = "0%";
    socket.emit('cancel')
}

const reloadImg = (img, src) => {
    img.setAttribute('src', '../assets/images/loading.gif');
    setTimeout(() => {
        img.setAttribute('src', src);
    }, 3000);
}

socket.on('CreatedId', (id) => {
    clientId = id
})

socket.on('uploadProgress', (data) => {
    if (isUploadCanceled || !isUploading) {
        isUploading = false
        return
    }

    if (previewElement.childNodes.length == 0) {
        for (var i = 1; i <= data.totalNumOfPages; i++) {
            const img = document.createElement('img');
            img.setAttribute('src', '../assets/images/loading.gif');
            img.setAttribute('loading', 'lazy');
            img.setAttribute('alt', 'image not found');
            img.setAttribute('id', "page_" + i);
            previewElement.appendChild(img)
        }
    }
    else {
        const uploadData = JSON.parse(data.uploadData)
        let pageNum = 0

        Object.keys(uploadData).forEach((key) => {
            const imgId = '#page_' + key;
            const img = document.querySelector(imgId)
            img.setAttribute('src', `/ucarecdn?uuid=${uploadData[key]}`)
            img.addEventListener("error", () => reloadImg(img, `https://ucarecdn.com/${uploadData[key]}/`))

            if (parseInt(key) > pageNum) {
                pageNum = parseInt(key)
            }
        })

        const progress = (pageNum * 100.0 / data.totalNumOfPages)
        if (progress >= 100) {
            isUploading = false
            uploadButton.style.display = 'inline-block'
            uploadStatusMessage.innerText = 'Your uploud is complete'
        }
        progressBar.style.width = progress + "%";
        socket.emit('contUpload' + data.fileName, pageNum + 1)
    }
})

socket.on('error',  ({errorMessage, fileName}) => {
    uploadStatusMessage.innerText = errorMessage
    previewElement.innerHTML = ''
})

socket.on('canceled', () => {
    uploadStatusMessage.innerText = 'Upload canceled successfully'
})




