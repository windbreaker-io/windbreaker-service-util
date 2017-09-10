/**
 * QueueConsumer unit test
 */
const test = require('ava')
const sinon = require('sinon')

const QueueProducer = require('~/queue/QueueProducer')
const MockChannel = require('~/test/util/mocks/MockChannel')
const MockConnection = require('~/test/util/mocks/MockConnection')

const proxyquire = require('proxyquire')
proxyquire.noPreserveCache()

const testQueueName = 'some-queue'

test.beforeEach('setup mock channel and connections', (t) => {
  const channel = new MockChannel(testQueueName)
  const connection = new MockConnection(channel)
  const producer = new QueueProducer({
    queueName: testQueueName,
    connection,
    logger: console
  })

  const sandbox = sinon.sandbox.create()

  t.context = {
    channel,
    connection,
    producer,
    sandbox
  }
})

test.afterEach('clean up', (t) => {
  const { sandbox } = t.context

  sandbox.restore()
})

test('should generate a _tag based off of the queue name', (t) => {
  const { producer } = t.context
  const tag = producer.getTag()

  t.true(tag !== null)
  t.true(tag.startsWith(`${testQueueName}-producer-`))
})

test('"getConnection" should return the connection that was passed in', async (t) => {
  const { connection, producer } = t.context

  t.is(producer.getConnection(), connection)
})

/**
 * Starting the queue consumer
 */
test('should should create a channel using the given connection', async (t) => {
  const {
    channel,
    connection,
    producer,
    sandbox
  } = t.context
  const mock = sandbox.mock(connection)

  mock.expects('createChannel').once()
    .returns(channel)

  await producer.start()

  mock.verify()
  t.is(producer._channel, connection._mockChannel)
})

test('should perform an assertion on the queue', async (t) => {
  const { channel, producer, sandbox } = t.context
  const mock = sandbox.mock(channel)

  mock.expects('assertQueue').once()
    .withArgs(testQueueName)

  await producer.start()

  mock.verify()
  t.pass()
})

test('should fail to start if a channel cannot be made', async (t) => {
  const { connection, producer, sandbox } = t.context
  const mock = sandbox.mock(connection)
  const channelError = new Error('channel error')

  mock.expects('createChannel').once()
    .throws(channelError)

  try {
    await producer.start()
    t.fail()
  } catch (err) {
    t.is(err, channelError)
  }
})

test('should fail to start if a queue assertion fails', async (t) => {
  const { channel, producer, sandbox } = t.context
  const mock = sandbox.mock(channel)
  const queueError = new Error('queue error')

  mock.expects('assertQueue').once()
    .throws(queueError)

  try {
    await producer.start()
    t.fail()
  } catch (err) {
    t.is(err, queueError)
  }
})

test('should emit an error event if the channel emits an error', async (t) => {
  const { channel, producer } = t.context
  const testError = new Error('test')

  const errorPromise = new Promise((resolve) => {
    producer.once('error', (error) => {
      resolve(error)
    })
  })

  await producer.start()

  channel.emit('error', testError)
  let error = await errorPromise

  t.is(error, testError)
})

test('should emit an error event if the connection emits an error', async (t) => {
  const { channel, producer } = t.context
  const testError = new Error('test')

  const errorPromise = new Promise((resolve) => {
    producer.once('error', (error) => {
      resolve(error)
    })
  })

  await producer.start()

  channel.emit('error', testError)
  let error = await errorPromise

  t.is(error, testError)
})

test('should close the channel upon calling "stop"', async (t) => {
  const { channel, producer, sandbox } = t.context
  const mock = sandbox.mock(channel)

  mock.expects('close').once()

  await producer.start()
  await producer.stop()

  mock.verify()
  t.pass()
})

test('should cancel the consumer when calling "stop"', async (t) => {
  const { channel, producer, sandbox } = t.context
  const mock = sandbox.mock(channel)

  mock.expects('cancel').once()
    .withArgs(producer._tag)

  await producer.start()
  await producer.stop()

  mock.verify()
  t.pass()
})

test('should not call "close" if channel does not exist', async (t) => {
  const { channel, producer, sandbox } = t.context
  const mock = sandbox.mock(channel)
  mock.expects('close').never()

  await producer.stop()
  mock.verify()
  t.pass()
})

test('should not throw error if channel is already closed', async (t) => {
  const { channel, producer } = t.context

  channel._closed = true

  try {
    await producer.stop()
    t.pass()
  } catch (err) {
    t.fail(err.message)
  }
})

test('should throw error if unable to parse message', async (t) => {
  const { connection, sandbox } = t.context
  const messageParser = {
    encode: Promise.reject
  }

  const message = 'some-message'

  const QueueProducer = proxyquire('~/queue/QueueProducer', {
    './util/message-parser': messageParser
  })

  const producer = new QueueProducer({
    queueName: testQueueName,
    connection,
    logger: console
  })

  const mock = sandbox.mock(messageParser)
  mock.expects('encode').throws().once()
    .withArgs(message)

  try {
    await producer.sendMessage(message)
  } catch (err) {
    mock.verify()
    t.pass(err)
  }
})
