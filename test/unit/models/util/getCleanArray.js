require('require-self-ref')

const test = require('ava')
const Model = require('~/models/Model')
const _getCleanArray = require('~/models/util/getCleanArray')

const Person = Model.extend({
  properties: {
    name: String
  }
})

const TestModel = Model.extend({
  properties: {
    people: [Person]
  }
})

test('should allow cleaning model array', (t) => {
  const testModel = new TestModel({
    people: [{
      name: 'John'
    }, {
      name: 'Sally'
    }]
  })

  t.deepEqual(_getCleanArray(testModel.getPeople()), [
    { name: 'John' },
    { name: 'Sally' }
  ])
})

test('should allow cleaning array without models', (t) => {
  const arr = [
    { name: 'John' },
    { name: 'Sally' }
  ]

  t.deepEqual(_getCleanArray(arr), [
    { name: 'John' },
    { name: 'Sally' }
  ])
})

test('should allow cleaning array mixed with models and non-models', (t) => {
  const person = new Person({
    name: 'John'
  })

  const arr = [
    person,
    { name: 'Sally' }
  ]

  t.deepEqual(_getCleanArray(arr), [
    { name: 'John' },
    { name: 'Sally' }
  ])
})
