require('require-self-ref')

const test = require('ava')
const Promise = require('bluebird')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
proxyquire.noPreserveCache()

const MockChannel = require('~/test/util/mocks/MockChannel')
const MockConnection = require('~/test/util/mocks/MockConnection')
const createProducer = require('~/queue/util/createProducer')

const TEST_AMQ_URL = 'amqp:localhost'
const TEST_QUEUE_NAME = 'amqp-test-queue'

test.beforeEach((t) => {
  t.context = {
    sandbox: sinon.sandbox.create()
  }
})

test.afterEach((t) => {
  const { sandbox } = t.context
  sandbox.restore()
})

test('should throw an error if now queueName is provided', async (t) => {
  try {
    await createProducer({
      logger: console,
      amqUrl: TEST_AMQ_URL
    })
    t.fail()
  } catch (err) {
    console.log('!!!!!!!!!!!!!!!!!!!!!', err)
    t.truthy(err)
  }
})

test('should throw an error if a connection cannot be made', async (t) => {
  const createConnection = Promise.reject

  const createProducer = proxyquire('~/queue/util/createProducer', {
    './createConnection': createConnection
  })

  try {
    await createProducer({
      logger: console,
      amqUrl: TEST_AMQ_URL,
      producerOptions: {
        queueName: TEST_QUEUE_NAME
      }
    })
  } catch (err) {
    t.truthy(err)
  }
})

test('should throw an error if a producer cannot start', async (t) => {
  const producerStartError = new Error('producer start err')
  class MockQueueProducer {
    start () {
      return Promise.reject(producerStartError)
    }
  }

  const createConnection = () => new MockConnection(new MockChannel())

  const createProducer = proxyquire('~/queue/util/createProducer', {
    './createConnection': createConnection,
    '../QueueProducer': MockQueueProducer
  })

  try {
    await createProducer({
      logger: console,
      amqUrl: TEST_AMQ_URL,
      producerOptions: {
        queueName: TEST_QUEUE_NAME
      }
    })
    t.fail()
  } catch (err) {
    t.is(err, producerStartError)
  }
})

test('should throw an error if a producer cannot start', async (t) => {
  class MockQueueProducer {
    start () {
      return Promise.resolve()
    }
  }

  const createConnection = () => new MockConnection(new MockChannel())

  const createProducer = proxyquire('~/queue/util/createProducer', {
    './createConnection': createConnection,
    '../QueueProducer': MockQueueProducer
  })

  await createProducer({
    logger: console,
    amqUrl: TEST_AMQ_URL,
    producerOptions: {
      queueName: TEST_QUEUE_NAME
    }
  })

  t.pass()
})
