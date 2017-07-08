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

test('should add "load" function to config instance', (t) => {
  const config = new Config()
  registerConfig(config)
  t.is(typeof config.load, 'function')
})

test('should load config when calling "load"', (t) => {
  const config = new Config({
    colors: false
  })

  registerConfig(config)

  config.load()

  t.deepEqual(config.clean(), {
    colors: false
  })
})

test('should apply defaults to a model that has the defaults mixin', (t) => {
  const config = new ConfigDefaults()

  registerConfig(config)

  config.load()

  t.deepEqual(config.clean(), {
    colors: true
  })
})

test('should allow passing array of overrides', (t) => {
  const config = new ConfigDefaults()

  registerConfig(config, [
    {
      colors: false
    },
    {
      environment: 'PRODUCTION'
    }
  ])

  config.load()

  t.deepEqual(config.clean(), {
    colors: false,
    environment: 'PRODUCTION'
  })
})
