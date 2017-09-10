const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
proxyquire.noPreserveCache()

class MockCluster {
  constructor (nodes, options) {
    this.nodes = nodes
    this.options = options
  }
}

test('should pass along nodes and options to ' +
'Cluster client constructor', async (t) => {
  const maxDelay = 100
  const testFunc = () => {}
  const stub = sinon.stub().returns(testFunc)

  const createRedisClient = proxyquire('~/cache/util/createRedisClient', {
    ioredis: {
      Cluster: MockCluster
    },
    './getRetryStrategy': stub
  })

  const nodes = [
    { host: 'rediscluster', port: 1234 }
  ]

  const options = {
    maxDelay,
    redisOptions: {
      password: 'somepass'
    }
  }

  const expectedOptions = {
    enableOfflineQueue: false,
    enableReadyCheck: true,
    clusterRetryStrategy: testFunc,
    redisOptions: options.redisOptions
  }

  const client = createRedisClient(nodes, options)

  t.deepEqual(client.nodes, nodes)
  t.deepEqual(client.options, expectedOptions)
  sinon.assert.calledWith(stub, maxDelay)
})
