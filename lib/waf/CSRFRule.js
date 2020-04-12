const URL = require('url');
const WafRule = require('./WafRule');

/**
 * 一阶段需求：
 * 实现根据referer和origin头信息限制访问，只有在白名单里的host与referer或origin的host匹配可以通过
 * 默认被访问网关的host为白名单，并且允许用户自行添加白名单
 */


class CSRFRule extends WafRule{

    constructor(options){
        super();
        this.options = options || {};
        this.refererFilters = this.options.refererFilters instanceof Array ? 
            this.options.refererFilters : (this.options.refererFilters ? [this.options.refererFilters] : []);
        this.originFilters = this.options.originFilters instanceof Array ? 
            this.options.originFilters : (this.options.originFilters ? [this.options.originFilters] : []);
        
    }

    get type(){
        return 'csrf';
    }

    formateURL(url){
        const urlObj = URL.parse(url||'');
        return urlObj;
    }

    refererRule(){
        const self = this, arr = [], reqUrlObj = this.formateURL(req.url);
        if(reqUrlObj.host) arr.push(reqUrlObj.host);
        for(let i=0,len=this.refererFilters.length;i<len;i++){
            const referer = this.refererFilters[i], urlObj = this.formateURL(referer);
            if(urlObj.host) arr.push(urlObj.host);
        }

        return function refererRule(req){
            const referer = req.headers['referer'], refereObj = self.formateURL(referer);
            if(!refereObj.host) return;
            return arr.indexOf(refereObj.host)===-1;
        }
    }

    originRule(){
        const self = this, arr = [], reqUrlObj = this.formateURL(req.url);
        if(reqUrlObj.host) arr.push(reqUrlObj.host);
        for(let i=0,len=this.originFilters.length;i<len;i++){
            const origin = this.originFilters[i], urlObj = this.formateURL(origin);
            if(urlObj.host) arr.push(urlObj.host);
        }

        return function originRule(req){
            const origin = req.headers['origin'], originObj = self.formateURL(origin);
            if(!originObj.host) return;
            return arr.indexOf(originObj.host)===-1;
        }
    }

    initRule(){
        this.rules.push(
            this.originRule(),
            this.refererRule()
        );
    }
}


module.exports = CSRFRule;