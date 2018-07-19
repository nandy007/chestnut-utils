// 请勿修改
const pg = require('pg');

const util = {
    transaction(pool){
        new Promise((resolve, reject) => {
            pool.connect((err, client, release) => {
                if(err){
                    resolve({error: err});
                }else{
                    client.query('BEGIN', (err) => {
                        if(err){
                            release();
                            resolve({error: err});
                        }else{
                            resolve({client, release});
                        }
                    });
                }
            });
        });
    },
    query(client, sql, values){
        new Promise((resolve, reject) => {
            let index = 1;
            // 如果sql语句包含?形式占位符，改成pg库识别的$num形式占位符
            sql = sql.replace(/\?/g, function (s) {
                return '$' + (index++);
            });
            client.query(sql, values, (err, result) => {
                if(err){
                    resolve({error: err});
                }else{
                    resolve(result);
                }
            });
        });
        
    },
    commit(client, done){
        new Promise((resolve, reject) => {
            client.query('COMMIT', (err) => {
                if (err) {
                    console.error('Error committing transaction', err.stack);
                }
                done();
                resolve(true);
            });
        });
    },
    rollback(client, done){
        new Promise((resolve, reject) => {
            client.query('ROLLBACK', (err) => {
                if (err) {
                    console.error('Error rolling back client', err.stack)
                }
                done();
                resolve(true);
            });
        });
    }
};

class PgsqlDB {
    // 配置并创建连接池
    constructor(config) {
        this.config = config;
        this.create();
    }
    // 创建连接池
    create() {
        if (!this.pool) {
            this.pool = new pg.Pool(this.config);
        }
    }

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
    }

    execute(...args){
        return this.query(...args);
    }

    async transaction(queue){
        const transaction = await util.transaction(this.pool);
        if(transaction.error) return transaction;
        const { client, release} = transaction;

        let flag = true, result = [];
        for(let i=0, len=queue.length;i<len;i++){
            const item = queue[i];
            let rs;
            if(typeof item === 'function'){
                rs = await item(request);
            }else{
                rs = await util.query(client, item.sql, item.params);
            }
     
            if(!rs||rs.error){
                result = rs;
                await util.rollback(client, release);
                flag = false;
                break;
            }
            result.push(rs);
        }
    
        if(flag){
            await util.commit(client, release);
        }
    
        return result;
    }

}


module.exports = PgsqlDB;