/**
 * QueueConsumer integration test
 */
require('require-self-ref')

const test = require('ava')
const uuid = require('uuid')
const amqplib = require('amqplib')

const sinon = require('sinon')

const Event = require('~/models/events/Event')
const QueueProducer = require('~/queue/QueueProducer')
const createManagedConsumer = require('~/queue/util/createManagedConsumer')

const waitForEvent = require('~/test/util/waitForEvent')

const AMQ_URL = 'amqp://localhost'

const testMessage = new Event({
  type: 'github-push',
  data: {
    compare: 'abc123'
  }
})

test.beforeEach('initialize producer', async (t) => {
  const queueName = `queue-${uuid.v4()}`
  const connection = await amqplib.connect(AMQ_URL)

  const producer = new QueueProducer({
    queueName,
    connection,
    logger: console
  })

  await producer.start()

  t.context = {
    queueName,
    producer,
    connection
  }
})

test.afterEach('clean up connection and channel', async (t) => {
  const { producer, connection } = t.context

  try {
    await producer.stop()
    await connection.close()
  } catch (err) {
    console.log('closed', err)
  }
})

test.afterEach.always('ensure consumer teardown', async (t) => {
  const { consumer } = t.context
  if (consumer) {
    await consumer.stop()
  }
})

test('should be able to handle incoming message from a producer', async (t) => {
  const { queueName, producer } = t.context

  const spy = sinon.spy()

  const managedConsumer = await createManagedConsumer({
    amqUrl: AMQ_URL,
    logger: console,
    restart: false,
    consumerOptions: {
      queueName
    },
    onMessage: spy
  })

  t.context.consumer = managedConsumer

  const simpleConsumer = managedConsumer.getConsumer()
  const messagePromise = waitForEvent(simpleConsumer, 'message')

  await producer.sendMessage(testMessage)
  await messagePromise

  sinon.assert.calledOnce(spy)

  const receivedMessage = spy.firstCall.args[0]
  t.deepEqual(receivedMessage.clean(), testMessage.clean())

  let errors = []
  receivedMessage.convertData(errors)

  t.is(errors.length, 0)
  t.is(receivedMessage.getData().getCompare(), 'abc123')
})