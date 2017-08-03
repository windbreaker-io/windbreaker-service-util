module.exports = require('../Model').extend({
  properties: {
    host: {
      type: String,
      default: 'postgres'
    },
    user: {
      type: String,
      default: 'postgres'
    },
    password: {
      type: String,
      default: 'postgres'
    },
    database: String
  }
})
