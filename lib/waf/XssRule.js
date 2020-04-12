const WafRule = require('./WafRule');

/**
 * 一阶段需求：
 * 能够阻止js代码注入和脚本注入
 * 目前已内置部分校验正则，可以允许用户自行添加正则
 */

class XssRule extends WafRule{

    get type(){
        return 'xss';
    }

    initRule(){
        
        this.rules.push(
            /xwork.MethodAccessor/i,
            /(?:define|eval|file_get_contents|include|require|require_once|shell_exec|phpinfo|system|passthru|preg_\w+|execute|echo|print|print_r|var_dump|(fp)open|alert|showmodaldialog)\(/i,
            /\<(iframe|script|body|img|layer|div|meta|style|base|object|input)/i,
            /(onmouseover|onmousemove|onerror|onload)\=/i,
            /javascript:/i,
            /\.\.\/\.\.\//i,
            /\|\|.*(?:ls|pwd|whoami|ll|ifconfog|ipconfig|&&|chmod|cd|mkdir|rmdir|cp|mv)/i,
            /(?:ls|pwd|whoami|ll|ifconfog|ipconfig|&&|chmod|cd|mkdir|rmdir|cp|mv).*\|\|/i,
            /(gopher|doc|php|glob|file|phar|zlib|ftp|ldap|dict|ogg|data)\:\//i,
        );
    }

}

module.exports = SqlInjectionRule;