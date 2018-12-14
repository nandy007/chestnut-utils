const fetch = require("../lib/fetch");

const jqlite = require("../lib/jqlite");

describe('config', function () {

    this.timeout(60 * 1000);

    // 测试get请求
    describe('get', function () {
        
        it('get no session should success', function (done) {
            fetch('https://www.baidu1.com/', {}).then(function (rsp) {
                if(rsp.error){
                    done(rsp.error);
                    return;
                }
                const body = rsp.body;
                const $ = jqlite(body);
                console.log('日志信息：' + $('title').text());
                done();
            }, function (err) {
                done(err);
            });
        });
    });
});

