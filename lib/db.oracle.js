const oracledb = require('oracledb');
const PRE_PARAM = 'preparam';
const util = {
    createQuery(sql, values){
        var vars = {};
        if(values && values.length>0){
            const arr = [];
            values.forEach((param, index) => {
                const name = PRE_PARAM + index;
                arr.push(name);
                vars[name] = param;  
            });
            sql = sql.replace(/\?/g, function(s){
                const name = arr.shift();
                return `:${name}`;
            });
        }
        return {sql, vars};
    },
    pool(config){
        return new Promise((resolve, reject)=>{
            oracledb.createPool(config, function(err, pool){
                if(err){
                    reslove({error: err});
                }else{
                    resolve(pool);
                }
            });
        });
    },

    poolSync(p){
        return new Promise((resolve, reject)=>{
            p.then(function(pool){
                resolve(pool);
            });
        });
    },

    connection(pool){
        return new Promise((resolve, reject)=>{
            pool.getConnection (function(err, connection) {
                if(err){
                    reslove({error: err});
                }else{
                    resolve(connection);
                }
            });
        });
    },
    query(connection, autoCommit, s, values){
        const { sql, vars } = util.createQuery(s, values);
        console.log(sql, vars);
        return new Promise((resolve, reject)=>{
            connection.execute(sql, vars, { autoCommit: !!autoCommit }, function (err, result) {
                if (err) {
                    resolve({error: err});
                }else{
                    resolve(result);
                }
            });
        });
    },

    commit(connection){
        return new Promise((resolve, reject)=>{
            connection.commit(function (err) {
                if (err) { 
                    resolve({error: err});
                }else{
                    resolve({});
                }
            });
        });
    },

    rollback(connection){
        return new Promise((resolve, reject)=>{
            connection.rollback(function (err) {
                if (err) { 
                    resolve({error: err});
                }else{
                    resolve({});
                }
            });
        });
    },

    release(connection){
        return new Promise((resolve, reject)=>{
            connection.release(function (err) {
                if (err) { 
                    resolve({error: err});
                }else{
                    resolve({});
                }
            });
        });
    }

}


class OracleDB{
    constructor(config){
        this.config = config;
        this.create();
    }


    create(){
        if (!this.pool) {
            this.pool = util.pool(this.config);
        }
    }


    async query(sql, values){
        
        return new Promise((resolve, reject)=>{
            this.pool.then(async function(pool){
                const conn = await util.connection(pool);
                const rs = await util.query(conn, true, sql, values);
                await util.release(conn);
                if(rs.error){
                    reject(rs.error);
                }else{
                    resolve(rs);
                }
                
            });
        });
        
    }


    execute(...args){
        return this.query(...args);
    }

    async transaction(queue){
        const pool = await util.poolSync(this.pool);
        const conn = await util.connection(pool);

        let flag = true, result = [];
        for(let i=0, len=queue.length;i<len;i++){
            const item = queue[i];
            let rs;
            if(typeof item === 'function'){
                rs = await item(request);
            }else{
                rs = await util.query(conn, false, item.sql, item.params);
            }
     
            if(!rs||rs.error){
                result = rs;
                await util.rollback(conn);
                flag = false;
                break;
            }
            result.push(rs);
        }
    
        if(flag){
            await util.commit(conn);
        }

        await util.release(conn);
    
        return result;
        
    }
}

module.exports = OracleDB;