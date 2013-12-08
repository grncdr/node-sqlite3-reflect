module.exports = reflect

var doto = require('doto');
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
        primaryKey: [],
        columns: {},
        indexes: []
      }
      var steps = [getColumns, getForeignKeys, getIndexes].map(function (f) {
        return f.bind(null, database)
      })
      doto(table, steps, function (err) {
        nextTable(err, table)
      })
    }
  })
}

function getTableNames (database, cb) {
  database.all(queries.tableNames, function (err, rows) {
    if (err) return cb(err);
    cb(null, rows.map(getName));
  })
}

function getColumns (database, table, next) {
  database.all('PRAGMA table_info("' + table.name + '")', function (err, rows) {
    if (err) return next(err);
    rows.forEach(function (row) {
      table.columns[row.name] = {
        position: row.cid,
        name: row.name,
        type: row.type,
        notNull: row.notnull,
        default: row.dflt_value,
        refersTo: []
      };
      if (row.pk) {
        table.primaryKey.push(row.name)
      }
    })
    next();
  })
}

function getForeignKeys (database, table, next) {
  database.all('PRAGMA foreign_key_list("' + table.name + '")', function (err, rows) {
    if (err) return next(err);
    rows.forEach(function (row) {
      var column = table.columns[row.from];
      debugger
      column.refersTo.push({
        table: row.table,
        column: row.to,
      })
    })
    next();
  })
}

function getIndexes (database, table, next) {
  database.all(queries.indexes, [table.name], function (err, rows) {
    if (err) return next(err)
    map(rows, function (row, i, nextIndex) {
      var indexName = row.name;
      database.all('PRAGMA index_info("' + indexName + '")', function (err, rows) {
        if (err) return nextIndex(err)
        table.indexes.push({
          name: indexName,
          columns: rows.map(getName)
        })
        nextIndex()
      })
    }, next)
  })
}
