
const PCM = require('../../lib/PCM');

const pcm = new PCM({
    url : 'amqp://localhost:5672',
    routingKey: '/mmi/ddos/1'
});

pcm.router(function(msg){
    console.log(" [x] %s:'%s'",
                  msg.fields.routingKey,
                  msg.content.toString());
});