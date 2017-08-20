require('require-self-ref')

const test = require('ava')
const BaseServiceConfig = require('~/models/BaseServiceConfig')

test('should have expected defaults', t => {
  const config = new BaseServiceConfig()
  config.applyDefaults()

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'LOCALHOST',
    loggingColorsEnabled: true
  })
})

test('should set loggingColorsEnabled=false if production', t => {
  const config = new BaseServiceConfig()
  config.setEnvironment('production')
  config.applyDefaults()

  t.deepEqual(config.clean(), {
    logLevel: 'INFO',
    environment: 'PRODUCTION',
    loggingColorsEnabled: false
  })
})
