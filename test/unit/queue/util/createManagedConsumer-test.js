const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
proxyquire.noPreserveCache()

const EventEmitter = require('events')

const MockConnection = require('~/test/util/mocks/MockConnection')
const MockChannel = require('~/test/util/mocks/MockChannel')

const TEST_AMQ_URL = 'test-amq-url'
const TEST_QUEUE_NAME = 'test-queue-name'

const createManagedConsumer = require('~/queue/util/createManagedConsumer')

test.beforeEach((t) => {
  const connection = new MockConnection(new MockChannel())

  t.context = {
    sandbox: sinon.sandbox.create(),
    connection
  }
})

test.afterEach((t) => {
  const { sandbox } = t.context
  sandbox.restore()
})

test('should be able to create and start a managed consumer', async (t) => {
  const { sandbox } = t.context

  class ManagedConsumer extends EventEmitter {
    start () {
      return Promise.resolve()
    }
  }

  const spy = sandbox.spy(ManagedConsumer.prototype, 'start')

  const createManagedConsumer = proxyquire('~/queue/util/createManagedConsumer', {
    '../ManagedConsumer': ManagedConsumer
  })

  await createManagedConsumer({
    amqUrl: TEST_AMQ_URL,
    logger: console,
    onMessage: async () => {},
    consumerOptions: {
      queueName: TEST_QUEUE_NAME
    }
  })

  sandbox.assert.calledOnce(spy)
  t.pass()
})

test('should reject if failed to start a managed consumer', async (t) => {
  const startFailedError = new Error('start failed')

  class ManagedConsumer extends EventEmitter {
    start () {
      return Promise.reject(startFailedError)
    }
  }

  const createManagedConsumer = proxyquire('~/queue/util/createManagedConsumer', {
    '../ManagedConsumer': ManagedConsumer
  })

  try {
    await createManagedConsumer({
      amqUrl: TEST_AMQ_URL,
      logger: console,
      onMessage: async () => {},
      consumerOptions: {
        queueName: TEST_QUEUE_NAME
      }
    })
    t.fail(new Error('Should not get here'))
  } catch (err) {
    t.is(err, startFailedError)
  }
})

test('should be able to create and start a managed consumer', async (t) => {
  try {
    await createManagedConsumer()
    t.fail(new Error('Should not get here'))
  } catch (err) {
    t.is(err.message, 'Options must be provided for ManagedConsumer')
  }
})
