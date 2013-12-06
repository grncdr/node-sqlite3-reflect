var test = require('tape');
var Database = require('sqlite3').Database;
var reflect = require('./sqlite3');

test('Reflecting a SQLite3 database', function (t) {
  t.plan(1);

  var db = new Database(__dirname + '/test.db', function (err) {
    if (err) throw err;
    reflect(db, function (err, schema) {
      if (err) throw err
      t.deepEqual(schema, require('./test_schema.json'))
    })
  })
})
