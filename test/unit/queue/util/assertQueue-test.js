const test = require('ava')
const uuid = require('uuid')
const sinon = require('sinon')

const generateDeadLetterExchangeName =
  require('~/queue/util/generateDeadLetterExchangeName')

const MockChannel = require('~/test/util/mocks/MockChannel')

const assertQueue = require('~/queue/util/assertQueue')

test('should assert queue as durable, no auto acknowledgement, ' +
'and a dead letter exchange', async (t) => {
  const channel = new MockChannel()
  const spy = sinon.spy(channel, 'assertQueue')

  const testQueueName = uuid.v4()

  await assertQueue(channel, testQueueName)

  sinon.assert.calledWithMatch(spy, testQueueName, {
    arguments: {
      'x-dead-letter-exchange':
        generateDeadLetterExchangeName(testQueueName)
    }
  })

  spy.restore()
  t.pass()
})
