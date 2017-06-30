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
const TEST_MAX_MESSAGE_REJECTIONS = 3

test.beforeEach('initialize connection and channel', async (t) => {
  const queueName = `queue-${uuid.v4()}`
  const connection = await amqplib.connect(AMQ_URL)

  const channel = await connection.createChannel()

  console.log(`Creating consumer with queueName "${queueName}"`)

  const consumer = new QueueConsumer({
    queueName,
    connection,
    logger: console,
    maxMessageRejections: TEST_MAX_MESSAGE_REJECTIONS,
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
      t.is(message.properties.headers['x-death'][0].count, 1)
      return message.content.toString() === JSON.stringify(testMessage)
    }),
    consumer.rejectMessage(message)
  ])

  t.pass()
})

async function rejectMessagesBeforeMaxLimit (t, testMessage) {
  const { queueName, consumer, channel } = t.context

  await channel.sendToQueue(queueName, Buffer.from(testMessage))
  let message = await waitForEvent(consumer, 'message', (message) => {
    return message.content.toString() === testMessage
  })

  for (let i = 0; i < TEST_MAX_MESSAGE_REJECTIONS; i++) {
    const messagePromise = waitForEvent(consumer, 'message', (message) => {
      // assert that the header count is updating
      t.is(message.properties.headers['x-death'][0].count, i + 1)
      return message.content.toString() === testMessage
    })

    await consumer.rejectMessage(message)
    message = await messagePromise
  }

  return message
}

test('should be able to reject a message and receive it the max number of' +
'times retries are allowed', async (t) => {
  const testMessage = JSON.stringify({ test: 1 })
  await rejectMessagesBeforeMaxLimit(t, testMessage)

  const { channel, consumer } = t.context

  // ensure message doesn't make it to the dead letter queue
  try {
    await new Promise((resolve) => {
      channel.consume(consumer.getDeadLetterQueueName(), (message) => {
        resolve(message)
      })
    }).timeout(1000) // fail test if message is not received
    t.fail()
  } catch (err) {
    t.true(err instanceof Promise.TimeoutError)
  }
})

test('should push message into dead letter queue if message reaches ' +
'reach max number of retries', async (t) => {
  const testMessage = JSON.stringify({ test: 1 })
  const lastMessage = await rejectMessagesBeforeMaxLimit(t, testMessage)

  const { channel, consumer } = t.context

  // ensure message got pushed to dead letter queue
  const deadLetterPromise = new Promise((resolve) => {
    channel.consume(consumer.getDeadLetterQueueName(), (message) => {
      resolve(message)
    })
  }).timeout(1000) // fail test if message is not received (prevent hanging)

  // reject the last message one last time
  await consumer.rejectMessage(lastMessage)

  const deadLetterMessage = await deadLetterPromise
  t.is(deadLetterMessage.content.toString(), testMessage)
  t.pass()
})

test('should should not recieve messages after pushing rejected message to ' +
'dead letter queue', async (t) => {
  const testMessage = JSON.stringify({ test: 1 })
  const lastMessage = await rejectMessagesBeforeMaxLimit(t, testMessage)

  const { consumer } = t.context

  // reject the last message one last time
  // and ensure that the consumer does not
  // receive the message anymore
  try {
    await Promise.all([
      waitForEvent(consumer, 'message'),
      consumer.rejectMessage(lastMessage)
    ]).timeout(1000)
    t.fail()
  } catch (err) {
    t.true(err instanceof Promise.TimeoutError)
  }
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
