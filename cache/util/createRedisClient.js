/**
 * this util for creating a redis cluster client
 */
const { Cluster } = require('ioredis')

const _getRetryStrategy = require('./getRetryStrategy')

module.exports = function createRedisClient (nodes, options) {
  const { maxDelay, redisOptions } = options || {}

  const client = new Cluster(nodes, {
    // fail fast and don't queue while disconnected
    enableOfflineQueue: false,

    // don't emit ready event until cluster is ready
    enableReadyCheck: true,

    // for now, use simple retry strategy
    clusterRetryStrategy: _getRetryStrategy(maxDelay),

    redisOptions
  })

  return client
}
