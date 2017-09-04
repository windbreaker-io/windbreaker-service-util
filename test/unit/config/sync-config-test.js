require('require-self-ref')

const { test } = require('ava')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
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

test.beforeEach(t => {
  t.context.configUtil = proxyquire('~/config', {
    confugu: {
      load: sinon.stub().resolves({})
    }
  })
})

test('should register config when called', t => {
  const config = new Config({
    colors: false
  })

  t.context.configUtil.loadSync({ config })

  t.deepEqual(config.clean(), {
    colors: false
  })
})

test('should apply defaults to a model that has the defaults mixin', t => {
  const config = new ConfigDefaults()

  t.context.configUtil.loadSync({ config })

  t.deepEqual(config.clean(), {
    colors: true
  })
})

test('should allow passing array of overrides', t => {
  const config = new ConfigDefaults()

  t.context.configUtil.loadSync({
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

  t.deepEqual(config.clean(), {
    colors: false,
    environment: 'PRODUCTION'
  })
})

test('should enforce overrides being undefined or array', t => {
  const config = new ConfigDefaults()
  const thrownError = t.throws(() => {
    t.context.configUtil.loadSync({
      config,
      path: 'tomorrowland/2018/is/happening',
      overrides: { this: 'shouldFail' }
    })
  })

  t.is(thrownError.message, 'if present, overrides must be an array')
})

test('should allow config directory to be omitted', t => {
  const config = new ConfigDefaults()
  t.context.configUtil.loadSync({ config, overrides: [ { colors: true } ] })
  t.pass()
})

test('should allow overrides to be omitted', t => {
  const config = new ConfigDefaults()
  t.context.configUtil.load({ config, path: 'tomorrowland/2018/is/happening' })
  t.pass()
})

test('should allow overrides and config directory to be omitted', t => {
  const config = new ConfigDefaults()
  t.context.configUtil.load({ config })
  t.pass()
})
