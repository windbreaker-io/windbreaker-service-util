/**
 * QueueConsumer integration test
 */
require('require-self-ref')

const test = require('ava')
const uuid = require('uuid')
const amqplib = require('amqplib')

const Promise = require('bluebird')
const QueueConsumer = require('~/queue/QueueConsumer')

const waitForEvent = require('~/test/util/waitForEvent')

const AMQ_URL = 'amqp://localhost'

const TEST_PREFETCH_LIMIT = 2

test.beforeEach('initialize connection and channel', async (t) => {
  const queueName = `queue-${uuid.v4()}`
  const connection = await amqplib.connect(AMQ_URL)

  const channel = await connection.createChannel()

  console.log(`Creating consumer with queueName "${queueName}"`)

  const consumer = new QueueConsumer({
    queueName,
    connection,
    logger: console,
    prefetchCount: TEST_PREFETCH_LIMIT
  })

  await consumer.start()

  t.context = {
    queueName,
    connection,
    channel,
    consumer
  }
})

test.afterEach('clean up connection and channel', async (t) => {
  const { consumer, channel, connection } = t.context

  try {
    await consumer.stop()
    await channel.close()
    await connection.close()
  } catch (err) {
    console.log('closed', err)
  }
})

test('should be able to receive messages published on the queue', async (t) => {
  const testMessage = { test: 1 }
  const { queueName, consumer, channel } = t.context

  await Promise.all([
    waitForEvent(consumer, 'message', (message) => {
      return message.content.toString() === JSON.stringify(testMessage)
    }),
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(testMessage)))
  ])

  t.pass()
})

test('should be able to acknowledge a message', async (t) => {
  const testMessage = { test: 1 }
  const { queueName, consumer, channel } = t.context

  await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(testMessage)))
  const message = await waitForEvent(consumer, 'message')

  await consumer.acknowledgeMessage(message)

  t.pass()
})

test('should be able to reject a message and receive it again', async (t) => {
  const testMessage = { test: 2 }
  const { queueName, consumer, channel } = t.context

  await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(testMessage)))
  const message = await waitForEvent(consumer, 'message', (message) => {
    return message.content.toString() === JSON.stringify(testMessage)
  })

  await Promise.all([
    waitForEvent(consumer, 'message', (message) => {
      return message.content.toString() === JSON.stringify(testMessage)
    }),
    consumer.rejectMessage(message)
  ])

  t.pass()
})

test('should close the channel when when stopping the consumer', async (t) => {
  const { consumer } = t.context

  await Promise.all([
    waitForEvent(consumer._channel, 'close'),
    consumer.stop()
  ])

  t.pass()
})

test('should enforce the prefetch limit on the consumer\'s channel', async (t) => {
  t.plan(1)
  const { channel, consumer, queueName } = t.context

  // send enough message to hit the upper limit
  for (let i = 0; i < TEST_PREFETCH_LIMIT; i++) {
    const testMessage = JSON.stringify({ message: i })
    await Promise.all([
      waitForEvent(consumer, 'message', (message) => {
        return message.content.toString() === testMessage
      }),
      channel.sendToQueue(queueName, Buffer.from(testMessage))
    ])
  }

  const lastMessage = JSON.stringify({ lastMessage: true })

  try {
    await Promise.all([
      waitForEvent(consumer, 'message', (message) => {
        return message.content.toString() === lastMessage
      }),
      channel.sendToQueue(queueName, Buffer.from(lastMessage))
    ]).timeout(2000)
  } catch (err) {
    t.truthy(err instanceof Promise.TimeoutError)
  }
})

test('should return unacknowledged message to queue if a consumer stops consuming without ' +
'acknowledging a message', async (t) => {
  t.plan(0)
  const { connection, channel, consumer, queueName } = t.context

  const testMessage = JSON.stringify({ message: uuid.v4() })

  // send the test message to the queue, wait for consumer to
  // receive the message
  await Promise.all([
    waitForEvent(consumer, 'message', (message) => {
      return message.content.toString() === testMessage
    }),
    channel.sendToQueue(queueName, Buffer.from(testMessage))
  ])

  // stop consumer
  await consumer.stop()

  const newConsumer = new QueueConsumer({
    queueName,
    connection,
    logger: console,
    prefetchCount: TEST_PREFETCH_LIMIT
  })

  await newConsumer.start()

  await Promise.all([
    waitForEvent(newConsumer, 'message', (message) => {
      return message.content.toString() === testMessage
    })
  ]).timeout(2000)

  return newConsumer.stop()
})
