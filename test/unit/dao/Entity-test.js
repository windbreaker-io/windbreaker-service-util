const test = require('ava')
const uuid = require('uuid')
const Entity = require('~/dao/Entity')

test('should not create id uuid if none provided', (t) => {
  const entity = new Entity()
  t.is(entity.getId(), undefined)
})

test('should allow passing id', (t) => {
  const id = uuid.v4()
  const entity = new Entity({ id: id })
  t.is(entity.getId(), id)
})
