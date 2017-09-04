require('require-self-ref')

const { test } = require('ava')
const path = require('path')
const configUtil = require('~/config')
const BaseServiceConfig = require('~/models/BaseServiceConfig')

test.beforeEach('store environment', t => {
  t.context.OldEnv = process.env
  process.env = {}
})

test.afterEach('restore environment', t => {
  process.env = t.context.OldEnv
})

test('should load expected default service config values when calling "load"', t => {
  const config = new BaseServiceConfig()

  configUtil.loadSync({ config })

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'LOCALHOST',
    loggingColorsEnabled: true
  })
})

test('should load overrides arg when calling "load"', t => {
  const config = new BaseServiceConfig()

  configUtil.loadSync({
    config,
    overrides: [ { loggingColorsEnabled: false } ]
  })

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'LOCALHOST',
    loggingColorsEnabled: false
  })
})

test('should load overrides file when calling "load"', t => {
  const config = new BaseServiceConfig()
  process.env.SERVICE_ENVIRONMENT = 'production'

  configUtil.loadSync({
    config,
    path: path.resolve(__dirname, './fixtures')
  })

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'LOCALHOST',
    loggingColorsEnabled: false
  })
})

test('should load default localhost config file when calling "load"', t => {
  const config = new BaseServiceConfig()

  configUtil.loadSync({
    config,
    path: path.resolve(__dirname, './fixtures')
  })

  t.deepEqual(config.clean(), {
    logLevel: 'ERROR',
    environment: 'LOCALHOST',
    loggingColorsEnabled: true
  })
})

test('should load overrides file and inject env vars when calling "load"', t => {
  const config = new BaseServiceConfig()
  process.env.SERVICE_ENVIRONMENT = 'production-env'
  process.env.LOGGING_COLORS_ENABLED = false

  configUtil.loadSync({
    config,
    path: path.resolve(__dirname, './fixtures')
  })

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'LOCALHOST',
    loggingColorsEnabled: false
  })
})

test('should prefer overrides arg over file when calling "load"', t => {
  const config = new BaseServiceConfig()
  process.env.SERVICE_ENVIRONMENT = 'production'

  configUtil.loadSync({
    config,
    path: path.resolve(__dirname, './fixtures'),
    overrides: [
      {
        loggingColorsEnabled: true
      }
    ]
  })

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'LOCALHOST',
    loggingColorsEnabled: true
  })
})
