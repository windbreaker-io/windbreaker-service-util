require('require-self-ref')

const test = require('ava')
const Event = require('~/models/events/Event')

test('should convert data for a valid EventType', (t) => {
  const event = new Event({
    type: 'github-push',
    data: {
      compare: 'abc123'
    }
  })

  event.convertData()

  t.is(event.getData().getCompare(), 'abc123')
})
