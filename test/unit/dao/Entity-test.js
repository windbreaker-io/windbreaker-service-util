require('require-self-ref')

const test = require('ava')
const uuid = require('uuid')
const Entity = require('~/dao/Entity')
const assertUuid = require('~/test/util/assertUuid')

test('should create id uuid if none provided', (t) => {
  const entity = new Entity()
  t.true(assertUuid(entity.getId()))
})

test('should allow passing id', (t) => {
  const id = uuid.v4()
  const entity = new Entity({ id: id })
  t.is(entity.getId(), id)
})

test('should allow fetching id using getId', (t) => {
  const entity = new Entity()
  t.true(assertUuid(entity.getId()))
})

test('should allow setting id using setId', (t) => {
  const entity = new Entity()
  const id = uuid.v4()
  entity.setId(id)
  t.is(entity.getId(), id)
})
