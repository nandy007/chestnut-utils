
// 数据库缓存
let dbcache = {
    // 创建id
    makeId: function (config) {
        // 如果配置文件包含id则直接使用此id
        if (config.id) {
            return config.id;
        }
        // 没有id则将配置文件序列化后进行md5运算后的值作为id
        const cStr = JSON.stringify(config);
        const crypto = require('crypto');
        const md5sum = crypto.createHash('md5');
        md5sum.update(cStr);
        return md5sum.digest('hex');
    }
};

// 当数据库对象不存在的返回信息
const getNone = function(){
    return {
        error : true,
        msg : '数据库对象不存在'
    };
};

// 数据库操作类
class DB {
    /**
     * DB类构造函数
     * @param   {Object}      config         [数据库配置]
     */
    constructor(config) {
        this.config = config;
        // 创建数据库连接池
        this.create();
    };

    // 工具集函数
    get util(){
        return {
            // 创建键值对数据对象
            createKV: function (whereObj) {
                let params = [];
                let exps = [];
                for (let k in whereObj) {  
                    params.push(whereObj[k]);
                    exps.push(' ' + k + '= ? ');
                }
                return {
                    params: params,
                    exps: exps
                }
            },
            // 创建set数据对象
            createSet : function (setObj) {
                let keys = [];
                let vals = [];
                let params = [];
                for (let k in setObj) {
                    keys.push(k);
                    vals.push('?');
                    params.push(setObj[k]);
                }
                return {
                    params: params,
                    exps: '(' + keys.join(',') + ') values (' + vals.join(',') + ')'
                }
            }
        };
    };

    /**
     * create创建连接池函数
     */
    create (){
        const config = this.config;
        // 如果传的是id，直接从缓存取
        if(typeof config==='string'){
            this.db = dbcache[config];
            return;
        }
        // 从配置文件获取id
        const id = dbcache.makeId(config);
        // 根据id从缓存取
        if (dbcache[id]) {
            this.db = dbcache[id];
        }else{// 缓存不存在则创建连接池
            const dbType = config.type;
            const DB = require('./db.' + dbType);
            this.db = new DB(config);
            dbcache[id] = this.db;// 并将连接池进行缓存
        }
    }

    /**
     * sql执行函数
     * @param   {String}      sql         [可带?的sql语句]
     * @param   {Array}       values      [sql语句中?对应的数组参数]
     */
    query(sql, values){
        if(!this.db) return getNone();

        return this.db.query(sql, values).then(
            (rs) => {
                return rs;
            },
            (err) => {
                // 如果报错添加一个error标识
                err.error = {
                    sql : sql,
                    values : values
                };
                return err;
            }
        );// 必须返回一个Promise对象
    }

    execute(sql, values){
        return this.db.execute(sql, values).then(
            (rs) => {
                return rs;
            },
            (err) => {
                // 如果报错添加一个error标识
                err.error = {
                    sql : sql,
                    values : values
                };
                return err;
            }
        );
    }

    transaction(queue){
        return this.db.transaction(queue);
    }

    /**
     * 简化查找语句执行函数
     * @param   {String}      table         [查询表名]
     * @param   {Array}       keys          [查询的字段]
     * @param   {String}      clause        [查询条件]
     * @param   {Array}       values        [clause语句中?对应的数组参数]
     */
    find(table, keys, clause, values){
        values = values||[];
        const kvs = this.util.createKV(values.shift());
        let sql = [
            'SELECT',
            typeof keys==='string'?keys:keys.join(','),
            'FROM',
            table,
            clause.replace(/\?/, function(s){
            return kvs.exps.join(' AND ');
            })
        ].join(' ');
        values.unshift.apply(values, kvs.params);
        return this.query(sql, values);
    }

    /**
     * 简化插入语句执行函数
     * @param   {String}      table         [插入表名]
     * @param   {Obejct}      model         [插入的数据对象]
     */
    insert(table, model){
        const sets = this.util.createSet(model||{});
        let sql = [
            'INSERT',
            'INTO',
            table,
            sets.exps
        ].join(' ');
        return this.query(sql, sets.params);
    }

    /**
     * 简化插入语句执行函数
     * @param   {String}      table         [更新表名]
     * @param   {String}      clause        [更新条件]
     * @param   {Array}       values        [clause语句中?对应的数组参数]
     */
    update(table, clause, values){
        values = values||[];
        let params = [];
        const updateModel = values.shift()||{};
        const whereModal = values.shift()||{};
        const updates = this.util.createKV(updateModel);
        const wheres = this.util.createKV(whereModal);
        let index = 0;
        let sql = [
            'UPDATE',
            table,
            'SET',
            clause.replace(/\?/g, function(s){
                    const flag = index++;
                    if(0===flag){
                        params.push.apply(params, updates.params);
                        return updates.exps.join(',');
                    }else if(1===flag){
                        params.push.apply(params, wheres.params);
                        return wheres.exps.join(' AND ');
                    }
                    
                    return s;
                }),
            
        ].join(' ');
        params.push.apply(params, values);
        return this.query(sql, params);
    }

    /**
     * 简化删除语句执行函数
     * @param   {String}      table         [删除表名]
     * @param   {String}      clause        [删除条件]
     * @param   {Array}       values        [clause语句中?对应的数组参数]
     */
    delete(table, clause, values){
        values = values||[];
        const model = values.shift();
        const kvs = this.util.createKV(model);
        let sql = [
            'DELETE',
            'FROM',
            table,
            clause.replace(/\?/, function(s){
                values.unshift.apply(values, kvs.params);
                return kvs.exps.join('AND');
            })
        ].join(' ');
        return this.query(sql, values);
    }
}

module.exports = function(config){
    return new DB(config);
};