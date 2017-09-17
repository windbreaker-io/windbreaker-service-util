/**
 * QueueConsumer integration test
 */
const test = require('ava')
const uuid = require('uuid')
const amqplib = require('amqplib')

const Promise = require('bluebird')
const QueueProducer = require('~/queue/QueueProducer')
const QueueConsumer = require('~/queue/QueueConsumer')
const messageParser = require('~/queue/util/message-parser')
const Event = require('~/models/events/Event')
const waitForEvent = require('~/test/util/waitForEvent')

const AMQ_URL = 'amqp://rabbitmq'

const testMessage = new Event({
  type: 'github-push',
  data: {
    compare: 'abc123'
  }
})

testMessage.convertData()

function isEncodedMessage (t, message, testMessage) {
  return typeof t.deepEqual(messageParser.decode(message.content), testMessage) === 'undefined'
}

test.beforeEach('initialize connection and channel', async (t) => {
  const queueName = `queue-${uuid.v4()}`
  const consumerConnection = await amqplib.connect(AMQ_URL)
  const producerConnection = await amqplib.connect(AMQ_URL)

  const channel = await consumerConnection.createChannel()

  console.log(`Creating consumer with queueName "${queueName}"`)

  const consumer = new QueueConsumer({
    queueName,
    connection: consumerConnection,
    logger: console
  })

  const producer = new QueueProducer({
    queueName,
    connection: producerConnection,
    logger: console
  })

  await consumer.start()
  await producer.start()

  t.context = {
    queueName,
    consumerConnection,
    producerConnection,
    channel,
    consumer,
    producer
  }
})

test.afterEach('clean up connection and channel', async (t) => {
  const { consumer, producer, channel, consumerConnection, producerConnection } = t.context

  try {
    await consumer.stop()
    await producer.stop()
    await channel.close()
    await consumerConnection.close()
    await producerConnection.close()
  } catch (err) {
    console.log('closed', err)
  }
})

test('should be able to receive messages published on the queue', async (t) => {
  const { consumer, producer } = t.context

  await Promise.all([
    waitForEvent(consumer, 'message', (message) => {
      return isEncodedMessage(t, message, testMessage)
    }),
    producer.sendMessage(testMessage)
  ])

  t.pass()
})

test('should be able to acknowledge a message sent by producer', async (t) => {
  const { consumer, producer } = t.context

  await producer.sendMessage(testMessage)
  const message = await waitForEvent(consumer, 'message')

  await consumer.acknowledgeMessage(message)

  t.pass()
})

test('should be able to reject a message and receive it again', async (t) => {
  const { producer, consumer } = t.context

  await producer.sendMessage(testMessage)
  const message = await waitForEvent(consumer, 'message', (message) => {
    return isEncodedMessage(t, message, testMessage)
  })

  await Promise.all([
    waitForEvent(consumer, 'message', (message) => {
      return isEncodedMessage(t, message, testMessage)
    }),
    consumer.rejectMessage(message)
  ])

  t.pass()
})

test('should close the channel when when stopping the producer', async (t) => {
  const { producer } = t.context

  await Promise.all([
    waitForEvent(producer._channel, 'close'),
    producer.stop()
  ])

  t.pass()
})
