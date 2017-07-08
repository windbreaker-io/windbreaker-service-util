require('require-self-ref')

const test = require('ava')
const sinon = require('sinon')
const mockKnex = require('~/test/util/mocks/MockKnex')
const FashionKnex = require('~/dao/FashionKnex')
const TestEntity = require('~/test/util/TestEntity')

test.beforeEach((t) => {
  const sandbox = sinon.sandbox.create()
  const knexConnection = mockKnex()

  const daoHelper = new FashionKnex({
    modelType: TestEntity,
    logger: console,
    knexConnection
  })

  t.context = {
    daoHelper,
    sandbox
  }
})

test.afterEach(async (t) => {
  const { daoHelper, sandbox } = t.context
  sandbox.restore()
  await daoHelper.destroy()
})

test('should throw error if finding by id results in wrapping an invalid object', async (t) => {
  const { daoHelper, sandbox } = t.context

  sandbox.stub(daoHelper._knex, 'limit').callsFake(async () => {
    return Promise.resolve([{
      type: true
    }])
  })

  let error = await t.throws(daoHelper.findById('abc123'))
  t.is(error.message, 'Error(s) while wrapping model with data "{"type":true}": "type: Invalid value: true"')
  daoHelper._knex.limit.restore()
})

test('should throw error if find query throws error', async (t) => {
  const { daoHelper, sandbox } = t.context

  sandbox.stub(daoHelper._knex, 'limit').callsFake(async () => {
    return Promise.reject(new Error('Test error'))
  })

  let error = await t.throws(daoHelper.findById('abc123'))
  t.is(error.message, 'Test error')
  daoHelper._knex.limit.restore()
})

test('should throw error if insert query throws error', async (t) => {
  const { daoHelper, sandbox } = t.context

  sandbox.stub(daoHelper._knex, 'returning').callsFake(async () => {
    return Promise.reject(new Error('Test error'))
  })

  const entity = new TestEntity({
    type: 'GITHUB'
  })

  let error = await t.throws(daoHelper.insert(entity))
  t.is(error.message, 'Test error')
  daoHelper._knex.returning.restore()
})
