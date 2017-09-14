const test = require('ava')
const uuid = require('uuid')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
proxyquire.noPreserveCache()

const msgpack = require('msgpack-lite')
const MockRedisClient = require('~/test/util/mocks/MockRedisClient')
const Model = require('~/models/Model')
const RedisClusterNodeConfig = require('~/models/cache/RedisClusterNodeConfig')

const waitForEvent = require('~/test/util/waitForEvent')

const TEST_NODES = [
  {
    host: 'rediscluster',
    port: 7000
  }
]

const TEST_TTL = 6000

test.beforeEach(async (t) => {
  const sandbox = sinon.sandbox.create()

  const mockClient = new MockRedisClient()

  const Cache = proxyquire('~/cache/Cache', {
    './util/createRedisClient': sandbox.stub().returns(mockClient)
  })

  const cache = new Cache({
    nodes: TEST_NODES,
    logger: console,
    defaultTtl: TEST_TTL
  })

  // create a new model for testing
  const TestModel = Model.extend({
    properties: {
      test: String
    }
  })

  t.context = { mockClient, cache, sandbox, TestModel, Cache }
})

test.afterEach(async (t) => {
  const { sandbox, cache } = t.context
  sandbox.restore()
  return cache.close()
})

test('should pass the redis nodes and client options to ' +
'createRedisClient', async (t) => {
  const { sandbox, mockClient } = t.context
  const stub = sandbox.stub()
    .returns(mockClient)

  const Cache = proxyquire('~/cache/Cache', {
    './util/createRedisClient': stub
  })

  const testOptions = { some: 'options' }

  const cache = new Cache({ // eslint-disable-line
    nodes: TEST_NODES,
    redisClientOptions: testOptions
  })

  t.true(stub.calledWith(TEST_NODES, testOptions))
})

test('should emit a ready event when the redis client is ready', async (t) => {
  const { mockClient, cache } = t.context

  const readyPromise = waitForEvent(cache, 'ready')
  mockClient.emit('ready')
  await readyPromise

  t.pass()
})

test('should emit an error event when the redis client emits an error', async (t) => {
  const { mockClient, cache } = t.context
  const testError = new Error('test redis error')

  const errorPromise = waitForEvent(cache, 'error', (err) => {
    return err === testError
  })

  mockClient.emit('error', testError)

  await errorPromise
  t.pass()
})

test('should call the client\'s "getBuffer" upon calling "get"', async (t) => {
  const { mockClient, sandbox, cache } = t.context
  const key = uuid.v4()
  const testObj = { test: 'test' }
  const testResult = msgpack.encode(testObj)

  const stub = sandbox.stub(mockClient, 'getBuffer')
    .returns(testResult)

  const result = await cache.get(key)

  sandbox.assert.calledWith(stub, key)
  t.deepEqual(result, testObj)
})

test('should throw an error if the redis client\'s "getBuffer" ' +
'throws an error', async (t) => {
  const { mockClient, sandbox, cache } = t.context
  const getBufferError = new Error('error performing "getBuffer"')
  const key = uuid.v4()

  sandbox.stub(mockClient, 'getBuffer')
    .throws(getBufferError)

  try {
    await cache.get(key)
    t.fail()
  } catch (err) {
    t.is(err, getBufferError)
  }
})

test('should call the client\'s "setex" with the encoded msgpack and ttl ' +
'upon calling "set"', async (t) => {
  const { mockClient, sandbox, cache } = t.context
  const key = uuid.v4()
  const testValue = { some: 'value' }
  const ttl = 1000

  const spy = sandbox.spy(mockClient, 'setex')

  await cache.set(key, testValue, ttl)

  sandbox.assert.calledWith(spy, key, ttl, msgpack.encode(testValue))
  t.pass()
})

test('should call the client\'s "setex" with the cache\'s default ttl ' +
'upon calling "set" if no ttl is provided', async (t) => {
  const { mockClient, sandbox, cache } = t.context
  const key = uuid.v4()
  const testValue = { some: 'value' }

  const spy = sandbox.spy(mockClient, 'setex')

  await cache.set(key, testValue)

  sandbox.assert.calledWith(spy, key, TEST_TTL, msgpack.encode(testValue))
  t.pass()
})

test('should call the cache\'s "get" method with "getEntity" and wrap ' +
'the data with the passed in model type', async (t) => {
  const { sandbox, cache, TestModel } = t.context
  const key = uuid.v4()
  const testValue = { test: 'value' }

  const modelSpy = sandbox.spy(TestModel, 'wrap')
  const getStub = sandbox.stub(cache, 'get')
    .returns(testValue)

  await cache.getEntity(key, TestModel)

  sandbox.assert.calledWith(modelSpy, testValue)
  sandbox.assert.calledWith(getStub, key)
  t.pass()
})

test('should throw an error if errors occur while wrapping data ' +
'from a "getEntity" call', async (t) => {
  const { sandbox, cache, TestModel } = t.context
  const key = uuid.v4()
  const testValue = { test: 'value' }
  const wrapError = new Error('wrapping error')

  sandbox.stub(TestModel, 'wrap')
    .callsFake((data, errors) => {
      errors.push(wrapError)
    })

  sandbox.stub(cache, 'get')
    .returns(testValue)

  try {
    await cache.getEntity(key, TestModel)
    t.fail()
  } catch (err) {
    t.true(err.message.includes('Error(s) occured while wrapping model'))
    t.true(err.message.includes(wrapError.message))
  }
})

test('should not wrap the model if the data does not exist', async (t) => {
  const { sandbox, cache, TestModel } = t.context
  const key = uuid.v4()

  const modelSpy = sandbox.spy(TestModel, 'wrap')
  sandbox.stub(cache, 'get')
    .returns(null)

  await cache.getEntity(key, TestModel)

  sandbox.assert.notCalled(modelSpy)
  t.pass()
})

test('should call the cache\'s "get" method with "getEntity" and wrap ' +
'the data with the passed in model type', async (t) => {
  const { sandbox, cache, TestModel } = t.context
  const key = uuid.v4()
  const testValue = { test: 'value' }

  const wrapSpy = sandbox.spy(TestModel, 'wrap')
  const getStub = sandbox.stub(cache, 'get')
    .returns(testValue)

  await cache.getEntity(key, TestModel)

  sandbox.assert.calledWith(wrapSpy, testValue)
  sandbox.assert.calledWith(getStub, key)
  t.pass()
})

test('should clean the model and call the cache\'s "set" method with ' +
'"setEntity"', async (t) => {
  const { sandbox, cache, TestModel } = t.context
  const key = uuid.v4()
  const testValue = { test: 'value' }
  const ttl = 1000
  const model = TestModel.wrap(testValue)

  const cleanSpy = sandbox.spy(model, 'clean')
  const setSpy = sandbox.spy(cache, 'set')

  await cache.setEntity(key, model, ttl)

  sandbox.assert.calledOnce(cleanSpy)
  sandbox.assert.calledWith(setSpy, key, testValue, ttl)
  t.pass()
})

test('should make a call to disconnect the cache from redis upon ' +
'calling "close"', async (t) => {
  const { mockClient, sandbox, cache } = t.context
  const spy = sandbox.spy(mockClient, 'quit')

  await cache.close()

  sandbox.assert.calledOnce(spy)
  t.pass()
})

test('should reject if there was an error diconnecting after ' +
'calling "close"', async (t) => {
  const { mockClient, sandbox, cache } = t.context
  const testError = new Error('disconnect error')

  sandbox.stub(mockClient, 'quit')
    .throws(testError)

  try {
    await cache.close()
    t.fail()
  } catch (err) {
    t.is(err, testError)
  }
})

test('should allow creating Cache using RedisClusterNodeConfig model', (t) => {
  const { Cache } = t.context

  let nodes = []

  TEST_NODES.forEach((node) => {
    nodes.push(new RedisClusterNodeConfig(node))
  })

  let cache = new Cache({
    nodes,
    logger: console,
    defaultTtl: TEST_TTL
  })

  t.deepEqual(cache._nodes, TEST_NODES)
})

test('should pass a model cleaned nodes array to _createRedisClient', (t) => {
  const { sandbox } = t.context

  const mockClient = new MockRedisClient()
  const createRedisClientStub = sandbox.stub().returns(mockClient)

  const Cache = proxyquire('~/cache/Cache', {
    './util/createRedisClient': createRedisClientStub
  })

  const nodes = []

  TEST_NODES.forEach((node) => {
    nodes.push(new RedisClusterNodeConfig(node))
  })

  let cache = new Cache({
    nodes,
    logger: console,
    defaultTtl: TEST_TTL
  })

  // createRedisClientStub should be called with an array with each value being
  // the Model.clean(...) output
  sinon.assert.calledWith(createRedisClientStub, TEST_NODES)

  t.deepEqual(cache._nodes, TEST_NODES)
})

test('should pass redisClientOptions to _createRedisClient', (t) => {
  const { sandbox } = t.context

  const mockClient = new MockRedisClient()
  const createRedisClientStub = sandbox.stub().returns(mockClient)

  const Cache = proxyquire('~/cache/Cache', {
    './util/createRedisClient': createRedisClientStub
  })

  const redisClientOptions = {
    maxDelay: 1000,
    redisOptions: {
      password: 'test'
    }
  }

  let cache = new Cache({
    nodes: TEST_NODES,
    logger: console,
    defaultTtl: TEST_TTL,
    redisClientOptions
  })

  sinon.assert.calledWith(createRedisClientStub, TEST_NODES, redisClientOptions)

  t.deepEqual(cache._nodes, TEST_NODES)
})
