const KnexConnection = require('./KnexConnection')
const KnexMigrations = require('./KnexMigrations')

module.exports = require('../Model').extend({
  properties: {
    client: {
      type: String,
      description: 'Database client to use with Knex',
      default: 'pg'
    },
    connection: KnexConnection,
    debug: {
      type: Boolean,
      description: 'Run Knex in debug mode',
      default: false
    },
    migrations: KnexMigrations
  }
})
