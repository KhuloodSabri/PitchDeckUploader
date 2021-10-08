const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname,'mock-db.json')

class InMemoryDB{
    constructor(){
        data = []
    }

    static loadData(){
        InMemoryDB.data = JSON.parse(fs.readFileSync(dbPath).toString())
    }

    static saveData(){
        fs.writeFileSync(dbPath, JSON.stringify(InMemoryDB.data))
    }
}

module.exports = InMemoryDB