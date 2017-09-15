const fs = require('fs');

const jsonfile = require('../lib/jsonfile');

describe('module', function () {
    // 测试获取json
    describe('getJSON', function () {
        it('getJSON Fucntion should success', function (done) {
            const json = jsonfile.getJSON(require.resolve('./jsonfile.json'));
            if(json.a===1){
                done()
            }else{
                 done(new Error('没有正确获取json文件'))
            }
        });
    });

    // 测试保存json
    describe('getJSON', function () {
        it('saveJSON Fucntion should success', function (done) {
            const json = jsonfile.getJSON(require.resolve('./jsonfile.json'));
            const str = Math.random();
            json.b = str;
            jsonfile.saveJSON(require.resolve('./jsonfile.json'));
            if(JSON.parse(fs.readFileSync(require.resolve('./jsonfile.json'))).b = str){
                done()
            }else{
                 done(new Error('没有正确保存json文件'))
            }
        });
    });
})