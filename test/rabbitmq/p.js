const PCM = require('../../lib/PCM');

const pcm = new PCM({
    url : 'amqp://localhost:5672',
    routingKey: '/mmi/ddos/3'
});

(async function(){
    await pcm.router(function(msg){
        console.log(" [x] %s:'%s'",
                      msg.fields.routingKey,
                      msg.content.toString());
    });


    await pcm.go('hello1', {
        routingKey: '/mmi/ddos/1'
    });
    await pcm.go('hello2', {
        routingKey: '/mmi/ddos/2'
    });
    
    await pcm.go('hello3', {
        routingKey: '/mmi/ddos/3'
    });
    
    await pcm.go('hello4', {
        routingKey: '/mmi/ddos/1'
    });
    await pcm.go('hello5', {
        routingKey: '/mmi/ddos/1'
    });
    await pcm.go('hello6', {
        routingKey: '/mmi/ddos/2'
    });
    await pcm.go('hello7', {
        routingKey: '/mmi/ddos/2'
    });
})();

