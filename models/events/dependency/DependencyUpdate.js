const DependencyType = require('./DependencyType')

module.exports = require('../../Model').extend({
  typeName: 'dependency-update',
  strict: true,
  properties: {
    name: String,
    version: String,
    type: DependencyType
  }
})
