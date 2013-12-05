var test = require('tape');
var createConnection = require('any-db').createConnection
var reflect = require('./');

test('Reflecting a SQLite3 database', function (t) {
  t.plan(1);
  createConnection('sqlite3://' + __dirname + '/test.db', function (err, conn) {
    reflect(conn, function (err, schema) {
      if (err) throw err
      t.deepEqual(schema, require('./test_schema.json'))
    })
  })
})
