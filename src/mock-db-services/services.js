const InMemoryDB = require('./in-momory-data')

const addUser = (username, password) => {
    if (InMemoryDB.data.find((user) => user.username == username)) {
        return false
    }

    InMemoryDB.data.push({ username, password , uploadedFiles: []})
    return true
}

const validateUser = (username, password) => {
    const user = InMemoryDB.data.find((user) => user.username == username && user.password == password)
    
    if(user){
        return true
    }
    return false
}

const getUserUploadedFilesNames = (username) => {
    if(!username || username == '') {
        let result = []
        
        InMemoryDB.data.forEach(user => {
            userFiles = user.uploadedFiles.map((file) => file.name + ' by ' + user.username)
            if(userFiles && userFiles.length > 0){
                result = result.concat(userFiles)
            }
        })

        return result
    }
    const user = InMemoryDB.data.find((user) => user.username == username)
    return user.uploadedFiles.map((file) => file.name)
}

const getUserFilePages = (username, fileName) => {
    const user = InMemoryDB.data.find((user) => user.username == username)
    const uploadedFile = user.uploadedFiles.find((file) => file.name == fileName)

    if (!uploadedFile) {
        return []
    }

    return Object.keys(uploadedFile.uuids).map((numAsStr) => parseInt(numAsStr)).sort().map((pageNum) => uploadedFile.uuids[pageNum]);
    // return uploadedFile.uuids
}

const addUploadedFileToUser = (username, fileName, uuids = {}) => {
    const user = InMemoryDB.data.find((user) => user.username == username)
    user.uploadedFiles.push({
        name: fileName,
        uuids: JSON.parse(uuids),
    })
}

const addPagesToUploadedFile = (username, fileName, uuids) => {
    const user = InMemoryDB.data.find((user) => user.username == username)
    const uploadedFile = user.uploadedFiles.find((file) => file.name == fileName)
    uuidsObj = JSON.parse(uuids)

    if (!uploadedFile) {
        user.uploadedFiles.push({
            name: fileName,
            uuids: uuidsObj,
        })
    } else {
        Object.keys(uuidsObj).forEach((pageNumber) => {
            uploadedFile.uuids[pageNumber] = uuidsObj[pageNumber.toString()]
        })
    }
}

const deleteUploadedFile = (username, fileName) => {
    const user = InMemoryDB.data.find((user) => user.username == username)
    const fileToDelete = user.uploadedFiles.find((file) => file.name == fileName)

    if(fileToDelete){
        user.uploadedFiles = user.uploadedFiles.filter((file) => file.name != fileName)
        return Object.keys(fileToDelete.uuids).map((page) => fileToDelete.uuids[page]);
    }
    
    return []
}

module.exports = {
    addPagesToUploadedFile,
    addUploadedFileToUser,
    addUser,
    deleteUploadedFile,
    getUserUploadedFilesNames,
    getUserFilePages,
    validateUser,
}