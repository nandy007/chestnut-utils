const fs = require('fs'), path = require('path');

module.exports = {
    getJSON(...paths){
        const absolutePath = path.join(...paths);
        return require(absolutePath);
    },
    saveJSON(...paths){
        const absolutePath = path.join(...paths);
        fs.writeFileSync(absolutePath, JSON.stringify(require(absolutePath)));
    }
}