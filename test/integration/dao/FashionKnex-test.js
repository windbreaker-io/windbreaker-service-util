const test = require('ava')
const uuid = require('uuid')
const FashionKnex = require('~/dao/FashionKnex')
const TestEntity = require('~/test/util/TestEntity')
const assertUuid = require('~/test/util/assertUuid')
const KnexConfig = require('~/models/dao/KnexConfig')

let daoHelper

async function prepareDatabase (daoHelper) {
  const knex = daoHelper.getKnex()
  const tableName = daoHelper.getTableName()

  return knex
    .schema
    .createTableIfNotExists(tableName, (table) => {
      table.string('id').primary()
      table.string('type')
      table.string('name')
    })
}

test.before('initialize database', async (t) => {
  daoHelper = new FashionKnex({
    modelType: TestEntity,
    logger: console,
    knexConfig: {
      client: 'pg',
      connection: {
        host: 'postgres',
        user: 'postgres',
        password: 'postgres',
        database: 'windbreaker'
      },
      debug: true
    }
  })

  await prepareDatabase(daoHelper)
})

test.after(async (t) => {
  await daoHelper.destroy()
})

test('should allow passing KnexConfig model', async (t) => {
  const knexConfig = new KnexConfig({
    client: 'pg',
    connection: {
      host: 'postgres',
      user: 'postgres',
      password: 'postgres',
      database: 'windbreaker'
    },
    debug: true
  })

  let testDaoHelper = new FashionKnex({
    modelType: TestEntity,
    logger: console,
    knexConfig
  })

  const id = uuid.v4()
  const name = 'John'

  const entity = new TestEntity({
    id,
    type: 'GITHUB',
    name
  })

  const res = await testDaoHelper.insert(entity)
  const data = res[0]

  t.is(data.id, entity.getId())
  t.is(data.name, entity.getName())
  t.is(data.type, entity.getType().name())

  await testDaoHelper.destroy()
})

test('should insert into database', async (t) => {
  const id = uuid.v4()
  const name = 'John'

  const entity = new TestEntity({
    id,
    type: 'GITHUB',
    name
  })

  const res = await daoHelper.insert(entity)
  const data = res[0]

  t.is(data.id, entity.getId())
  t.is(data.name, entity.getName())
  t.is(data.type, entity.getType().name())
})

test('should insert raw data into database', async (t) => {
  const id = uuid.v4()
  const entity = {
    id,
    type: 'GITHUB'
  }

  const res = await daoHelper.insert(entity)
  const data = res[0]
  t.is(data.id, entity.id)
  t.is(data.type, entity.type)
})

test('should generate id without passing', async (t) => {
  const entity = new TestEntity({
    type: 'GITHUB'
  })

  const res = await daoHelper.insert(entity)
  const data = res[0]

  t.true(assertUuid(data.id))
  t.is(data.type, entity.getType().name())
  t.is(data.name, null)
})

test('should only return inserted data requested if "returning" supplied', async (t) => {
  const entity = new TestEntity({
    type: 'GITHUB'
  })

  const res = await daoHelper.insert(entity, 'type')
  const data = res[0]
  t.is(data, 'GITHUB')
})

test('should find by id', async (t) => {
  const id = uuid.v4()
  const name = 'John'

  const entity = new TestEntity({
    id,
    type: 'GITHUB',
    name
  })

  await daoHelper.insert(entity)
  const res = await daoHelper.findById(id)
  t.is(res.getId(), entity.getId())
  t.is(res.getName(), entity.getName())
  t.is(res.getType().name(), entity.getType().name())
})

test('should delete by id', async (t) => {
  const id = uuid.v4()
  const name = 'John'

  const entity = new TestEntity({
    id,
    type: 'GITHUB',
    name
  })

  await daoHelper.insert(entity)
  const res = await daoHelper.findById(id)

  t.is(res.getId(), entity.getId())
  t.is(res.getName(), entity.getName())
  t.is(res.getType().name(), entity.getType().name())

  const deleteRes = await daoHelper.deleteById(entity.getId())
  t.is(deleteRes, 1)

  const afterDeleteFindRes = await daoHelper.findById(id)
  t.is(afterDeleteFindRes, undefined)
})

test('should throw error when attempting to delete id that does not exist', async (t) => {
  const id = uuid.v4()
  const error = await t.throws(daoHelper.deleteById(id))
  t.is(error.message, `Could not delete object with id "${id}" because it does not exist`)
})

test('should return table name', (t) => {
  t.is(daoHelper.getTableName(), 'testentity')
})

test('should return knex instance', (t) => {
  const knex = daoHelper.getKnex()
  t.true(typeof knex.client === 'object')
})
