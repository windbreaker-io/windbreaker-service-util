require('require-self-ref')

const test = require('ava')
const Model = require('fashion-model/Model')
const getTableName = require('~/dao/util/getTableName')

test('should return lowercase table name', (t) => {
  const TestModel = Model.extend({
    typeName: 'MyTestModel'
  })

  t.is(getTableName(TestModel), 'mytestmodel')
})

test('should throw error if no "typeName" property provided', (t) => {
  const TestModel = Model.extend({})
  const error = t.throws(() => getTableName(TestModel), Error)
  t.is(error.message, 'Entity model requires a "typeName" property')
})
