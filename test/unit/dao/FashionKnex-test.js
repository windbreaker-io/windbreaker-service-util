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

  sandbox.stub(daoHelper._knex, 'limit').resolves([{
    type: true
  }])

  let error = await t.throws(daoHelper.findById('abc123'))
  t.is(error.message, 'Error(s) while wrapping model with data "{"type":true}": "type: Invalid value: true"')
})

test('should throw error if find query throws error', async (t) => {
  const { daoHelper, sandbox } = t.context

  sandbox.stub(daoHelper._knex, 'limit').rejects(new Error('Test error'))

  let error = await t.throws(daoHelper.findById('abc123'))
  t.is(error.message, 'Test error')
})

test('should throw error if insert query throws error', async (t) => {
  const { daoHelper, sandbox } = t.context

  sandbox.stub(daoHelper._knex, 'returning').rejects(new Error('Test error'))

  const entity = new TestEntity({
    type: 'GITHUB'
  })

  let error = await t.throws(daoHelper.insert(entity))
  t.is(error.message, 'Test error')
})

test('should throw error if batch insert query throws error', async (t) => {
  const { daoHelper, sandbox } = t.context

  sandbox.stub(daoHelper._knex, 'returning').rejects(new Error('Test error'))

  const entities = [
    new TestEntity({type: 'GITHUB'}),
    new TestEntity({type: 'BITBUCKET'})
  ]

  let error = await t.throws(daoHelper.batchInsert(entities))
  t.is(error.message, 'Test error')
})

test('should throw error if upsert query throws error', async (t) => {
  const { daoHelper, sandbox } = t.context

  sandbox.stub(daoHelper._knex, 'raw')
  daoHelper._knex.raw.returns(daoHelper._knex)
  daoHelper._knex.raw.onSecondCall().rejects(new Error('Test error'))

  const entity = new TestEntity({type: 'GITHUB'})

  let error = await t.throws(daoHelper.upsert(entity))
  t.is(error.message, 'Test error')
})
