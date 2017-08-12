// 请勿修改
const pg = require('pg');

class PgsqlDB {
    // 配置并创建连接池
    constructor(config) {
        this.config = config;
        this.create();
    };
    // 创建连接池
    create() {
        if (!this.pool) {
            this.pool = new pg.Pool(this.config);
        }
    };

	/*async query(sql, values) {
	  const pool = this.pool;
	  const client = await pool.connect();
	  let ret;
	  try {
		let index = 1;
		// 如果sql语句包含?形式占位符，改成pg库识别的$num形式占位符
		sql = sql.replace(/\?/g, function(s){
		  return '$'+(index++);
		});
		ret = await pool.query(sql, values);
	  } catch(e) {
		ret = e;
	  } finally {
		client.release();
	  }
  
	  return ret;
	};*/
    // 此方法必须实现，且必须返回一个Promise对象
    query(sql, values) {
        const pool = this.pool;
        return new Promise((resolve, reject) => {
            pool.connect((err, client, release) => {
                if (err) {
                    reject(err);
                } else {
                    let index = 1;
                    // 如果sql语句包含?形式占位符，改成pg库识别的$num形式占位符
                    sql = sql.replace(/\?/g, function (s) {
                        return '$' + (index++);
                    });
                    client.query(sql, values, (err, result) => {
                        release();
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                }
            });
        });
    };

}


module.exports = PgsqlDB;