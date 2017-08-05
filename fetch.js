const Request = require('request');

const URL = require('url');

const crypto = require('crypto');

const session = require('chestnut-session');

let sessionCache = {};// 会话缓存，将会话id和requestId绑定
let cache = {};// 请求缓存，将requestId与Request类实例化对象绑定

class Client {
    // opts需要满足Request类的options要求，同时需要具有ctx和requestId属性
    // *ctx* 为koa的ctx，用户标识当前请求的会话，相同的会话发起的fetch请求的cookie是维持的
    //*requestId* 默认为请求的url的host部分，可以自己设置（某些url使用会话共享，不同host的会话一致，可以给它们设置相同的requestId解决）
    constructor(opts) {
        if (typeof opts.strictSSL === 'undefined') opts.strictSSL = false;
        this.options = opts;
        this.request = Client.cache.getRequest(opts);
    };
    // 静态方法，缓存类操作
    static get cache() {
        return {
            // 获取上下文
            getContext: function (opts) {
                // 如果session中有sid则使用
                const context = {
                    sid: opts.ctx ? opts.ctx.session.sid || '' : ''
                };
                // 如果session中有requestId则使用
                let id = opts.requestId;
                if (id) {
                    context.requestId = id;
                    return context;
                } else if (requestId === false) { // 设置为false则不使用requestId，即为无状态请求
                    context.requestId = '';
                    return context;
                }
                // 否则根据host来创建requestId
                const uri = opts.uri;
                const url = URL.parse(uri);
                const str = url.protocol + '://' + url.host;
                var md5sum = crypto.createHash('md5');
                md5sum.update(str);
                context.requestId = context.sid + ':' + md5sum.digest('hex');
                return context;
            },
            /*getCache: function (opts) {
                let session = (opts.ctx || {}).session || {};
                if (!session.requestCache) session.requestCache = {};
                return session.requestCache;
            },
            getRequest: function(opts){
                const context = this.getContext(opts);     
                const id = context.requestId;
                if(!id){
                    return Request.defaults({ jar: Request.jar() });
                }
                let requestCache = this.getCache(opts);
                let jar = requestCache[id];
                if(!jar){
                    jar = Request.jar();
                    requestCache[id] = jar;
                }
                return Request.defaults({ jar:  jar});
            },*/
            // 获取Request类的实例化对象
            getRequest: function (opts) {
                const context = this.getContext(opts);
                const sid = context.sid;
                const id = context.requestId;
                if (!id) {
                    return Request;
                }
                // 通过requestId从缓存取
                if (cache[id]) {
                    return cache[id];
                }
                // 缓存中没有则创建新的请求对象
                const request = Request.defaults({ jar: Request.jar() });
                cache[id] = request;
                // 如果有会话要求则设置缓存
                if (sid) {
                    if (!sessionCache[sid]) sessionCache[sid] = [];
                    sessionCache[sid].push(id);
                }
                return request;
            },
            // 删除请求缓存
            delRequest: function (opts) {
                const context = this.getContext(opts);
                const id = context.requestId;
                const sid = context.sid;
                delete sessionCache[sid];
                delete cache[id];
            },
            // 清楚所有请求缓存
            clearRequest: function () {
                sessionCache = {};
                cache = {};
            }
        };
    };

    // 发送网络请求，返回一个promise对象
    // 可以使用await同步获取，也可以在opts设置success和error回调函数
    send() {
        var _this = this;
        return new Promise((resolve, reject) => {
            this.request(this.options, function (err, rsp, body) {
                if (err) {
                    if (!err.error) err.error = true;
                    reject(err);
                    _this.options.error && _this.options.error(err);
                } else {
                    resolve(rsp);
                    _this.options.success && _this.options.success(rsp);
                }
            });
        });
    }

}

// fetch函数入口，调用Client类发送请求
let fetch = function (url, opts) {
    opts = opts || {};
    opts.uri = url;
    return new Client(opts).send();
};

// 将Client类绑定到fetch对象中
fetch.Client = Client;


module.exports = fetch;

fetch.clear = function (sids) {
    for (let i = 0, leni = sids.length; i < leni; i++) {
        const sid = sids[i];
        const sessions = sessionCache[sid] || [];
        for (let j = 0, lenj = sessions.length; j < lenj; j++) {
            delete cache[sessions[j]];
        }
        delete sessionCache[sid];
    }
};