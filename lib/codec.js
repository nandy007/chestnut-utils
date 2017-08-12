const crypto = require('crypto');

module.exports = {
    // aes编码
    aesCipher(str, ...args) {
        try {
            const cipher = crypto.createCipher('aes-128-ecb', ...args);
            return cipher.update(str, 'utf8', 'hex') + cipher.final('hex');
        } catch (e) {
            return null;
        }
    },
    // aes解码
    aesDecipher(str, ...args) {
        try {
            const decipher = crypto.createDecipher('aes-128-ecb', ...args);
            return decipher.update(str, 'hex', 'utf8') + decipher.final('utf8');
        } catch (e) {
            return null;
        }
    },

    // md5
    md5(str) {
        try {
            var md5 = crypto.createHash('md5');
            return md5.update(str).digest('hex');
        } catch (e) {
            return null;
        }
    }

}