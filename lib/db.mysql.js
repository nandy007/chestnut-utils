// 引入mysql类
const mysql = require('mysql');

const transactionRollback = function(conn){
    return new Promise(function(resolve, reject){
        conn.rollback(function() {
            resolve(true);
            conn.release();
        });
    });
};

const getTransactionConn = function(pool){
    return new Promise(function(resolve, reject){
        pool.getConnection(function(err, conn){
            if(err){
                resolve({error: err});
            }else{
                conn.beginTransaction(function(err){
                    if(err){
                        resolve({error: err});
                    }else{
                        resolve(conn);
                    }
                    
                });
            }
        });
    });
};

const transactionQuery = function(conn, sql, params){
    return new Promise(function(resolve, reject){
        conn.query(sql, params, function(err, ret){
            if(err){
                resolve({error: err});
            }else{
                resolve(ret);
            }
        });
    });
};

const transactionCommit = function(conn){
    return new Promise(function(resolve, reject){
        conn.commit(function() {
            resolve(true);
            conn.release();
        });
    });
    
};

class MysqlDB {
    // 配置并创建连接池
    constructor(config) {
        this.config = config;
        this.create();
    }

    // 创建连接池
    create() {
        if (!this.pool) {
            this.pool = mysql.createPool(this.config);
        }
    }
    // 此方法必须实现，且必须返回一个Promise对象
    query(sql, values) {
        const pool = this.pool;
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                } else {
                    connection.query(sql, values, (err, rows) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rows);
                        }
                        connection.release();
                    });
                }
            });
        });
    }

    async transaction (queue){
        let result = [];
        const pool = this.pool;
        const conn = await getTransactionConn(pool);
        if(!conn || conn.error) return conn;
        let flag = true;
        for(let i=0, len=queue.length;i<len;i++){
            const item = queue[i];
            let rs;
            if(typeof item === 'function'){
                rs = await item(conn);
            }else{
                rs = await transactionQuery(conn, item.sql, item.params);
            }
     
            if(!rs){
                result = rs;
                await transactionRollback(conn);
                flag = false;
                break;
            }
            result.push(rs);
        }
    
        if(flag){
            await transactionCommit(conn);
        }
    
        return result;
    }

}


module.exports = MysqlDB;