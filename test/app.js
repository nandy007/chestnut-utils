// 模拟服务器获取提交文件
const http = require('http');
http.createServer(function (req, res) {
    const contentType = req.headers['content-type'];
    if (contentType && contentType.indexOf('multipart/form-data') > -1) {
        let body = '';
        req.on('data', function (chunk) {
            body += chunk;
        });
        req.on('end', function () {
            res.write(body);
            res.end();
        });
    } else {
        res.write('hi');
        res.end();
    }

}).listen(3000);

console.log('发布测试服务http://127.0.0.1:3000');