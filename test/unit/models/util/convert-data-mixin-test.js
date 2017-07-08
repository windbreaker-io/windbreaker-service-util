require('require-self-ref')

const test = require('ava')
const ConvertDataMixin = require('~/models/util/convert-data-mixin')

const MyEvent = require('~/models/Model').extend({
  properties: {
    flag: Boolean
  }
})

const EventType = require('~/models/Enum').create({
  values: {
    'my-event': MyEvent
  }
})

const Event = require('~/models/Model').extend({
  mixins: [ConvertDataMixin],
  properties: {
    type: EventType,
    data: Object
  }
})

test('should add "convertData" property to model', (t) => {
  const event = new Event()
  t.is(typeof event.convertData, 'function')
})

test('should convert data of model', (t) => {
  const event = new Event({
    type: 'my-event',
    data: {
      flag: true
    }
  })

  t.deepEqual(event.getData(), { flag: true })
  const result = event.convertData()
  t.true(result.getFlag())
  t.deepEqual(result.clean(), { flag: true })
  t.true(event.getData().getFlag())
})

test('should add error if errors passed and no type is specified', (t) => {
  const event = new Event({
    data: {
      flag: true
    }
  })

  let errors = []
  let result = event.convertData(errors)

  t.is(typeof result, 'undefined')
  t.deepEqual(errors, [new Error('Converting data requires a "type" property')])
  t.deepEqual(event.getData(), { flag: true })
})

test('should not convert data if no type is passed and no errors are passed', (t) => {
  const event = new Event({
    data: {
      flag: true
    }
  })

  event.convertData()
  t.deepEqual(event.getData(), { flag: true })
})

test('should parse strings that are passed as data', (t) => {
  const event = new Event({
    type: 'my-event',
    data: JSON.stringify({
      flag: true
    })
  })

  event.convertData()
  t.true(event.getData().getFlag())
  t.deepEqual(event.getData().clean(), { flag: true })
})

test('should push error if cannot parse JSON', (t) => {
  const event = new Event({
    type: 'my-event',
    data: 'invalid-json'
  })

  let errors = []
  let result = event.convertData(errors)

  t.is(typeof result, 'undefined')
  t.is(errors.length, 1)
  t.is(errors[0].message, 'Could not parse data "invalid-json"')
})

test('should not wrap data if JSON cannot be parsed and no errors passed', (t) => {
  const event = new Event({
    type: 'my-event',
    data: 'invalid-json'
  })

  let result = event.convertData()

  t.is(typeof result, 'undefined')
  t.is(event.getData(), 'invalid-json')
})

test('should still wrap data if data is undefined', (t) => {
  const event = new Event({
    type: 'my-event'
  })

  let errors = []
  let result = event.convertData(errors)

  t.is(errors.length, 0)
  t.is(typeof event.getData().getFlag(), 'undefined')
  t.is(typeof result.getFlag(), 'undefined')
})
