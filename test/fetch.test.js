const fetch = require("../lib/fetch");

const jqlite = require("../lib/jqlite");

describe('config', function () {

    this.timeout(60 * 1000);

    // 测试get请求
    describe('get', function () {
        
        it('get no session should success', function (done) {
            fetch('https://www.baidu.com/', {}).then(function (rsp) {
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

    // 测试自定义post
    describe('custom', function () {
        
        it('custom post should success', function (done) {

            let postData = [
                '<?xml version="1.0" encoding="utf-8"?>',
                '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
                '  <soap12:Body>',
                '    <getWeatherbyCityName xmlns="http://WebXml.com.cn/">',
                '      <theCityName>南京1</theCityName>',
                '    </getWeatherbyCityName>',
                '  </soap12:Body>',
                '</soap12:Envelope>'
            ];

            fetch('http://ws.webxml.com.cn/WebServices/WeatherWebService.asmx', {
                method: 'post',
                headers : {
                    'Content-Type' : 'application/soap+xml; charset=utf-8',
                    'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1) ; .NET CLR 2.0.50727; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; InfoPath.2)'
                },
                body : postData.join('\n')
            }).then(function (rsp) {
                if(rsp.error){
                    done(rsp.error);
                    return;
                }
                const body = rsp.body;
                const $ = jqlite(body);
                console.log($('getWeatherbyCityNameResult').html());
                if($('getWeatherbyCityNameResult').length===1){
                    done();
                }else{
                    done(new Error('没有正确获取天气信息'));
                }
                
            }, function (err) {
                done(err);
            });
        });
    });


    // 测试普通post请求并带会话
    describe('session', function () {

        // 模拟上下文关系
        let ctx = {
            session: {
                custom: {}
            },
            _cookieCache: {

            },
            cookies: {
                get: function (name) {
                    ctx._cookieCache[name];
                },
                set: function (name, val) {
                    ctx._cookieCache[name] = val;
                }
            }
        }

        it('post and session should success', function (done) {
            // 登录EDN系统
            fetch('https://auth.exmobi.cn/login?output=json', {
                ctx: ctx,
                requestId: 'edn',
                method: 'post',
                form: { username: 'huangnan', password: '111111' } // 提交键值对参数
            }).then(function (rsp) {
                if(rsp.error){
                    done(rsp.error);
                    return;
                }
                const body = rsp.body;
                //console.log('日志信息：' + body);
                done();
            }, function (err) {
                done(err);
            });
        });

        // 判断EDN的控制台是否有用户信息
        it('get and session should success', function (done) {
            fetch('https://www.exmobi.cn/console/main.html', {
                ctx: ctx,
                requestId: 'edn',
            }).then(function (rsp) {
                if(rsp.error){
                    done(rsp.error);
                    return;
                }
                const $ = jqlite(rsp.body);
                const username = $('#consumer span').first().text();
                if(username==='huangnan'){
                    done();
                }else{
                    done(new Error('会话没有保持'));
                }
            }, function (err) {
                done(err);
            });
        });
    });


    describe('post', function () {

        require('./app');

        const fs = require('fs');
        it('post file should success', function (done) {
            fetch('http://127.0.0.1:3000', {
                formData: {
                    file: fs.createReadStream(__dirname + '/mocha.opts'),
                }
            }).then(function (rsp) {
                if(rsp.error){
                    done(rsp.error);
                    return;
                }
                const body = rsp.body;
                if (body.indexOf('Content-Disposition: form-data; name="file";') > -1) {
                    done();
                } else {
                    done(new Error('上传文件失败'));
                }
            }, function (err) {
                done(err);
            });
        });
    });

});

