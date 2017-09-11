const KnexConnection = require('./KnexConnection')

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
    migrations: {
      type: Object,
      description: 'Migrations config object',
      default: {
        tableName: 'migrations'
      }
    }
  }
})
