const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
proxyquire.noPreserveCache()

const EventEmitter = require('events')

class MockCache extends EventEmitter {
  async close () {}
}

const TEST_OPTIONS = {
  nodes: [
    { host: 'rediscluster' }
  ],
  logger: console,
  maxDelay: 1000
}

test('should resolve with the cache once it is ready', async (t) => {
  const cache = new MockCache()

  const stub = sinon.stub()
    .returns(cache)

  const createCache = proxyquire('~/cache/util/createCache', {
    '../Cache': stub
  })

  const createPromise = createCache(TEST_OPTIONS)
  cache.emit('ready')
  await createPromise

  sinon.assert.calledWith(stub, TEST_OPTIONS)
  t.pass()
})

test('should resolve with the cache once it is ready', async (t) => {
  const mockCache = new MockCache()
  const createCache = proxyquire('~/cache/util/createCache', {
    '../Cache': function () { return mockCache }
  })

  const createPromise = createCache(TEST_OPTIONS)
  t.is(mockCache.listenerCount('ready'), 1)
  t.is(mockCache.listenerCount('error'), 1)

  mockCache.emit('ready')
  const result = await createPromise

  t.is(result, mockCache)
  t.is(mockCache.listenerCount('ready'), 0)
  t.is(mockCache.listenerCount('error'), 0)
})

test('should resolve with the cache once it is ready', async (t) => {
  const mockCache = new MockCache()
  const createCache = proxyquire('~/cache/util/createCache', {
    '../Cache': function () { return mockCache }
  })

  const testError = new Error('test error')

  const createPromise = createCache(TEST_OPTIONS)
  t.is(mockCache.listenerCount('ready'), 1)
  t.is(mockCache.listenerCount('error'), 1)

  mockCache.emit('error', testError)

  try {
    await createPromise
    t.fail()
  } catch (err) {
    t.is(err, testError)
    t.is(mockCache.listenerCount('ready'), 0)
    t.is(mockCache.listenerCount('error'), 0)
  }
})
