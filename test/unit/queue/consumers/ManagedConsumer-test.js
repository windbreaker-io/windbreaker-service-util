/**
 * QueueConsumer unit test
 */
const test = require('ava')
const Promise = require('bluebird')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
proxyquire.noPreserveCache()

const EventEmitter = require('events')

const waitForEvent = require('~/test/util/waitForEvent')

const TEST_AMQ_URL = 'amq-url'
const TEST_QUEUE_URL = 'test-queue'

// simple mock queue consumer
class MockQueueConsumer extends EventEmitter {
  start () {
    return Promise.resolve()
  }

  stop () {
    return Promise.resolve()
  }
}

test.beforeEach('setup mock channel and connections', (t) => {
  const sandbox = sinon.sandbox.create()

  const clock = sandbox.useFakeTimers()

  const simpleConsumer = new MockQueueConsumer()

  const ManagedConsumer = proxyquire('~/queue/ManagedConsumer', {
    './util/createConsumer': () => simpleConsumer
  })

  t.context = {
    sandbox,
    clock,
    simpleConsumer,
    ManagedConsumer
  }
})

test.afterEach('clean up', (t) => {
  const { sandbox, clock } = t.context
  clock.restore()
  sandbox.restore()
})

// tests
test('should be able to create a consumer with "start"', async (t) => {
  const { ManagedConsumer } = t.context

  const managedConsumer = new ManagedConsumer({
    amqUrl: TEST_AMQ_URL,
    logger: console,
    restart: true,
    consumerOptions: {
      queueName: TEST_QUEUE_URL
    },
    onMessage: Promise.resolve
  })

  await managedConsumer.start()

  t.truthy(managedConsumer.getConsumer())
})

test('should not return a consumer if not started', async (t) => {
  const { ManagedConsumer } = t.context

  const managedConsumer = new ManagedConsumer({
    amqUrl: TEST_AMQ_URL,
    logger: console,
    restart: true,
    consumerOptions: {
      queueName: TEST_QUEUE_URL
    },
    onMessage: Promise.resolve
  })

  await managedConsumer.start()

  t.truthy(managedConsumer.getConsumer())
})

test.serial('should recreate a connection for a new consumer after ' +
'a consumer errors out', async (t) => {
  const { ManagedConsumer, simpleConsumer, clock } = t.context

  const managedConsumer = new ManagedConsumer({
    amqUrl: TEST_AMQ_URL,
    logger: console,
    restart: true,
    reconnectTimeout: 1,
    consumerOptions: {
      queueName: TEST_QUEUE_URL
    },
    onMessage: Promise.resolve
  })

  await managedConsumer.start()

  const restartPromise = Promise.all([
    waitForEvent(managedConsumer, 'consumer-stopped'),
    waitForEvent(managedConsumer, 'consumer-restarted')
  ])

  // simulate failure
  simpleConsumer.emit('error')

  clock.tick(100)

  await restartPromise
  t.pass()
})

test.serial('should not recreate a connection for a new consumer after ' +
'a consumer errors out (connection lost)', async (t) => {
  const {
    ManagedConsumer,
    simpleConsumer,
    clock
  } = t.context

  const managedConsumer = new ManagedConsumer({
    amqUrl: TEST_QUEUE_URL,
    logger: console,
    restart: false,
    reconnectTimeout: 1,
    consumerOptions: {
      queueName: TEST_QUEUE_URL
    },
    onMessage: Promise.resolve
  })

  await managedConsumer.start()

  const restartPromise = Promise.resolve()
    .then(() => waitForEvent(managedConsumer, 'consumer-restarted'))
    .timeout(500)

  // simulate connection failure
  simpleConsumer.emit('error')

  clock.tick(1000)

  try {
    await restartPromise
    t.fail()
  } catch (err) {
    t.true(err instanceof Promise.TimeoutError)
    t.pass()
  }
})

test.serial('should emit an event if a unable to restart a consumer', async (t) => {
  const {
    ManagedConsumer,
    simpleConsumer,
    sandbox,
    clock
  } = t.context

  const managedConsumer = new ManagedConsumer({
    amqUrl: TEST_QUEUE_URL,
    logger: console,
    restart: true,
    reconnectTimeout: 1,
    consumerOptions: {
      queueName: TEST_QUEUE_URL
    },
    onMessage: Promise.resolve
  })

  await managedConsumer.start()

  const failedRestartPromise = waitForEvent(managedConsumer, 'consumer-restart-failed')

  const reconnectError = new Error('error reconnecting')

  // force start to fail
  sandbox.stub(managedConsumer, 'start')
    .throws(reconnectError)

  simpleConsumer.emit('error')

  clock.tick(1000)

  await failedRestartPromise
  t.pass()
})

test('should stop the underlying consumer if "stop" is called', async (t) => {
  const { ManagedConsumer, simpleConsumer, sandbox } = t.context

  const managedConsumer = new ManagedConsumer({
    amqUrl: TEST_QUEUE_URL,
    logger: console,
    restart: false,
    restartTimeout: 1,
    consumerOptions: {
      queueName: TEST_QUEUE_URL
    },
    onMessage: Promise.resolve
  })

  await managedConsumer.start()

  const spy = sandbox.spy(simpleConsumer, 'stop')

  await managedConsumer.stop()
  t.true(spy.calledOnce)
  t.pass()
})
