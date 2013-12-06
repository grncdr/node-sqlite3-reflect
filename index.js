module.exports = reflect

var map = require('map-async');
var pluck = require('pluck');

var getName = pluck('name');

var queries = {
  tableNames: "SELECT name FROM SQLITE_MASTER WHERE type = 'table'",
  indexes: "SELECT name FROM SQLITE_MASTER WHERE type = 'index' AND tbl_name = ?",
}

var tableProperties = {
  columns: getColumns,
  foreignKeys: getForeignKeys,
  indexes: getIndexes
}

function reflect (database, finished) {
  console.log(database, finished);
  getTableNames(database, function (err, tablenames) {
    if (err) return finished(err)

    map(tablenames, reflectTable, function (err, tables) {
      if (err) return finished(err)
      var tableMap = tables.reduce(function (a, table) {
        a[table.name] = table
        return a
      }, {})
      finished(null, tableMap)
    })
    return;

    function reflectTable (tablename, i, nextTable) {
      var table = {
        name: tablename,
        columns: {},
        foreignKeys: [],
        indexes: []
      }

      map(tableProperties, function (getter, propertyName, nextProperty) {
        getter(database, tablename, function (err, result) {
          if (err) return nextProperty(err)
          table[propertyName] = result
          nextProperty()
        })
      },
      function (err) {
        nextTable(err, table)
      })
    }
  })
}

function getTableNames (conn, cb) {
  conn.all(queries.tableNames, function (err, rows) {
    if (err) return cb(err);
    debugger
    cb(null, rows.map(getName));
  })
}

function getColumns (conn, tablename, cb) {
  conn.all('PRAGMA table_info("' + tablename + '")', function (err, rows) {
    if (err) return cb(err);
    cb(null, rows.reduce(function (columns, row) {
      columns[row.name] = {
        id: row.cid,
        name: row.name,
        type: row.type,
        primaryKey: row.pk,
        notNull: row.notnull,
        default: row.dflt_value
      };
      return columns;
    }, {}));
  })
}

function getForeignKeys (conn, tablename, cb) {
  conn.all('PRAGMA foreign_key_list("' + tablename + '")', function (err, rows) {
    if (err) return cb(err);
    cb(null, rows.map(function (row) {
      return {
        columns: [row.from],
        foreignTable: row.table,
        foreignColumns: [row.to],
      }
    }));
  })
}

function getIndexes (conn, tablename, cb) {
  conn.all(queries.indexes, [tablename], function (err, rows) {
    if (err) return cb(err)
    map(rows, function (row, i, nextIndex) {
      var indexName = row.name;
      conn.all('PRAGMA index_info("' + indexName + '")', function (err, rows) {
        if (err) return nextIndex(err)
        nextIndex(null, {
          name: indexName,
          columns: rows.map(getName)
        });
      })
    }, cb)
  })
}
