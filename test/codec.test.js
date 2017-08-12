const lib = require("../lib/codec");

describe('module', function () {

    // 测试aes加解密
    describe('aes', function () {
        it('aesCipher and aesDecipher should success', function () {
            const str = '11111', key = 'password';
            lib.aesDecipher(lib.aesCipher(str, key), key).should.be.equal(str);
        });
    });

    // 测试md5加密
    describe('md5', function () {
        it('md5 should success', function () {
            const str = 'nandy007', cipStr = '7b294769c1e417c86e8d85b4ec159da6';
            lib.md5(str).should.be.equal(cipStr);
        });
    });

});