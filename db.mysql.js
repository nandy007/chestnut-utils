// 引入mysql类
const mysql = require('mysql');

class MysqlDB {
    // 配置并创建连接池
    constructor(config) {
        this.config = config;
        this.create();
    };
    // 创建连接池
    create() {
        if (!this.pool) {
            this.pool = mysql.createPool(this.config);
        }
    };
    // 此方法必须实现，且必须返回一个Promise对象
    query(sql, values, success, error) {
        const pool = this.pool;
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                    error && error(err);
                } else {
                    connection.query(sql, values, (err, rows) => {
                        if (err) {
                            reject(err);
                            error && error(err);
                        } else {
                            resolve(rows);
                            success && success(rows);
                        }
                        connection.release();
                    });
                }
            });
        });
    };


}


module.exports = MysqlDB;