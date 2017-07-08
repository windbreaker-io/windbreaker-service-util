require('require-self-ref')

const { test } = require('ava')
const sinon = require('sinon')
const bunyan = require('bunyan')
const logging = require('~/logging')

class MockLogger {
  constructor (options) {
    let {
      name,
      level,
      streams
    } = options || {}

    this.name = name
    this.level = level
    this.streams = streams
  }
}

test.before(() => {
  sinon.stub(bunyan, 'createLogger').callsFake((options) => {
    return new MockLogger(options)
  })
})

test.afterEach((t) => {
  logging.resetLogger()
})

test.after((t) => {
  bunyan.createLogger.restore()
})

test('should allow configuring logger', (t) => {
  const packagePath = require.resolve('~/package.json')

  let logger = logging.configure({
    packagePath,
    logLevel: 'info',
    loggerName: 'test-logger'
  })

  t.is(logger.name, 'test-logger')
  t.is(logger.level, 'info')
  t.is(logging.getProjectRootPath(),
    packagePath.substring(0, packagePath.length - 'package.json'.length))
})
