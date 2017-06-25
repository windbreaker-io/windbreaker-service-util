require('require-self-ref')

const test = require('ava')
const msgpack = require('msgpack-lite')
const messageParser = require('~/queue/util/message-parser')

test('should properly encode a message', (t) => {
  const encoded = messageParser.encode({ hello: 'world' })
  t.deepEqual(encoded, msgpack.encode({ hello: 'world' }))
})

test('should properly decode a message', (t) => {
  const original = { hello: 'world' }
  const encoded = messageParser.encode(original)
  const decoded = messageParser.decode(encoded)
  t.deepEqual(decoded, original)
})
