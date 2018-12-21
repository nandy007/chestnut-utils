const Request = require('request');

const URL = require('url');

const ToughCookie = require('tough-cookie');

const codec = require('./codec');


class Fetch{
    constructor(options){
        this.options = options;
        this.init();
    }

    static get util(){
        const _util = {
            getHost: function(uri){
                const url = URL.parse(uri);
                const str = url.protocol + '://' + url.host;
                return str;
            },
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
                const host = this.getHost(uri);
                context.requestId = codec.md5(context.sid+':'+host);
                return context;
            },
            getId: function(opts){
                const context = this.getContext(opts);
                const id = context.requestId;
                if(!id) return '';
                const cookieName = 'X-CHESTNUT-HTTP';// 固定头信息前缀
                return cookieName + '-' + id.toUpperCase();
            },
            hookCookie: function(opts, jar){
                const cookies = opts.cookies;
                if(!cookies) return jar;
                if(cookies instanceof Array){
                    for(var i=0, len=cookies.length;i<len;i++){
                        const cookie = this.createCookie(cookies[i]);   
                        jar.setCookie(cookie, opts.uri);
                    }
                }else{
                    for(var k in cookies){
                        const cookie = this.createCookie(k+'='+cookies[k]);   
                        jar.setCookie(cookie, opts.uri);
                    }
                }
                
                return jar;
            },
            createCookie: function(cookie){
                return typeof cookie==='string'?cookie:new ToughCookie.Cookie(cookie).toString(); 
            },
            getJar: function(opts, id){
                return this.hookCookie(opts, this._getJar(opts, id));
            },
            _getJar: function(opts, id){
                if(!id || !opts.ctx) return opts, Request.jar();

                const ctx = opts.ctx, jarCache = ctx.__jarCache = ctx.__jarCache || {};

                if(jarCache[id]) return jarCache[id];

                const jar = ctx.__jarCache[id] = Request.jar();

                const jarHash = this.getStore(ctx, id);

                if(jarHash){
                    const uri = opts.uri;
                    const jarCookiesStr = codec.aesDecipher(jarHash, 'fetch');
                    const jarCookiesArr = JSON.parse(jarCookiesStr);
                    for( var i=0; i<jarCookiesArr.length; i++ ){
                        const cookie = this.createCookie(jarCookiesArr[i]);            
                        jar.setCookie(cookie, uri);
                    }
                }

                return jar;
            },
            getStore: function(ctx, id){
                switch(fetch.storeMode){
                    case 'session':
                        return ctx.session[id];
                    default:
                        return ctx.cookies.get(id);
                }
            },
            setStore: function(ctx, id, val){
                switch(fetch.storeMode){
                    case 'session':
                        ctx.session[id] = val;
                        return;
                    default:
                        ctx.cookies.set(id, val, {overwrite: true});
                        return;
                }
            },
            setCtx: function(opts, id, cookie){
                const ctx = opts.ctx, uri = opts.uri;

                if(!ctx) return;

                const cookiesArr = cookie.getCookies(uri) || [];

                if(cookiesArr.length===0) return;

                const cookieStr = JSON.stringify(cookiesArr);

                const cookieHash = codec.aesCipher(cookieStr, 'fetch');

                const curHash = this.getStore(ctx, id);
                
                if(cookieHash===curHash) return;

                this.setStore(ctx, id, cookieHash);
            }
        };
        return _util;
    }

    init(){
        this.id = Fetch.util.getId(this.options);
        this.jar = Fetch.util.getJar(this.options, this.id);
    }

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
        opts.jar = this.jar;
        return Request(opts, options.cb || function (err, rsp, body) {
            rsp = rsp || {};
            if (err && !rsp.error) {
                rsp.error = err;
            }else if(ctx){
                const cookieName = _this.id,
                    cookie = opts.jar;

                Fetch.util.setCtx(opts, cookieName, cookie);
            }
            options.resolve&&options.resolve(rsp);
        });
    }
}

// fetch函数入口，调用Client类发送请求
let fetch = function (url, opts, isNative) {
    opts = opts || {};
    opts.uri = url;
    return new Fetch(opts).send(isNative);
};

// 将Client类绑定到fetch对象中
fetch.Fetch = Fetch;

fetch.storeMode = 'cookie'; // cookie || session


module.exports = fetch;