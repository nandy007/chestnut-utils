const mssql = require('mssql');

const MssqlDB = require('../lib/db.mssql');

const mssqldb = new MssqlDB({
    user: 'sa',
    password: '123456',
    server: '127.0.0.1',
    database: 'test',
    options: {
        encrypt: false
    }
});

(async function(){
    const r = await mssqldb.transaction([
        {
            sql: 'UPDATE vw_att_recordusedAPP SET emp_code = ? WHERE emp_code = ?',
            params: ['2', '12345']
        }
        
    ]);
    
    console.log(r);
})();


