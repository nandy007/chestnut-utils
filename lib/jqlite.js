const cheerio = require('cheerio');

// 直接返回cheerio load之后的对象
module.exports  = function(html){
    return cheerio.load(html);
};