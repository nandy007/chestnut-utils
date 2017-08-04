# chestnut-utils KOA2工具类


配合[chestnut-app](https://github.com/nandy007/chestnut-app)使用，也可单独在Koa2中使用


## 提供的方法

### 数据库操作类

require('chestnut-utils').db

```javascript

// 首次调用初始化，初始化mysql
const dbmysql = require('chestnut-utils').db({
	id: 'main',
    type: 'mysql',
    database: 'test',
    user: 'root',
    password: 'root',
    port: '3306',
    host: 'localhost'
});

// 初始化pgsql
const dbpg = require('chestnut-utils').db({
    id: 'pg',
    type: "pgsql",
    host: "localhost",
    port: "5432",
    database: "test",
    user: "postgres",
    password: "postgres"
  });


// 后续再次调用可只传id
const db = require('chestnut-utils').db('main');


```
db类提供query、find、insert、update、delete函数进行操作，这几个函数均返回promise对象。



**query(sql, values, success, error)**

其中：

sql为可带?的sql语句，比如:select * from table where username=? and age=?

values为sql语句中?对应的数组参数，比如:['nandy007', '18']

success为执行成功的回调，用于异步请求，一般用await则无需设置

error为执行失败的回调，用于异步请求，一般用await则无需设置

示例：

```javascript

const db = require('chestnut-utils').db('main');
const rs = await db.query('select activity_id, activity_name from tbl_activity_main where activity_id = ? AND activity_name = ? ', ['4','444']

```


**find(table, keys, clause, values)**

其中：

table为查找的表名

keys为要查找的字段

clause为条件语句，可包含?

values为条件语句中?对应的参数

```javascript

const db = require('chestnut-utils').db('main');

// 序列化为 select id,title from article_info where id=1 and title='2'
let rs = await db.find('article_info',['id','title'],{id:1, title:'2'});

// 序列化为 select activity_id,activity_name from tbl_activity_main where activity_id='4' and activity_name='444'
rs = await db.find('tbl_activity_main', ['activity_id', 'activity_name'], '  where ? ', [{activity_id:'4',activity_name:'444'}]);


```

**insert(table, model)**

其中：

table为插入的表名

model为插入的数据对象

```javascript

const db = require('chestnut-utils').db('main');

// 序列化为 insert into tbl_activity_main (activity_id, activity_name) values ('4', '444')
let rs = await db.insert('tbl_activity_main', {activity_id:'4', activity_name:'444'});


```

**update(table, clause, values)**

其中：

table为更新的表名

clause为更新的条件，可带?

values为条件需要的对应参数


```javascript

const db = require('chestnut-utils').db('main');

// 序列化为 update tbl_activity_main set activity_name='333' where activity_id='3'
let rs = await db.update('tbl_activity_main',' ? where ? ', [{activity_name:'333'}, {activity_id:'3'}]);


```


**delete(table, clause, values)**

其中：

table为删除的表名

clause为删除的条件，可带?

values为条件需要的参数

```javascript

const db = require('chestnut-utils').db('main');

// 序列化为 delete from tbl_activity_main where activity_id=2 OR activity_id=4
let rs = await db.delete('tbl_activity_main', ' where ? activity_id=? OR activity_id=?', [null,2,4]);


```

### 页面抓取类

require('chestnut-utils').fetch

此类基于[https://github.com/request/request](https://github.com/request/request)

**fetch (url, opts)**

其中：

url为要请求的url

opts为请求参数，可参考https://github.com/request/request中的options，同时添加了两个属性：

*ctx* 为koa的ctx，用户标识当前请求的会话，相同的会话发起的fetch请求的cookie是维持的

*requestId* 默认为请求的url的host部分，可以自己设置（某些url使用会话共享，不同host的会话一致，可以给它们设置相同的requestId解决）

```javascript
exports.index = async (ctx) => {
	const fetch = require('../utils/fetch');
	let rs = await fetch('https://auth.exmobi.cn/login?output=json', {
      	ctx: ctx,
      	requestId: 'exmobi',
      	method: 'post',
      	body: 'username=nandy007&password=11111',
      	headers: {
        	'Content-Type': 'application/x-www-form-urlencoded'
      	}
    });
	console.log(rs.body);
}

```


**fetch.clear(sids)**

用于根据会话id删除缓存,sids为一个数组，其元素为会话id


### html页面拣选类

require('chestnut-utils').jqlite

此类基于cheerio实现，语法类似jquery

用法：

```javascript

const html = '<div><ul id="ul1"><li>1</li><li>2</li><li>3</li></ul><ul id="ul2"><li>4</li><li>5</li><li>6</li></ul></div>';

const jqlite = require('chestnut-utils').jqlite;
const $ = jqlite(html);

const lis = $('#ul2 li');

```




