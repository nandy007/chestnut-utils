const amqp = require('amqplib');

class Model{
    constructor(options){
        options = options || {};
        this.conn = new MQConnection(options.url);
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

    async getChannel(){
        // 1. 创建链接对象
        const connection = await this.conn.connection();
        // 2. 获取通道
        const channel = await connection.createChannel();
        return channel;
    }

    async destroy(){
        await this.conn.disconnection();
    }

    formatMsg(msg){
        if(!typeof msg==='string'){
            try{
                msg = JSON.stringify(msg);
            }catch(e){
                console.error(e);
            }
        }
        return Buffer.from(msg);
    }

    assignOptions(options){
        return Object.assign({}, this.options, options || {});
    }

    async emit(){

    }

    async receive(){

    }

    async receiveOnce(cb){
        const {channel} =  await this.receive((msg)=>{
            cb && cb(msg);
            channel.close();
        }) || {};
        return channel;
    }
}

class TopicModel extends Model{

    async emit(msg, options){
        // 2. 获取通道
        const channel = await this.getChannel();

        // 3. 声明参数
        const {exchangeName, routingKey} = this.assignOptions(options);

        // 4. 声明交换机
        await channel.assertExchange(exchangeName, 'topic', { durable: true });
        
        await channel.publish(exchangeName, routingKey, this.formatMsg(msg));

        await channel.close();
    }

    async receive(cb, options){

        // 2. 获取通道
        const channel = await this.getChannel();

        // 3. 声明参数
        const {exchangeName, queueName, routingKey} = this.assignOptions(options);

        // 4. 声明交换机、对列进行绑定
        await channel.assertExchange(exchangeName, 'topic', { durable: true });
        await channel.assertQueue(queueName);
        await channel.bindQueue(queueName, exchangeName, routingKey);
        
        // 5. 限流参数设置
        await channel.prefetch(1, false);

        // 6. 限流，noAck参数必须设置为false
        await channel.consume(queueName, msg => {
            cb && cb(msg);
            channel.ack(msg);
        }, { noAck: false });

        return {
            channel
        };
    }

}


class FanoutModel extends Model{

    async emit(){

    }

    async receive(){
        
    }
}

class DirectModel extends Model{

    async emit(msg, options){
        // 获取通道
        const channel = await this.getChannel();
        // 声明参数
        const {exchangeName, routingKey, expiration} = this.assignOptions(options);
        // 监听交换机
        await channel.assertExchange(exchangeName, 'direct', { durable: true });
        const publicOptions = {};
        if(expiration) publicOptions.expiration = expiration;
        // 发布消息
        await channel.publish(exchangeName, routingKey, this.formatMsg(msg), publicOptions);
        // 关闭渠道
        await channel.close();
    }

    async receive(cb, options){
        // 获取通道
        const channel = await this.getChannel();
        // 声明参数
        const {exchangeName, routingKey} = this.assignOptions(options);
        // 监听交换机
        await channel.assertExchange(exchangeName, 'direct', { durable: true });
        // 监听队列，自动生成队列名
        const queueResult = await channel.assertQueue('', {exclusive: true});

        // console.log(routingKey);
        const queueName = queueResult.queue;

        await channel.bindQueue(queueName, exchangeName, routingKey);

        await channel.consume(queueName, (...args)=>{
            cb && cb(...args);
        }, {noAck: true});
        return {
            channel
        };
    }

}

class MQConnection{

    static get caches(){
        if(!MQConnection._caches) MQConnection._caches = {};
        return MQConnection._caches;
    }

    constructor(url){
        this.url = url;
    }

    async connection(){
        let conn = MQConnection.caches[this.url];
        if(!conn){
            conn = MQConnection.caches[this.url] = await amqp.connect(this.url);
        }
        return conn;
    }

    async disconnection(){
        const conn = MQConnection.caches[this.url];
        conn && await conn.close();
        delete MQConnection.caches[this.url];
    }
}

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

    assignOptions(options){
        return Object.assign({}, this.options, options || {});
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
        const {exchangeName, routingKey} = this.assignOptions(options);
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
        const {exchangeName, routingKey, expiration} = this.assignOptions(options);
        // 监听交换机
        await channel.assertExchange(exchangeName, 'direct', { durable: true });
        const publicOptions = {};
        if(expiration) publicOptions.expiration = expiration;
        // 发布消息
        await channel.publish(exchangeName, routingKey, Buffer.from(msg.toString()), publicOptions);
        // 关闭渠道
        await this.closeChannel(channel);
    }

    createTopic(){

    }

}


module.exports = {
    ProducerConsumerModel,
    TopicModel,
    FanoutModel,
    DirectModel
};