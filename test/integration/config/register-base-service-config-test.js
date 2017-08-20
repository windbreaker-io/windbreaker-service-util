require('require-self-ref')

const { test } = require('ava')
const path = require('path')
const registerConfig = require('~/config')
const BaseServiceConfig = require('~/models/BaseServiceConfig')

test.beforeEach('store environment', t => {
  t.context.OldEnv = process.env
  process.env = {}
})

test.afterEach('restore environment', t => {
  process.env = t.context.OldEnv
})

test('should load expected default service config values when calling "load"', async t => {
  const config = new BaseServiceConfig()

  registerConfig({ config })

  await config.load()

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'LOCALHOST',
    loggingColorsEnabled: true
  })
})

test('should load overrides arg when calling "load"', async t => {
  const config = new BaseServiceConfig()

  registerConfig({
    config,
    overrides: [ { loggingColorsEnabled: false } ]
  })

  await config.load()

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'LOCALHOST',
    loggingColorsEnabled: false
  })
})

test('should load overrides file when calling "load"', async t => {
  const config = new BaseServiceConfig()
  process.env.SERVICE_ENVIRONMENT = 'production'

  registerConfig({
    config,
    path: path.resolve(__dirname, './fixtures')
  })

  await config.load()

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'LOCALHOST',
    loggingColorsEnabled: false
  })
})

test('should load default localhost config file when calling "load"', async t => {
  const config = new BaseServiceConfig()

  registerConfig({
    config,
    path: path.resolve(__dirname, './fixtures')
  })

  await config.load()

  t.deepEqual(config.clean(), {
    logLevel: 'ERROR',
    environment: 'LOCALHOST',
    loggingColorsEnabled: true
  })
})

test('should load overrides file and inject env vars when calling "load"', async t => {
  const config = new BaseServiceConfig()
  process.env.SERVICE_ENVIRONMENT = 'production-env'
  process.env.LOGGING_COLORS_ENABLED = false

  registerConfig({
    config,
    path: path.resolve(__dirname, './fixtures')
  })

  await config.load()

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'LOCALHOST',
    loggingColorsEnabled: false
  })
})

test('should prefer overrides arg over file when calling "load"', async t => {
  const config = new BaseServiceConfig()
  process.env.SERVICE_ENVIRONMENT = 'production'

  registerConfig({
    config,
    path: path.resolve(__dirname, './fixtures'),
    overrides: [
      {
        loggingColorsEnabled: true
      }
    ]
  })

  await config.load()

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'LOCALHOST',
    loggingColorsEnabled: true
  })
})

test('should allow fetching service environment variable', t => {
  process.env.SERVICE_ENVIRONMENT = 'production'
  t.is(BaseServiceConfig.getServiceEnvironment(), 'production')
})
