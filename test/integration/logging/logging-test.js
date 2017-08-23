require('require-self-ref')

const { test } = require('ava')
const sinon = require('sinon')
const bunyan = require('bunyan')
const logging = require('~/logging')
const LogLevel = require('~/models/LogLevel')

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
    this.fileName = undefined
  }

  child ({ fileName }) {
    this.fileName = fileName
    return this
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

test('should have default logger name if none passed', (t) => {
  const packagePath = require.resolve('~/package.json')

  let logger = logging.configure({
    packagePath,
    logLevel: 'info'
  })

  t.is(logger.name, 'windbreaker')
  t.is(logger.level, 'info')
  t.is(logging.getProjectRootPath(),
    packagePath.substring(0, packagePath.length - 'package.json'.length))
})

test('should allow passing logLevel enum model', (t) => {
  const packagePath = require.resolve('~/package.json')

  let logger = logging.configure({
    packagePath,
    logLevel: LogLevel.INFO,
    loggerName: 'test-logger'
  })

  t.is(logger.name, 'test-logger')
  t.is(logger.level, 'info')
  t.is(logging.getProjectRootPath(),
    packagePath.substring(0, packagePath.length - 'package.json'.length))
})

test('should give a logger instance calling "logger" with a module passed', (t) => {
  const packagePath = require.resolve('~/package.json')

  logging.configure({
    packagePath,
    logLevel: LogLevel.INFO,
    loggerName: 'test-logger'
  })

  const logger = logging.logger(module)
  const rootPath = logging.getProjectRootPath()

  t.is(logger.name, 'test-logger')
  t.is(logger.level, 'info')
  t.is(rootPath,
    packagePath.substring(0, packagePath.length - 'package.json'.length))
  t.is(logger.fileName,
    module.filename.substring(rootPath.length))
})

test('should give a logger instance calling "logger" without a module passed', (t) => {
  const packagePath = require.resolve('~/package.json')

  logging.configure({
    packagePath,
    logLevel: LogLevel.INFO,
    loggerName: 'test-logger'
  })

  const logger = logging.logger()
  const rootPath = logging.getProjectRootPath()

  t.is(logger.name, 'test-logger')
  t.is(logger.level, 'info')
  t.is(rootPath,
    packagePath.substring(0, packagePath.length - 'package.json'.length))
  t.is(logger.fileName,
    module.filename.substring(rootPath.length))
})
