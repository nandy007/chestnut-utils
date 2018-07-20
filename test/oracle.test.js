

const OracleDB = require('../lib/db.oracle');

const oracledb = new OracleDB({
    user          : "appadmin",
    password      : "Appadmin12345",
    connectString : "10.1.17.13/orcl",
    events        :  true
  });

(async function(){
    let r = await oracledb.transaction([
        {
            sql: 'INSERT INTO vw_att_recordusedAPP (emp_code) VALUES (?)',
            params: ['12345']
        }
        
    ]);

    r = await oracledb.query('SELECT * FROM vw_att_recordusedAPP WHERE emp_code = ?', ['12345']);

    console.log(r);
})();


