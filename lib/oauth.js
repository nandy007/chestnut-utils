const { createHash } = require('crypto');

const util = module.exports = {
    getBody: function (rs) {
        const body = rs.body;
        try {
            return JSON.parse(body);
        } catch (e) {
            console.log(e);
        }
        return {};
    },
    createNonceStr: () => {
        return Math.random().toString(36).substr(2, 15);
    },
    createTimeStamp: () => {
        return parseInt(new Date().getTime() / 1000) + '';
    },
    encrypt: (algorithm, content) => {
        let hash = createHash(algorithm)
        hash.update(content)
        return hash.digest('hex');
    },
    getSign: (content) => util.encrypt('sha1', content),
    raw: (args) => {
        var keys = Object.keys(args);
        keys = keys.sort();
        var newArgs = {};
        keys.forEach(function (key) {
            newArgs[key.toLowerCase()] = args[key]
        });
        var rs = [];
        for (var k in newArgs) {
            rs.push(k + '=' + newArgs[k]);
        }
        var string = rs.join('&');
        return string;
    },
    expiresIn: 7200,
    isExpi: (ts)=>{
        var cur = util.createTimeStamp();
        if(cur-ts<util.expiresIn) return true;
        return false;
    }
};