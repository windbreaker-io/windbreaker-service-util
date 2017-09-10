const test = require('ava')
const sinon = require('sinon')
const BaseQueue = require('~/queue/BaseQueue')
const MockConnection = require('~/test/util/mocks/MockConnection')
const MockChannel = require('~/test/util/mocks/MockChannel')

const testQueueName = 'test-queue'

const channel = new MockChannel(testQueueName)
const connection = new MockConnection(channel)

const baseQueueOptions = {
  queueName: testQueueName,
  tag: 'test-tag',
  logger: console,
  connection,
  channel
}

test.beforeEach((t) => {
  const sandbox = sinon.sandbox.create()
  const baseQueue = new BaseQueue(baseQueueOptions)

  t.context = {
    sandbox,
    baseQueue
  }
})

test('should allow getting queueName', (t) => {
  const { baseQueue } = t.context
  t.is(baseQueue.getQueueName(), baseQueueOptions.queueName)
})

test('should allow getting tag', (t) => {
  const { baseQueue } = t.context
  t.is(baseQueue.getTag(), baseQueueOptions.tag)
})

test('should allow getting connection', (t) => {
  const { baseQueue } = t.context
  t.true(baseQueue.getConnection() instanceof MockConnection)
})

test('should call chanell.cancel() after calling cancelChannel', async (t) => {
  const { baseQueue, sandbox } = t.context

  const spy = sandbox.spy(baseQueue._channel, 'cancel')
  await baseQueue.cancelChannel()

  t.true(spy.calledWith(baseQueueOptions.tag))
  t.true(spy.calledOnce)
})

test('should call chanell.close() after calling closeChannel', async (t) => {
  const { baseQueue, sandbox } = t.context

  const spy = sandbox.spy(baseQueue._channel, 'close')
  await baseQueue.closeChannel()

  t.true(spy.calledOnce)
})

test('should set channel to null after stop() finished', async (t) => {
  const testQueueName = 'new-test-queue'

  const channel = new MockChannel(testQueueName)
  const connection = new MockConnection(channel)

  const testBaseQueue = new BaseQueue(Object.assign(baseQueueOptions, {
    connection,
    channel
  }))

  await testBaseQueue.stop()
  t.is(testBaseQueue._channel, null)
})

test('should throw error in stop() if cancelChannel throws error', async (t) => {
  const { sandbox } = t.context

  const testQueueName = 'new-test-queue'

  const channel = new MockChannel(testQueueName)
  const connection = new MockConnection(channel)

  const testBaseQueue = new BaseQueue(Object.assign(baseQueueOptions, {
    connection,
    channel
  }))

  sandbox.stub(testBaseQueue, 'cancelChannel').callsFake(async () => {
    throw new Error('Test error')
  })

  const error = await t.throws(testBaseQueue.stop())
  t.is(error.message, 'Test error')
  t.is(testBaseQueue._channel, null)
})

test('should throw error in stop() if closeChannel throws error', async (t) => {
  const { sandbox } = t.context

  const testQueueName = 'new-test-queue'

  const channel = new MockChannel(testQueueName)
  const connection = new MockConnection(channel)

  const testBaseQueue = new BaseQueue(Object.assign(baseQueueOptions, {
    connection,
    channel
  }))

  sandbox.stub(testBaseQueue, 'closeChannel').callsFake(async () => {
    throw new Error('Test error')
  })

  const error = await t.throws(testBaseQueue.stop())
  t.is(error.message, 'Test error')
  t.is(testBaseQueue._channel, null)
})
