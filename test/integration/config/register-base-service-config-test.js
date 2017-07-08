require('require-self-ref')

const { test } = require('ava')
const registerConfig = require('~/config')
const BaseServiceConfig = require('~/models/BaseServiceConfig')

test('should load expected default service config values when calling "load"', t => {
  const config = new BaseServiceConfig()

  registerConfig(config)

  config.load()

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'DEVELOPMENT',
    loggingColorsEnabled: true
  })
})

test('should allow fetching service environment variable', t => {
  process.env.SERVICE_ENVIRONMENT = 'PRODUCTION'
  t.is(BaseServiceConfig.getServiceEnvironment(), 'PRODUCTION')
})
