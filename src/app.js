const pdf2images = require('./utils/pdf-to-images')
const UploadSocketIO = require('./utils/upload-socketio')
const InMemoryDB = require('./mock-db-services/in-momory-data')
const dbServices = require('./mock-db-services/services')
const path = require('path')
const http = require("http");
const express = require('express')
const multer = require('multer')
const toPdf = require("office-to-pdf")
const request = require('request')
const exphbs = require('express-handlebars')

// --------------------------------------------------------------------------------
//                              Server Configurations
// --------------------------------------------------------------------------------

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')

app.use(express.static(publicDirectoryPath))

app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs'
}));

app.set('view engine', 'hbs')
app.set('views', viewsPath)

app.use(express.json())

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
app.set('view engine', 'hbs');

// --------------------------------------------------------------------------------
//          Initialize server variables needed for sockets and file uploads
// --------------------------------------------------------------------------------

const uploadSocketIo = new UploadSocketIO(server)
let connections = [];

const multerUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50000000
    },
    fileFilter(req, file, callback) {
        if (file.originalname.match(/\.(pdf|ppt|pptx|doc|docx)$/)) {
            callback(undefined, true)
        } else {
            callback(new Error('The file should be pdf or ppt'), true)
        }
    },
})

// --------------------------------------------------------------------------------
//                           APIs to render HTML pages
// --------------------------------------------------------------------------------

app.get('/upload-deck', (req, res) => {        
    res.render('upload-page')
})

app.get('/signup', (req, res) => {        
    res.render('signup', { layout: false })
})

app.get('', (req, res) => {        
    res.render('login', { layout: false })
})

app.get('/login', (req, res) => {        
    res.render('login', { layout: false })
})

app.get('/decks', (req, res) => {  
    const username = req.query.username

    res.render('decks', {
        decks: dbServices.getUserUploadedFilesNames(username)
    })
})

app.get('/deck', (req, res) => {  
    let username = req.query.username
    let filename = req.query.filename

    if(filename.includes(' by ')){
        const tokens = filename.split(' by ')
        username = tokens[1]
        filename = tokens[0]
    }

    res.render('deck', {
        pages: dbServices.getUserFilePages(username, filename)
    })
})

// --------------------------------------------------------------------------------
//                              APIs to sign up login
// --------------------------------------------------------------------------------

app.post('/signup', (req, res) => {
    dbServices.addUser(req.body.username, req.body.password)
    res.send()
})

app.post('/login', (req, res) => {
    const isValid = dbServices.validateUser(req.body.username, req.body.password)
    if(isValid) {
        res.sendStatus(200)        
    }
    else{
        res.sendStatus(401)
    }
})

// ------------------------------------------------------------------------------------
//                              APIs to handle file uploads
// ------------------------------------------------------------------------------------

app.post('/deckpitch', multerUpload.single('pitch-upload-file'), (req, res) => {
    const clientId = req.query.clientid
    const username = req.query.username
    const fileName = req.file.originalname
    const dataBuffer = req.file.buffer

    if (!fileName.endsWith('.pdf')) {
        toPdf(dataBuffer).then((dataBuffer) => {
            pdf2images.pdfBufferToImages(dataBuffer, username, fileName, clientId, uploadSocketIo)
        })
    } else {
        pdf2images.pdfBufferToImages(dataBuffer, username, fileName, clientId, uploadSocketIo)
    }

    res.send({ info: 'Done' })
})

app.get('/ucarecdn', (req, res) => {
    const uuid = req.query.uuid
    request(`https://ucarecdn.com/${uuid}/`).pipe(res)
})

// ------------------------------------------------------------------------------------
//                  Code to handle connections and DB when server shuts down 
// ------------------------------------------------------------------------------------

server.on('connection', connection => {
    connections.push(connection);
    connection.on('close', () => connections = connections.filter(curr => curr !== connection));
});

function shutDown() {
    setTimeout(() => {
        process.exit(1);
    }, 10000);

    InMemoryDB.saveData()
    connections.forEach(curr => curr.end());
    setTimeout(() => connections.forEach(curr => curr.destroy()), 5000);
    server.close(() => {
        console.log('Closed out remaining connections');
    });
    process.exit(0);
}

// ------------------------------------------------------------------------------------
//                                         Run server
// ------------------------------------------------------------------------------------

server.listen(port, () => {
    console.log('Server is up on port ' + 3000)
    InMemoryDB.loadData()
})