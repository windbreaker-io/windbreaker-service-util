const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const conflogger = require('conflogger')
proxyquire.noPreserveCache()

const tri = require('tri')

const Event = require('~/models/events/Event')
const messageParser = require('~/queue/util/message-parser')
const MockChannel = require('~/test/util/mocks/MockChannel')
const MockConnection = require('~/test/util/mocks/MockConnection')

const TEST_AMQ_URL = 'test-amq-url'
const TEST_QUEUE_NAME = 'test-queue-name'

const createConsumer = require('~/queue/util/createConsumer')

const testMessage = new Event({
  type: 'github-push',
  data: {
    compare: 'abc123'
  }
})

const testMessageCleaned = testMessage.clean()

const encodedMessage = messageParser.encode(testMessage)

test.beforeEach((t) => {
  const channel = new MockChannel()
  const connection = new MockConnection(channel)

  t.context = {
    sandbox: sinon.sandbox.create(),
    channel,
    connection
  }
})

test.afterEach((t) => {
  const { sandbox } = t.context
  sandbox.restore()
})

test('should be able to create a consumer', async (t) => {
  const { connection } = t.context

  await createConsumer({
    amqUrl: TEST_AMQ_URL,
    logger: console,
    onMessage: async () => {},
    consumerOptions: {
      queueName: TEST_QUEUE_NAME,
      connection
    }
  })

  t.pass()
})

test('should fail to create a consumer if a "queueName" is not provided', async (t) => {
  const { sandbox, connection } = t.context

  const stub = sandbox.stub().returns(connection)
  const createConsumer = proxyquire('~/queue/util/createConsumer', {
    './createConnection': stub
  })

  try {
    await createConsumer({
      amqUrl: TEST_AMQ_URL,
      logger: console,
      consumerOptions: {}
    })
    t.fail()
  } catch (err) {
    t.true(err.message.includes('expecting a "queueName"'))
  }
})

test('should fail to create a consumer if "onMessage" is not provided', async (t) => {
  const { sandbox, connection } = t.context

  const stub = sandbox.stub().returns(connection)
  const createConsumer = proxyquire('~/queue/util/createConsumer', {
    './createConnection': stub
  })

  try {
    await createConsumer({
      amqUrl: TEST_AMQ_URL,
      logger: console,
      consumerOptions: {
        queueName: TEST_QUEUE_NAME
      }
    })
    t.fail()
  } catch (err) {
    t.true(err.message.includes('expecting a "onMessage"'))
  }
})

test('should fail to create a consumer if a connection cannot be made', async (t) => {
  const { sandbox } = t.context

  const stub = sandbox.stub().throws()
  const createConsumer = proxyquire('~/queue/util/createConsumer', {
    './createConnection': stub
  })

  try {
    await createConsumer({
      amqUrl: TEST_AMQ_URL,
      logger: console,
      onMessage: async () => {},
      consumerOptions: {
        queueName: TEST_QUEUE_NAME
      }
    })
    t.fail()
  } catch (err) {
    t.pass()
  }
})

test('should fail to create a consumer if a connection cannot be made', async (t) => {
  const { sandbox, connection } = t.context

  const stub = sandbox.stub().throws()
  const createConsumer = proxyquire('~/queue/util/createConsumer', {
    './createConnection': stub
  })

  try {
    await createConsumer({
      amqUrl: TEST_AMQ_URL,
      logger: console,
      onMessage: async () => {},
      consumerOptions: {
        queueName: TEST_QUEUE_NAME,
        connection
      }
    })
    t.fail()
  } catch (err) {
    t.pass()
  }
})

test('should cause consumer to stop if a connection error happens', async (t) => {
  const { sandbox, connection } = t.context

  const consumer = await createConsumer({
    amqUrl: TEST_AMQ_URL,
    logger: console,
    onMessage: async () => {},
    consumerOptions: {
      queueName: TEST_QUEUE_NAME,
      connection
    }
  })

  const spy = sandbox.spy(consumer, 'stop')

  connection.emit('error')

  t.true(spy.calledOnce)
})

test('should acknowledge a message if consumer receives a message', async (t) => {
  const { sandbox, connection } = t.context

  const consumer = await createConsumer({
    amqUrl: TEST_AMQ_URL,
    logger: console,
    onMessage: sandbox.stub(),
    consumerOptions: {
      queueName: TEST_QUEUE_NAME,
      connection
    }
  })

  const spy = sandbox.spy(consumer, 'acknowledgeMessage')

  const message = {
    content: encodedMessage
  }

  consumer.emit('message', message)

  await tri(async () => {
    return spy.calledWith(message)
  }, { maxAttempts: 2, delay: 100 })

  t.pass()
})

test('should receive a message with converted data in onMessage', async (t) => {
  const { sandbox, connection } = t.context

  const spy = sandbox.spy()

  const consumer = await createConsumer({
    amqUrl: TEST_AMQ_URL,
    logger: console,
    onMessage: sandbox.spy(),
    consumerOptions: {
      queueName: TEST_QUEUE_NAME,
      connection
    }
  })

  const message = {
    content: encodedMessage
  }

  consumer.emit('message', message)

  await tri(async () => {
    let calledWith = spy.calledWith(message)
    if (calledWith) {
      const receivedMessage = spy.firstCall.args[0]
      const receivedMessageCleaned = testMessage.clean()

      t.deepEqual(receivedMessageCleaned, testMessage.clean())
      t.is(receivedMessage.getData().getCompare(), 'abc123')
      t.deepEqual(receivedMessage.getData().clean(), testMessageCleaned.data)
    }
    return calledWith
  }, { maxAttempts: 2, delay: 100 })

  t.pass()
})

test('should log error and exit early if message decoding fails', async (t) => {
  const { sandbox, connection } = t.context

  const loggerErrorSpy = sandbox.spy()

  const createConsumer = proxyquire('~/queue/util/createConsumer', {
    './message-parser': {
      decode: function () {
        throw new Error('Decode error!')
      }
    }
  })

  const logger = conflogger.configure({
    error: loggerErrorSpy
  })

  const consumer = await createConsumer({
    amqUrl: TEST_AMQ_URL,
    logger,
    onMessage () {
      t.fail()
    },
    consumerOptions: {
      queueName: TEST_QUEUE_NAME,
      connection
    }
  })

  const message = {
    content: encodedMessage
  }

  consumer.emit('message', message)

  await tri(async () => {
    if (!loggerErrorSpy.calledWith('Error decoding message: ')) {
      throw new Error('Not called with proper error')
    }
  }, { maxAttempts: 5, delay: 100 })

  t.pass()
})

test('should reject a message if consumer receives a ' +
'message but errors out', async (t) => {
  const { sandbox, connection } = t.context
  let errorReceived

  const consumer = await createConsumer({
    amqUrl: TEST_AMQ_URL,
    logger: console,
    onMessage () {
      errorReceived = true
      throw new Error('This message should be rejected')
    },
    consumerOptions: {
      queueName: TEST_QUEUE_NAME,
      connection
    }
  })

  const spy = sandbox.spy(consumer, 'rejectMessage')

  const message = {
    content: encodedMessage,
    properties: {
      headers: {}
    }
  }

  consumer.emit('message', message)

  t.true(spy.calledWith(message))
  t.true(errorReceived)
})
