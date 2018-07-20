// 引入mssql类
const mssql = require('mssql');

const util = {
    formateParam(value){
        if(typeof value==='number'){
            return {
                type: mssql.Numeric,
                value
            };
        }else if(typeof value==='object' && value.value){
            if(!value.type) value.type = mssql.VarChar;
            return value;
        }else{
            return {
                type: mssql.VarChar,
                value
            };
        }
    },
    createQuery(sql, values, request){
        if(values && values.length>0){
            const arr = [];
            values.forEach((param, index) => {
                const { type, value, name = PRE_PARAM + index } = util.formateParam(param);
                arr.push(name);
                request.input(name, type, value);
            });
            sql = sql.replace(/\?/g, function(s){
                const name = arr.shift();
                return `@${name}`;
            });
        }
        return sql;
    },
    query(request, sql, values){
        sql = util.createQuery(sql, values, request);
        return new Promise((resolve, reject) => {
            request.query(sql, function(err, result){
                if(err) return resolve({error: err});
                resolve(result);
            });
        });
        
    },
    begin(transaction){
        return new Promise((resolve, reject) => {
            transaction.begin(err => {
                if(err){
                    resolve({error: err});
                }else{
                    resolve({});
                }
            });
        });
    },
    pool(config){
        return new Promise((resolve, reject) => {
            const connection = new mssql.ConnectionPool(config, function (err) {
                if(err){
                    resolve({error:err});
                }else{
                    resolve(connection);
                }
            });
        });
    },
    commit(transaction){
        return new Promise((resolve, reject) => {
            transaction.commit(err => {
                if(err){
                    resolve({error: err});
                }else{
                    resolve({});
                }
            });
        });
    },
    rollback(transaction){
        return new Promise((resolve, reject) => {
            transaction.transaction(err => {
                if(err){
                    resolve({error: err});
                }else{
                    resolve({});
                }
            });
        });
    },
    transaction(p){
        return new Promise((resolve, reject) => {
            p.then(function(pool){
                if(pool.error){
                    resolve(pool);
                }else{
                    var transaction = new mssql.Transaction(pool);
                    resolve(transaction);
                }
            })
        });
    }
};

const PRE_PARAM = 'preparam';

class MssqlDB {
    // 配置并创建连接池
    constructor(config) {
        this.config = config;
        this.create();
    }
    // 创建连接池
    create() {
        if (!this.pool) {
            const pool = this.pool =  util.pool(this.config);
        }
    }
    // 此方法必须实现，且必须返回一个Promise对象
    query(sql, values) {

        return new Promise((resolve, reject) => {
            this.pool.then(function(pool){
                if(pool.error){
                    reject(err);
                    return;
                }
                const request = pool.request();
                request.multiple = true;

                sql = util.createQuery(sql, values, request);

                request.query(sql, function(err, result){
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                });

            }).catch(function(err){
                reject(err)
            })
        });
    }

    execute(sql, values){
        return new Promise((resolve, reject) => {
            this.pool.then(function(pool){
                const request = pool.request();

                sql = util.createQuery(sql, values, request);

                request.execute(sql, function(err, result){
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                });

            }).catch(function(err){
                reject(err)
            })
        });
    }

    async transaction(queue){

        const transaction = await util.transaction(this.pool);
    

        const begin = await util.begin(transaction);

        if(begin.error) return begin;

        const request = new mssql.Request(transaction);

        let flag = true, result = [];
        for(let i=0, len=queue.length;i<len;i++){
            const item = queue[i];
            let rs;
            if(typeof item === 'function'){
                rs = await item(request);
            }else{
                rs = await util.query(request, item.sql, item.params);
            }
     
            if(!rs||rs.error){
                result = rs;
                await util.rollback(transaction);
                flag = false;
                break;
            }
            result.push(rs);
        }
    
        if(flag){
            await util.commit(transaction);
        }
    
        return result;
        
    }
}


module.exports = MssqlDB;