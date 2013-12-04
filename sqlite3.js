var map = require('map-async');
var pluck = require('pluck');

var getName = pluck('name');

var queries = {
  tableNames: "SELECT name FROM SQLITE_MASTER WHERE type = 'table'",
  indexes: "SELECT name FROM SQLITE_MASTER WHERE type = 'index' AND tbl_name = ?",
}

module.exports = {
  getTableNames: function (conn, cb) {
    conn.query(queries.tableNames, function (err, res) {
      if (err) return cb(err);
      cb(null, res.rows.map(getName));
    })
  },

  getColumns: function (conn, tablename, cb) {
    conn.query('PRAGMA table_info("' + tablename + '")', function (err, res) {
      if (err) return cb(err);
      cb(null, res.rows.reduce(function (columns, row) {
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
  },

  getForeignKeys: function (conn, tablename, cb) {
    conn.query('PRAGMA foreign_key_list("' + tablename + '")', function (err, res) {
      if (err) return cb(err);
      cb(null, res.rows.map(function (row) {
        return {
          columns: [row.from],
          foreignTable: row.table,
          foreignColumns: [row.to],
        }
      }));
    })
  },

  getIndexes: function (conn, tablename, cb) {
    conn.query(queries.indexes, [tablename],
               function (err, res) {
                 if (err) return cb(err);
                 map(res.rows, function (row, i, nextIndex) {
                   var indexName = row.name;
                   conn.query('PRAGMA index_info("' + indexName + '")',
                              function (err, res) {
                                if (err) return nextIndex(err);
                                nextIndex(null, {
                                  name: indexName,
                                  columns: res.rows.map(getName)
                                });
                              })
                 }, function (err, indexes) {
                   indexes.map(function (index) {
                     this[index.name] = index;
                   })
                   cb(err, indexes);
                 })
               })
  }
};
