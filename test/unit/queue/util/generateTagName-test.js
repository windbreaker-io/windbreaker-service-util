const test = require('ava')
const generateTagName = require('~/queue/util/generateTagName')

test('should generate tag name using queueName and type', (t) => {
  const generated = generateTagName('test-queue', 'consumer')
  t.true(generated.startsWith('test-queue-consumer-'))
})
