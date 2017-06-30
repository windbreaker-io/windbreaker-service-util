require('require-self-ref')

const test = require('ava')
const uuid = require('uuid')

const generateDeadLetterExchangeName =
  require('~/queue/util/generateDeadLetterExchangeName')

test('should create an exchange name for dead letter messages ' +
'based off of the queueName', (t) => {
  const testQueueName = uuid.v4()
  t.is(generateDeadLetterExchangeName(testQueueName),
    `${testQueueName}-dead-letter-exchange`)
})
