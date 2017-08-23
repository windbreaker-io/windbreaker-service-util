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

test('should not throw wrap errors for model that has strict type false', (t) => {
  const event = new Event({
    // GithubPush is a model that has `strict` set to `false`
    type: 'github-push',
    data: {
      compare: 'abc123',
      randomProp: 'fail'
    }
  })

  let errors = []
  event.convertData(errors)

  t.is(errors.length, 0)
  t.is(event.getData().getCompare(), 'abc123')
})
