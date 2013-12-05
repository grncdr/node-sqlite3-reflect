var map = require('map-async')

module.exports = reflect

var adapters = {
  sqlite3: require('./sqlite3'),
  mysql: require('./mysql'),
  postgres: require('./postgres'),
}

var tableProperties = ['columns', 'foreignKeys', 'indexes']

function reflect (connection, finished) {
  var adapter = adapters[connection.adapter]
  var tables = {}

  adapter.getTableNames(connection, function (err, tablenames) {
    if (err) return finished(err)
    map(tablenames, function (tablename, i, nextTable) {
      var table = {
        name: tablename,
        columns: {},
        foreignKeys: [],
        indexes: []
      }

      map(tableProperties, function (property, i, nextProperty) {
        var getter = "get" + property[0].toUpperCase() + property.substring(1)
        adapter[getter](connection, tablename, function (err, result) {
          if (err) return nextProperty(err)
          table[property] = result
          nextProperty()
        })
      }, function (err, properties) {
        nextTable(err, table)
      })

    }, function (err, tables) {
      if (err) return finished(err)
      finished(null, tables.reduce(function (a, table) {
        a[table.name] = table
        return a
      }, {}))
    })
  })
}
