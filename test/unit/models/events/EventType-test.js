require('require-self-ref')

const test = require('ava')
const EventType = require('~/models/events/EventType')

const EVENT_TYPE_NAMES = EventType.values.map((value) => {
  return value.name()
})

test('should have all expected event types', (t) => {
  t.deepEqual(EVENT_TYPE_NAMES, [
    'github-push',
    'github-installation',
    'dependency-update'
  ])
})
