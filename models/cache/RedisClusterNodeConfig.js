module.exports = require('../Model').extend({
  properties: {
    host: {
      type: String,
      description: 'Host that this Redis Cluster node runs on',
      default: '127.0.0.1'
    },
    port: {
      type: Number,
      description: 'Port that this Redis Cluster node runs on'
    }
  }
})
