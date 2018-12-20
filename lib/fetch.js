const Request = require('request');

const URL = require('url');

const codec = require('./codec');

let sessionCache = {};// 会话缓存，将会话id和requestId绑定
let cache = {};// 请求缓存，将requestId与Request类实例化对象绑定

class Client {
    // opts需要满足Request类的options要求，同时需要具有ctx和requestId属性
    // *ctx* 为koa的ctx，用户标识当前请求的会话，相同的会话发起的fetch请求的cookie是维持的
    //*requestId* 默认为请求的url的host部分，可以自己设置（某些url使用会话共享，不同host的会话一致，可以给它们设置相同的requestId解决）
    constructor(opts) {
        if (typeof opts.strictSSL === 'undefined') opts.strictSSL = false;
        this.options = opts;
        this.init();
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
                } else if (id === false) { // 设置为false则不使用requestId，即为无状态请求
                    context.requestId = '';
                    return context;
                }
                // 否则根据host来创建requestId
                const uri = opts.uri;
                const url = URL.parse(uri);
                const str = url.protocol + '://' + url.host;
                context.requestId = context.sid + ':' + codec.md5(str);
                return context;
            },
            // 根据请求id获取cookie名称
            getCookieName: function (id) {
                const cookieName = 'X-CHESTNUT-HTTP';// 固定头信息前缀
                return cookieName + '-' + id.toUpperCase();
            },
            // 获取新的cookie
            getJar : function(){
                // return JSON.parse(JSON.stringify(Request.jar()));
                return Request.jar();
            },
            // 从cookie头信息中获取请求缓存配置
            getCache: function (opts, cookieName){ 
                return this.getCookie(opts, cookieName);
            },
            getCookie: function(opts, cookieName){
                const ctx = opts.ctx, uri = opts.uri;

                if (!ctx) return this.getJar();// 缓存是存在上下文的cookie中，所以如果没有上下文关系则直接返回新的cookie

                if (!cookieName) {// 缓存是根据请求id缓存和区分的，没有id则不会缓存直接返回新的cookie
                    return this.getJar();
                }

                let cookie = (ctx.__cookieCache||{})[cookieName];// 获取cookie信息

                if(cookie) return cookie;

                cookie =  this.getJar();

                const cookieHash = ctx.cookies.get(cookieName);

                if (cookieHash) {// 对cookie信息进行解码
                    const cookies = codec.aesDecipher(cookieHash, 'fetch').split('; ');
                    for( var i=0; i<cookies.length; i++ ){
                        cookie.setCookie(cookies[i], uri);
                    }
                }

                return cookie;
            },
            setCookie: function(opts, cookieName, cookie){
                const ctx = opts.ctx, uri = opts.uri;

                if(!ctx) return;

                if(!ctx.__cookieCache) ctx.__cookieCache = {};

                ctx.__cookieCache[cookieName] = cookie;

                const cookieStr = cookie.getCookieString(uri);

                if(!cookieStr) return;

                const cookieHash = codec.aesCipher(cookieStr, 'fetch');

                const curHash = ctx.cookies.get(cookieName);
                
                if(cookieHash===curHash) return;
                
                ctx.cookies.set(cookieName, cookieHash);
            },
            getRequest: function (jar) {
                return Request.defaults({ jar: jar });
            },
            // 获取Request类的实例化对象
            /*getRequest: function (opts) {
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
            },*/
            // 删除请求缓存， 下次请求生效
            delRequest: function (opts) {
                if(!opts.ctx){
                    return;
                }
                const context = this.getContext(opts);
                const id = context.requestId;
                const cookieName = this.getCookieName(id);
                // 从cookie中清除缓存，所以下次请求才能生效
                opts.ctx.cookies.set(cookieName, null);
            }
        };
    };

    init(){
        const opts = this.options;
        this.cookie = Client.cache.getCache(opts, this.getCookieName());
        this.request = Client.cache.getRequest(this.cookie);
    }

    getCookieName(){
        if(typeof this.cookieName==='string') return this.cookieName;
        const opts = this.options, ctx = opts.ctx, uri = opts.uri;

        if (!ctx) return this.cookieName = '';// 缓存是存在上下文的cookie中，所以如果没有上下文关系则直接返回新的cookie

        const context = Client.cache.getContext(opts);// 抽取上下文信息
        const id = context.requestId;//. 获取请求id
        if (!id) {// 缓存是根据请求id缓存和区分的，没有id则不会缓存直接返回新的cookie
            return this.cookieName = '';
        }
        return this.cookieName = Client.cache.getCookieName(id);// 获取cookie名称
    }

    // 发送网络请求，返回一个promise对象
    // 可以使用await同步获取，也可以在opts设置success和error回调函数
    send(isNative) {
        // 如果isNative为true，即返回request原生对象，可直接用于pipe
        if(isNative) return this.doRequest({
            cb: typeof isNative==='function' ? isNative: null
        });

        return new Promise((resolve, reject) => {
            this.doRequest({resolve, reject});
        });
    }

    doRequest(options){
        const opts = this.options, ctx = opts.ctx, _this = this;
        return this.request(opts, options.cb || function (err, rsp, body) {
            rsp = rsp || {};
            if (err && !rsp.error) {
                rsp.error = err;
            }else if(ctx){
                const cookieName = _this.getCookieName(),
                    cookie = _this.cookie;

                Client.cache.setCookie(opts, cookieName, cookie);
            }
            options.resolve&&options.resolve(rsp);
        });
    }

}

// fetch函数入口，调用Client类发送请求
let fetch = function (url, opts, isNative) {
    opts = opts || {};
    opts.uri = url;
    return new Client(opts).send(isNative);
};

// 将Client类绑定到fetch对象中
fetch.Client = Client;


module.exports = fetch;