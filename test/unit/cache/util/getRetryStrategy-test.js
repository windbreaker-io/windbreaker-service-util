require('require-self-ref')

const test = require('ava')
const sinon = require('sinon')

test('returned function should call Math.min with the delay', (t) => {
  // spy on math before calling
  const spy = sinon.spy(Math, 'min')
  const stub = sinon.stub(Math, 'random')
    .returns(0)
  const getRetryStrategy = require('~/cache/util/getRetryStrategy')
  const maxDelay = 999999

  const strategy = getRetryStrategy(maxDelay)
  const retryCount = 0

  strategy(retryCount)

  sinon.assert.calledWith(spy, 1000, maxDelay)
  spy.restore()
  stub.restore()
  t.pass()
})
