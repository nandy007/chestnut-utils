const WafRule = require('./WafRule');

/**
 * 一阶段需求：
 * 能够阻止请求url、请求body体的SQL注入，body体需要考虑非文本类型
 * 目前已内置部分校验正则，可以允许用户自行添加正则
 */

class SqlInjectionRule extends WafRule{

    get type(){
        return 'sql injection';
    }

    initRule(){
        
        this.rules.push(
            /\b(and|or)(\+| )+.*(=|<|>)\d+/i,
            /select.+(from|limit)/i,
            /(?:(union(.*?)select))/i,
            /sleep\((\s*)(\d*)(\s*)\)/i,
            /group\s+by.+\(/i,
            /(?:from\W+information_schema\W)/i,
            /(?:(?:current_)user|database|schema|connection_id)\s*\(/i,
            /\s*or\s+.*=.*/i,
            /order\s+by\s+.*--$/i,
            /benchmark\((.*)\,(.*)\)/i,
            /base64_decode\(/i,
            /(?:(?:current_)user|database|version|schema|connection_id)\s*\(/i,
            /(?:etc\/\W*passwd)/i,
            /into(\s+)+(?:dump|out)file\s*/i,
            /\b(create|drop|backup)\b(\+| )+\bdatabase\b(\+| )+\w*/i,
            /\b(drop|truncate|create)\b(\+| )+\btable\b(\+| )+\w*/i,
            /\bdbo\.\w+/i,
            /\bdeclare\b(\+| )+.+/i,
            /\bdelete\b(\+| )+\bfrom\b(\+| )+.*/i,
            /\binsert\b(\+| )+(\binto\b){0,1}(\+| )+.*\bvalues\b.*/i,
        );
    }

}

module.exports = SqlInjectionRule;