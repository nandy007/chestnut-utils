const lib = require("../lib/db");

const CREATE_STATEMENT = 'CREATE  TABLE IF NOT EXISTS `_mysql_session_store` (`id` VARCHAR(255) NOT NULL, `expires` BIGINT NULL, `data` TEXT NULL, PRIMARY KEY (`id`));'
    , GET_STATEMENT = 'SELECT * FROM `_mysql_session_store` WHERE id  = ?'
    , SET_STATEMENT = 'INSERT INTO _mysql_session_store(id, expires, data) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE expires=?, data =?'
    , DELETE_STATEMENT = 'DELETE FROM `_mysql_session_store` WHERE id  = ?'
    , UPDATE_STATEMENT = 'UPDATE `_mysql_session_store` SET data = ? WHERE id = ?'
    , EXPIRES_STATEMENT = 'SELECT id FROM `_mysql_session_store` WHERE expires  < ?';

const mysqlConfig = {
    id: 'main',
    type: 'mysql',
    database: 'test',
    user: 'root',
    password: 'root',
    port: '3306',
    host: 'localhost'
};

describe('module', function () {

    // 测试mysql操作
    describe('mysql', function () {

        const db = lib(mysqlConfig);

        // create 语句
        it('query for create should success', function (done) {
            db.query(CREATE_STATEMENT, []).then(function (rs) {
                done();
            });
        });
        // insert 语句
        it('query for insert should success', function (done) {
            const id = '1', expires = new Date().getTime(), data = JSON.stringify({ username: 'nandy007' });
            db.query(SET_STATEMENT, [id, expires, data, expires, data]).then(function (rs) {
                done();
            });
        });
        // select 语句
        it('query for select should success', function (done) {
            const id = '1';
            db.query(GET_STATEMENT, [id]).then(function (rs) {
                //console.log(rs);
                done();
            });
        });

        // update 语句
        it('query for update should success', function (done) {
            const id = '1', data = JSON.stringify({ username: 'bond007' });
            db.query(UPDATE_STATEMENT, [data, id]).then(function (rs) {
                done();
            });
        });

        // delete 语句
        it('query for delete should success', function (done) {
            const id = '1';
            db.query(DELETE_STATEMENT, [id]).then(function (rs) {
                done();
            });
        });

        // insert 方法
        it('insert function should success', function (done) {
            const model = {
                id: '2',
                expires: new Date().getTime(),
                data: JSON.stringify({ username: 'chestnut' })
            };
            db.insert('_mysql_session_store', model).then(function (rs) {
                done();
            });
        });

        // find 方法
        it('find function should success', function (done) {
            const model = {
                id: '2'
            };
            db.find('_mysql_session_store', ['expires', 'data'], 'where ?', [model]).then(function (rs) {
                //console.log(rs);
                done();
            });
        });

        // update 方法
        it('update function should success', function (done) {
            const setModel = {
                data: JSON.stringify({username:'007'})
            };
            const whereModel = {
                id : '2'
            }
            db.update('_mysql_session_store', '? where ?', [setModel, whereModel]).then(function (rs) {
                //console.log(rs);
                done();
            });
        });

        // delete 方法
        it('delete function should success', function (done) {
            const whereModel = {
                id : '2'
            }
            db.delete('_mysql_session_store', 'where ?', [whereModel]).then(function (rs) {
                //console.log(rs);
                done();
            });
        });
    });

});