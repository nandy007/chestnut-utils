const crypto = require('crypto');

module.exports = {
    // aes编码
    aesCipher(str, key, vi) {
        const cipher = crypto.createCipher('aes-128-ecb', key);
        return cipher.update(str, 'utf8', 'hex') + cipher.final('hex');
    },
    // aes解码
    aesDecipher (str, key, vi) {
        const decipher = crypto.createDecipher('aes-128-ecb', key);
        return decipher.update(str, 'hex', 'utf8') + decipher.final('utf8');
    },

    // md5
    md5 (str){
        var md5 = crypto.createHash('md5');
        return md5.update(str).digest('hex');
    }

}