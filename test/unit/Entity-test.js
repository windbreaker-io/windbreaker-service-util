require('require-self-ref')

const test = require('ava')
const uuid = require('uuid')
const Entity = require('~/dao/Entity')
const assertUuid = require('~/test/util/assertUuid')

test('should create entityId uuid if none provided', (t) => {
  const entity = new Entity()
  t.true(assertUuid(entity.getEntityId()))
})

test('should allow passing entityId', (t) => {
  const id = uuid.v4()
  const entity = new Entity({ entityId: id })
  t.is(entity.getEntityId(), id)
})

test('should allow fetching id using getId', (t) => {
  const entity = new Entity()
  t.true(assertUuid(entity.getId()))
})

test('should allow setting entityId using setId', (t) => {
  const entity = new Entity()
  const id = uuid.v4()
  entity.setId(id)
  t.is(entity.getId(), id)
})
