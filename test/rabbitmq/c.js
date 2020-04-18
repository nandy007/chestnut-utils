
const {ProducerConsumerModel:PCM, DirectModel, TopicModel} = require('../../lib/PCM');

// const pcm = new PCM({
//     url : 'amqp://rabbitadmin:123456@172.16.30.49:5672',
//     // url : 'amqp://localhost:5672',
//     routingKey: '/mmi/ddos/1'
// });

// pcm.router(function(msg){
//     console.log(" [x] %s:'%s'",
//                   msg.fields.routingKey,
//                   msg.content.toString());
// });

// const dm = new DirectModel({
//     url : 'amqp://rabbitadmin:123456@172.16.30.49:5672',
//     routingKey: '/mmi/ddos/2'
// });

// dm.receive((msg)=>{
//     console.log(" [x] %s:'%s'",
//                   msg.fields.routingKey,
//                   msg.content.toString());
// });


const tm = new TopicModel({
    url : 'amqp://rabbitadmin:123456@172.16.30.49:5672',
    exchangeName: 'mmi',
    routingKey: '/mmi/log/request'
});

tm.receive((msg)=>{
    console.log(" [x] %s:'%s'",
                  msg.fields.routingKey,
                  msg.content.toString());
});