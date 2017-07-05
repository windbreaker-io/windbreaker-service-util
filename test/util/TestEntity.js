require('require-self-ref')

const ProviderType = require('~/models/Enum').create({
  values: [
    'BITBUCKET',
    'GITHUB'
  ]
})

module.exports = require('~/dao/Entity').extend({
  typeName: 'testentity',
  properties: {
    type: ProviderType,
    name: String
  }
})
