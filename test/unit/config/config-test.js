require('require-self-ref')

const { test } = require('ava')
const registerConfig = require('~/config')
const DefaultsMixin = require('fashion-model-defaults')

const configOptions = {
  properties: {
    colors: {
      type: Boolean,
      default: true
    },
    environment: String
  }
}

const Config = require('~/models/Model').extend(configOptions)
const ConfigDefaults = Config.extend({
  mixins: [DefaultsMixin]
})

test('should add "load" function to config instance', t => {
  const config = new Config()
  registerConfig({ config })
  t.is(typeof config.load, 'function')
})

test('should load config when calling "load"', async t => {
  const config = new Config({
    colors: false
  })

  registerConfig({ config })

  await config.load()

  t.deepEqual(config.clean(), {
    colors: false
  })
})

test('should apply defaults to a model that has the defaults mixin', async t => {
  const config = new ConfigDefaults()

  registerConfig({ config })

  await config.load()

  t.deepEqual(config.clean(), {
    colors: true
  })
})

test('should allow passing array of overrides', async t => {
  const config = new ConfigDefaults()

  registerConfig({
    config,
    overrides: [
      {
        colors: false
      },
      {
        environment: 'PRODUCTION'
      }
    ]
  })

  await config.load()

  t.deepEqual(config.clean(), {
    colors: false,
    environment: 'PRODUCTION'
  })
})

test('should enforce overrides being undefined or array', t => {
  const config = new ConfigDefaults()
  const boundRegister = registerConfig.bind(null,
    {
      config,
      path: 'tomorrowland/2018/is/happening',
      overrides: { this: 'shouldFail' }
    }
  )

  const thrownError = t.throws(boundRegister)
  t.is(thrownError.message, 'if present, overrides must be an array')
})

test('should allow config directory to be omitted', t => {
  const config = new ConfigDefaults()
  registerConfig({ config, overrides: [ { this: 'shouldPass' } ] })
  t.pass()
})

test('should allow overrides to be omitted', t => {
  const config = new ConfigDefaults()
  registerConfig({ config, path: 'tomorrowland/2018/is/happening' })
  t.pass()
})

test('should allow overrides and config directory to be omitted', t => {
  const config = new ConfigDefaults()
  registerConfig({ config })
  t.pass()
})
