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

  // createTableIfNotExists still runs .primary() call and leads to pkey
  // error if the table already exists. Use hasTable/check explicitly to avoid err
  return knex
    .schema
    .hasTable(tableName)
    .then(exists => {
      if (exists) {
        return
      }
      return knex.schema.createTable(tableName, (table) => {
        table.string('id').primary()
        table.string('type')
        table.string('name')
      })
    })
}

function pick ({id, type, name}) {
  return {id, type, name}
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
        database: 'windbreaker_service_util'
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
      database: 'windbreaker_service_util'
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

test('should batch insert into database', async (t) => {
  const id1 = uuid.v4()
  const name1 = 'Souma'
  const id2 = uuid.v4()
  const name2 = 'Kun'

  const entity1 = new TestEntity({
    id: id1,
    type: 'GITHUB',
    name: name1
  })
  const entity2 = new TestEntity({
    id: id2,
    type: 'BITBUCKET',
    name: name2
  })

  const [data1, data2] = await daoHelper.batchInsert([entity1, entity2])

  t.deepEqual(pick(data1), entity1.clean())
  t.deepEqual(pick(data2), entity2.clean())
})

test('should upsert into database - insert then do nothing', async (t) => {
  const id = uuid.v4()
  const name = 'Souma'

  const entity = new TestEntity({
    id: id,
    type: 'GITHUB',
    name: name
  })

  let data = await daoHelper.upsert(entity)

  t.deepEqual(pick(data), entity.clean())

  data = await daoHelper.upsert(entity)
  t.is(data, undefined)

  data = await daoHelper.findById(id)
  t.deepEqual(data.clean(), entity.clean())
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

  const res = await daoHelper.insert(entity, {returning: 'type'})
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
  t.deepEqual(res.clean(), entity.clean())
})

test('should find with limited array select', async (t) => {
  const id = uuid.v4()
  const name = 'John'

  const entity = new TestEntity({
    id,
    type: 'GITHUB',
    name
  })

  await daoHelper.insert(entity)
  const res = await daoHelper.findById(id, {
    select: ['name', 'type']
  })

  t.is(res.getId(), undefined)
  t.is(res.getName(), entity.getName())
  t.is(res.getType().name(), entity.getType().name())
  t.deepEqual(res.clean(), {
    name: entity.getName(),
    type: entity.getType().name()
  })
})

test('should find with limited string select', async (t) => {
  const id = uuid.v4()
  const name = 'John'

  const entity = new TestEntity({
    id,
    type: 'GITHUB',
    name
  })

  await daoHelper.insert(entity)
  const res = await daoHelper.findById(id, {
    select: 'name'
  })

  t.is(res.getId(), undefined)
  t.is(res.getName(), entity.getName())
  t.deepEqual(res.clean(), {
    name: entity.getName()
  })
})

test('should select * if passing options with no select property', async (t) => {
  const id = uuid.v4()
  const name = 'John'

  const entity = new TestEntity({
    id,
    type: 'GITHUB',
    name
  })

  await daoHelper.insert(entity, {})
  const res = await daoHelper.findById(id)

  t.is(res.getId(), entity.getId())
  t.is(res.getName(), entity.getName())
  t.is(res.getType().name(), entity.getType().name())
  t.deepEqual(res.clean(), entity.clean())
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
