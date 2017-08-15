require('require-self-ref')

const test = require('ava')
const msgpack = require('msgpack-lite')
const messageParser = require('~/queue/util/message-parser')
const Event = require('~/models/events/Event')

const testEvent = {
  type: 'github-push',
  data: {
    compare: 'abc123'
  }
}

test('should encode a message that is already cleaned', (t) => {
  const encoded = messageParser.encode(testEvent)
  t.deepEqual(encoded, msgpack.encode(testEvent))
})

test('should encode a model', (t) => {
  const event = new Event(testEvent)
  const encoded = messageParser.encode(event)
  t.deepEqual(encoded, msgpack.encode(testEvent))
})

test('should decode message and wrap it in an Event', (t) => {
  const event = new Event(testEvent)
  const encoded = messageParser.encode(event)
  const decoded = messageParser.decode(encoded)
  t.deepEqual(decoded.clean(), testEvent)
})

test('should throw error for decoded event that errors on wrap', (t) => {
  const encoded = msgpack.encode({
    randomProp: 'fail'
  })

  const error = t.throws(() => messageParser.decode(encoded))
  t.is(error.message, 'Error decoding event. Errors: "Unrecognized property: randomProp"')
})
