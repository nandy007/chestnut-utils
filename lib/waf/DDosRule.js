const WafRule = require('./WafRule');

/**
 * 一阶段需求：
 * 1、能够设置访问设备的IP黑白名单允许和阻止访问，并将违法的IP自动添加到黑名单
 * 2、支持限制访问数量和队列长度，当超过访问数量则加入队列，如果队列已满直接返回错误码，错误码可配置
 */

class DDosRule extends WafRule{

    static DEFAULT_QUEUE_SIZE = 0; // 队列长度，可用户自定义，默认0：不排队，到达限制直接返回错误码
    static DEFAULT_REQUEST_LIMIT = 100; // 最大同时访问数量，可用户自定义

    constructor(options){
        super();
        this.options = options || {};
    }

}