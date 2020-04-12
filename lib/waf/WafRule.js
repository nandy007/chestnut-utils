/**
 * WAF验证父类，每个子类必须实现type属性值赋值，rules规则配置（支持正则和函数，函数返回true为发现攻击，false为未发现攻击）
 * check方法会去遍历rules进行校验，返回true为发现攻击，false为未发现攻击
 *
 */

class WafRule{
    
    constructor(){
        this.rules = [];
        this.initRule && this.initRule();
    }

    getType(){
        return this.type || 'waf';
    }

    check(content){
        const rules = this.rules, type = this.getType();
        for(let i=0, len=rules.length;i<len;i++){
            const rule = rules[i];
            let rs = false;
            if(typeof rule==='function'){
                rs = rule(content);
            }else if(rule instanceof RegExp){
                if(rule.test(content)){
                    console.log(`检测到[ ${type} ]攻击, 规则序列：`, `(${i})`, `，规则内容：${rule}`);
                    rs = true;
                }
            }
            if(rs) return rs;
        }
        return false;
    }

    addRule(rule){
        this.rules.push(rule);
    }
}


module.exports = WafRule;