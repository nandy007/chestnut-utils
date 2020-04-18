const {ProducerConsumerModel:PCM, DirectModel, TopicModel} = require('../../lib/PCM');

// const pcm = new PCM({
//     url : 'amqp://rabbitadmin:123456@172.16.30.49:5672',
//     // url : 'amqp://localhost:5672',
//     routingKey: '/mmi/ddos/3'
// });

// (async function(){
//     await pcm.router(function(msg){
//         console.log(" [x] %s:'%s'",
//                       msg.fields.routingKey,
//                       msg.content.toString());
//     });


//     await pcm.go('hello1', {
//         routingKey: '/mmi/ddos/1'
//     });
//     await pcm.go('hello2', {
//         routingKey: '/mmi/ddos/2'
//     });
    
//     await pcm.go('hello3', {
//         routingKey: '/mmi/ddos/3'
//     });
    
//     await pcm.go('hello4', {
//         routingKey: '/mmi/ddos/1'
//     });
//     await pcm.go('hello5', {
//         routingKey: '/mmi/ddos/1'
//     });
//     await pcm.go('hello6', {
//         routingKey: '/mmi/ddos/2'
//     });
//     await pcm.go('hello7', {
//         routingKey: '/mmi/ddos/2'
//     });
// })();


// const dm = new DirectModel({
//     url : 'amqp://rabbitadmin:123456@172.16.30.49:5672',
//     // url : 'amqp://localhost:5672',
//     routingKey: '/mmi/ddos/3'
// });

// (async function(){
//     await dm.receive(function(msg){
//         console.log(" [x] %s:'%s'",
//                       msg.fields.routingKey,
//                       msg.content.toString());
//     });


//     await dm.emit('hello1', {
//         routingKey: '/mmi/ddos/1'
//     });
//     await dm.emit('hello2', {
//         routingKey: '/mmi/ddos/2'
//     });
    
//     await dm.emit('hello3', {
//         routingKey: '/mmi/ddos/3'
//     });
    
//     await dm.emit('hello4', {
//         routingKey: '/mmi/ddos/1'
//     });
//     await dm.emit('hello5', {
//         routingKey: '/mmi/ddos/1'
//     });
//     await dm.emit('hello6', {
//         routingKey: '/mmi/ddos/2'
//     });
//     await dm.emit('hello7', {
//         routingKey: '/mmi/ddos/2'
//     });
// })();


const tm = new TopicModel({
    url : 'amqp://rabbitadmin:123456@172.16.30.49:5672',
    exchangeName: 'mmi',
    routingKey: '/mmi/log/request'
});

tm.emit('request');