require('require-self-ref')

const test = require('ava')
const Promise = require('bluebird')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
proxyquire.noPreserveCache()

const MockChannel = require('~/test/util/mocks/MockChannel')
const MockConnection = require('~/test/util/mocks/MockConnection')

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

test('should recreate a connection for a new consumer after ' +
'a connection has been lost', async (t) => {
  const { sandbox, connection } = t.context

  const createConnection = () => connection
  const spy = sandbox.spy(createConnection)
  const createConsumer = proxyquire('~/queue/util/createConsumer', {
    './createConnection': spy
  })

  await createConsumer({
    logger: console,
    onMessage: async () => {},
    reconnectTimeout: 1,
    consumerOptions: {
      queueName: 'test-queue'
    }
  })

  // simulate connection failure
  connection.emit('close')
  await Promise.delay(100)

  // a new connection
  t.true(spy.calledTwice)
})
