require('require-self-ref')

const test = require('ava')
const uuid = require('uuid')

const Cache = require('~/cache/Cache')

const waitForEvent = require('~/test/util/waitForEvent')

const TestModel = require('~/test/util/TestModel')

const TEST_NODES = [
  {
    host: 'rediscluster',
    port: 7000
  },
  {
    host: 'rediscluster',
    port: 7001
  }
]

test.beforeEach(async (t) => {
  const cache = new Cache({
    logger: console,
    nodes: TEST_NODES
  })

  await waitForEvent(cache, 'ready')

  t.context = { cache }
})

test.afterEach(async (t) => {
  const { cache } = t.context
  return cache.close()
})

test('should be able to set and retrieve simple values stored in ' +
'the cache', async (t) => {
  const { cache } = t.context
  const key = uuid.v4()
  const testObj = { data: 'this is some object' }

  await cache.set(key, testObj)

  const data = await cache.get(key)

  t.deepEqual(data, testObj)

  t.pass()
})

test('should return null on cache misses', async (t) => {
  const { cache } = t.context
  const key = uuid.v4()

  const data = await cache.get(key)

  t.is(data, null)
})

test('should return null on misses for getEntity', async (t) => {
  const { cache } = t.context
  const key = uuid.v4()

  const data = await cache.getEntity(key, TestModel)

  t.deepEqual(data, null)

  t.pass()
})

test('should be able to set a model', async (t) => {
  const { cache } = t.context
  const key = uuid.v4()
  const model = TestModel.wrap({ data: 'this is some model' })

  await cache.setEntity(key, model)

  const data = await cache.getEntity(key, TestModel)

  t.deepEqual(data, model)

  t.pass()
})

test('should throw an error if client is closed', async (t) => {
  const { cache } = t.context
  const key = uuid.v4()
  const testObj = { data: 'this is some object' }

  // close the redis client
  await cache.close()

  try {
    await cache.set(key, testObj)
    t.fail()
  } catch (err) {
    t.pass(err)
  }
})
