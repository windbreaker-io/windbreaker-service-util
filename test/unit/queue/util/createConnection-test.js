const test = require('ava')
const MockConnection = require('~/test/util/mocks/MockConnection')
const Promise = require('bluebird')

const sinon = require('sinon')

const proxyquire = require('proxyquire')
proxyquire.noPreserveCache()

const testAmqUrl = 'amqp:localhost'

test.beforeEach(async (t) => {
  t.context = {
    sandbox: sinon.sandbox.create()
  }
})

test.beforeEach(async (t) => {
  const { sandbox } = t.context
  sandbox.restore()
})

test('should return an existing connection if provided', async (t) => {
  const createConnection = require('~/queue/util/createConnection')

  const existingConnection = new MockConnection()

  const connection = await createConnection({
    amqUrl: testAmqUrl,
    logger: console,
    connection: existingConnection
  })

  t.is(connection, existingConnection)
})

test('should create a new connection if no connection is provided', async (t) => {
  const { sandbox } = t.context

  const amqplib = {
    connect: () => new MockConnection()
  }

  const mock = sandbox.mock(amqplib)

  mock.expects('connect').once()
    .withArgs(testAmqUrl)

  const createConnection = proxyquire('~/queue/util/createConnection', { amqplib })

  await createConnection({
    amqUrl: testAmqUrl,
    logger: console
  })

  mock.verify()
  t.pass()
})

test('should throw an error if reconnect attempt fails', async (t) => {
  const createConnection = proxyquire('~/queue/util/createConnection', {
    tri: Promise.reject
  })

  try {
    await createConnection({
      amqUrl: testAmqUrl,
      logger: console
    })
  } catch (err) {
    t.is(err.message, 'Unable to connect to ActiveMQ')
    t.pass()
  }
})

test('attempt to reconnect multiple times if connection cannot be made', async (t) => {
  const { sandbox } = t.context

  const amqplib = {
    connect: Promise.reject
  }

  const mock = sandbox.mock(amqplib)

  mock.expects('connect').throws().atLeast(2)
    .withArgs(testAmqUrl)

  const createConnection = proxyquire('~/queue/util/createConnection', { amqplib })

  try {
    await Promise.all([
      createConnection({
        amqUrl: testAmqUrl,
        logger: console
      })
    ]).timeout(1000)
  } catch (err) {
    mock.verify()
    t.pass()
  }
})
