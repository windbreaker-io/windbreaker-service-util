module.exports = require('../Model').extend({
  properties: {
    tableName: {
      type: String,
      description: 'name of the table to hold knex migration data',
      default: 'migrations'
    }
  }
})
