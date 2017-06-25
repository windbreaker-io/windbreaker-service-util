/**
 * QueueConsumer unit test
 */
require('require-self-ref')

const test = require('ava')
const sinon = require('sinon')

const QueueConsumer = require('~/queue/QueueConsumer')
const MockChannel = require('~/test/util/mocks/MockChannel')
const MockConnection = require('~/test/util/mocks/MockConnection')

const testQueueName = 'some-queue'
const testMessage = { foo: 'bar' }

test.beforeEach('setup mock channel and connections', (t) => {
  const channel = new MockChannel(testQueueName)
  const connection = new MockConnection(channel)
  const consumer = new QueueConsumer({
    queueName: testQueueName,
    connection,
    logger: console
  })

  const sandbox = sinon.sandbox.create()

  t.context = {
    channel,
    connection,
    consumer,
    sandbox
  }
})

test.afterEach('clean up', (t) => {
  const { sandbox } = t.context

  sandbox.restore()
})

test('should generate a _tag based off of the queue name', (t) => {
  const { consumer } = t.context
  const consumerTag = consumer._tag

  t.true(consumerTag !== null)
  t.true(consumerTag.startsWith(testQueueName))
})

/**
 * Starting the queue consumer
 */
test('should should create a channel using the given connection', async (t) => {
  const {
    channel,
    connection,
    consumer,
    sandbox
  } = t.context
  const mock = sandbox.mock(connection)

  mock.expects('createChannel').once()
    .returns(channel)

  await consumer.start()

  mock.verify()
  t.is(consumer._channel, connection._mockChannel)
})

test('should perform an assertion on the queue', async (t) => {
  const { channel, consumer, sandbox } = t.context
  const mock = sandbox.mock(channel)

  mock.expects('assertQueue').once()
    .withArgs(testQueueName)

  await consumer.start()

  mock.verify()
  t.pass()
})

test('should set the channel prefetch', async (t) => {
  const { channel, consumer, sandbox } = t.context
  const mock = sandbox.mock(channel)

  mock.expects('prefetch').once()
    .withArgs(consumer._prefetchCount)

  await consumer.start()

  mock.verify()
  t.pass()
})

test('should begin consuming from the queue', async (t) => {
  const { channel, consumer, sandbox } = t.context
  const mock = sandbox.mock(channel)

  mock.expects('consume').once()
    .withArgs(testQueueName)

  await consumer.start()

  mock.verify()
  t.pass()
})

test('should emit a message if a message is consumed', async (t) => {
  const { channel, consumer } = t.context

  const messagePromise = new Promise((resolve) => {
    consumer.once('message', (message) => {
      resolve(message)
    })
  })

  await consumer.start()

  const testMessage = { msg: 'foo' }

  channel.emit('test-message', testMessage)
  let receivedMessage = await messagePromise

  t.deepEqual(receivedMessage, testMessage)
})

test('should fail to consume if a channel cannot be made', async (t) => {
  const { connection, consumer, sandbox } = t.context
  const mock = sandbox.mock(connection)
  const channelError = new Error('channel error')

  mock.expects('createChannel').once()
    .throws(channelError)

  try {
    await consumer.start()
    t.fail()
  } catch (err) {
    t.is(err, channelError)
  }
})

test('should throw error if attempting to acknowledge a ' +
'message without a channel', async (t) => {
  const { consumer } = t.context

  const error = await t.throws(consumer.acknowledgeMessage(testMessage))
  t.is(error.message, 'Channel not initialized')
})

test('should throw error if attempting to reject a ' +
'message without a channel', async (t) => {
  const { consumer } = t.context

  const error = await t.throws(consumer.rejectMessage(testMessage))
  t.is(error.message, 'Channel not initialized')
})

test('should use channel to acknowledge message', async (t) => {
  const { channel, consumer, sandbox } = t.context
  const mock = sandbox.mock(channel)
  mock.expects('ack').once()
    .withArgs(testMessage)

  await consumer.start()
  await consumer.acknowledgeMessage(testMessage)
  mock.verify()
  t.pass()
})

test('should use channel to reject message', async (t) => {
  const { channel, consumer, sandbox } = t.context
  const mock = sandbox.mock(channel)
  mock.expects('nack').once()
    .withArgs(testMessage)

  await consumer.start()
  await consumer.rejectMessage(testMessage)
  mock.verify()
  t.pass()
})

test('should fail to consume if a queue assertion fails', async (t) => {
  const { channel, consumer, sandbox } = t.context
  const mock = sandbox.mock(channel)
  const queueError = new Error('queue error')

  mock.expects('assertQueue').once()
    .throws(queueError)

  try {
    await consumer.start()
    t.fail()
  } catch (err) {
    t.is(err, queueError)
  }
})

test('should emit an error event if the channel emits an error', async (t) => {
  const { channel, consumer } = t.context
  const testError = new Error('test')

  const errorPromise = new Promise((resolve) => {
    consumer.once('error', (error) => {
      resolve(error)
    })
  })

  await consumer.start()

  channel.emit('error', testError)
  let error = await errorPromise

  t.is(error, testError)
})

test('should emit an error event if the connection emits an error', async (t) => {
  const { channel, consumer } = t.context
  const testError = new Error('test')

  const errorPromise = new Promise((resolve) => {
    consumer.once('error', (error) => {
      resolve(error)
    })
  })

  await consumer.start()

  channel.emit('error', testError)
  let error = await errorPromise

  t.is(error, testError)
})

test('should close the channel upon calling "stop"', async (t) => {
  const { channel, consumer, sandbox } = t.context
  const mock = sandbox.mock(channel)

  mock.expects('close').once()

  await consumer.start()
  await consumer.stop()

  mock.verify()
  t.pass()
})

test('should cancel the consumer when calling "stop"', async (t) => {
  const { channel, consumer, sandbox } = t.context
  const mock = sandbox.mock(channel)

  mock.expects('cancel').once()
    .withArgs(consumer._tag)

  await consumer.start()
  await consumer.stop()

  mock.verify()
  t.pass()
})

test('should not call "close" if channel does not exist', async (t) => {
  const { channel, consumer, sandbox } = t.context
  const mock = sandbox.mock(channel)
  mock.expects('close').never()

  await consumer.stop()
  mock.verify()
  t.pass()
})

test('should not throw error if channel is already closed', async (t) => {
  const { channel, consumer } = t.context

  channel._closed = true

  try {
    await consumer.stop()
    t.pass()
  } catch (err) {
    t.fail(err.message)
  }
})
