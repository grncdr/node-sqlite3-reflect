# sqlite3-reflect

## module.exports = reflect(database, callback)

Given an [sqlite3](https://npm.im/sqlite3) database, reflects the schema of all
tables, including indexes and foreign keys. `callback` should accept two
arguments in the standard Node style, the first will be an error (if any
occurred) and the second will be the database schema object. See the file
[test_schema.json](test_schema.json) in this project for an example of the
object that will be returned.

## License

2-clause BSD
