var createConnection = require('../any-db/any-db').createConnection

createConnection('sqlite3://' + __dirname + '/test.db', function (err, conn) {
  console.log('connected');
  require('./')(conn, function (err, schema) {
    console.log('done');
    if (err) console.error(err);
    else console.log(JSON.stringify(schema, null, 2));
  });
});
