const test = require('ava')
const FashionKnex = require('~/dao/FashionKnex')
const dao = require('~/dao')
const TestEntity = require('~/test/util/TestEntity')
const mockKnex = require('~/test/util/mocks/MockKnex')

test('should allow creating a FashionKnex instance', (t) => {
  const knexConnection = mockKnex()
  const daoHelper = dao.createDaoHelper({
    modelType: TestEntity,
    logger: console,
    knexConnection
  })

  t.true(daoHelper instanceof FashionKnex)
})
