require('require-self-ref')

const test = require('ava')
const FashionKnex = require('~/dao/FashionKnex')
const TestEntity = require('~/test/util/TestEntity')
const dao = require('~/dao')

test('should allow creating a FashionKnex instance', (t) => {
  const daoHelper = dao.createDaoHelper({
    modelType: TestEntity,
    logger: console,
    knexConfig: {
      client: 'pg',
      connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'postgres',
        database: 'windbreaker'
      },
      debug: true
    }
  })

  t.true(daoHelper instanceof FashionKnex)
})
