const mssql = require('mssql');

const MssqlDB = require('../lib/db.mssql');

const mssqldb = new MssqlDB({
    user: 'APPadmin',
    password: 'Appadmin12345',
    server: '127.0.0.1',
    database: 'scm_main',
    options: {
        encrypt: false
    }
});

(async function(){
    // const r = await mssqldb.transaction([
    //     {
    //         sql: 'UPDATE vw_att_recordusedAPP SET emp_code = ? WHERE emp_code = ?',
    //         params: ['12345', '2']
    //     }
        
    // ]);

    const r = await mssqldb.query('SELECT * FROM vw_att_recordusedAPP WHERE emp_code = ?', ['12345']);
    
    console.log(r);
})();


