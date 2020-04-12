const amqp = require('amqplib');

class ProducerConsumerModel{
    constructor(options){
        this.initOptions(options);
    }

    initOptions(options){
        this.options = Object.assign({
            exchangeName: 'chestnutEx', // 交换机名称
            queueName: 'chestnutQueue', // 队列名称
            routingKey: 'chestnutKey', // 路由地址
            expiration: null // 消息有效期
        }, options || {});
    }

    // 创建链接对象
    async getConnection(){
        if(this.conn) return this.conn;
        const connection = await amqp.connect(this.options.url);
        return this.conn = connection;
    }
    // 销毁链接对象
    async closeConnect(){
        this.conn && await this.conn.close();
        this.conn = null;
    }


    async getChannel(){
        // if(this.channel) return this.channel;
        const conn = await this.getConnection();
        const channel = await conn.createChannel();
        // return this.channel = channel;
        return channel;
    }

    async closeChannel(channel){
        // this.channel && this.channel.close();
        // this.channel = null;
        channel && await channel.close();
    }

    // direct 消费者
    async router(cb, options){
        // 获取通道
        const channel = await this.getChannel();
        // 声明参数
        const {exchangeName, routingKey} = Object.assign({}, this.options, options || {});
        // 监听交换机
        await channel.assertExchange(exchangeName, 'direct', { durable: true });
        // 监听队列，自动生成队列名
        const queueResult = await channel.assertQueue('', {exclusive: true});

        // console.log(routingKey);
        const queueName = queueResult.queue;

        await channel.bindQueue(queueName, exchangeName, routingKey);

        await channel.consume(queueName, (...args)=>{
            cb && cb(...args);
        }, {noAck: false});
        return {
            channel
        };
    }

    async routerOnce(cb, options){
        const {channel} = await this.router((...args)=>{
            cb && cb(...args);
            // 只使用一次就关闭
            this.closeChannel(channel);
        }, options);
    }

    // direct 生产者
    async go(msg, options){
        // 获取通道
        const channel = await this.getChannel();
        // 声明参数
        const {exchangeName, routingKey, expiration} = Object.assign({}, this.options, options || {});
        // 监听交换机
        await channel.assertExchange(exchangeName, 'direct', { durable: true });
        const publicOptions = {};
        if(expiration) publicOptions.expiration = expiration;
        // 发布消息
        await channel.publish(exchangeName, routingKey, Buffer.from(msg.toString()), publicOptions);
        // 关闭渠道
        await this.closeChannel(channel);
    }

}


module.exports = ProducerConsumerModel;