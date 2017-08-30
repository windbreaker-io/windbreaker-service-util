require('require-self-ref')

const assert = require('assert')
const confugu = require('confugu')
const BaseServiceConfig = require('~/models/BaseServiceConfig')
const path = require('path')

function printConfig (config) {
  // print config values
  console.log('Config values:')
  const configObj = config.clean()
  for (const key in configObj) {
    console.log(`  ${key}: ${configObj[key]}`)
  }
  console.log('\n')
}

function applyOverrides (config, allOverrides, overrides) {
  if (overrides) {
    Object.assign(allOverrides, ...overrides)
  }

  for (const key in allOverrides) {
    // TODO: Consider checking if config.get(key) is undefined
    config.set(key, allOverrides[key])
  }

  printConfig(config)
  // force config to be immutable
  Object.freeze(config)
  return config
}

function getOverrideFilePath (overridePath) {
  const serviceEnv = BaseServiceConfig.getServiceEnvironment()
  const env = (serviceEnv && serviceEnv.toLowerCase()) || 'localhost'
  return path.join(overridePath, `${env}.yml`)
}

/**
* Service environment env variable must be set to load non-default config file.
*
* @param obj.config {Config} - Instance of the `Config` model
* @param obj.path {string} - Absolute path to config directory
* @param obj.overrides {Object[]} - Array of objects where the keys are the `Config`
*    model property keys and the values are the corresponding values to that key.
*    Useful for passing the values of files and values from process.argv
*
*    e.g.
*
*    [
*      { environment: 'PRODUCTION' }
*      { logLevel: 'debug' },
*    ]
*
*/
exports.load = async function load ({ config, path: overridePath, overrides }) {
  assert(!overrides || Array.isArray(overrides),
    'if present, overrides must be an array')

  if (config.applyDefaults) {
    config.applyDefaults()
  }

  let allOverrides = {}
  if (overridePath) {
    allOverrides = await confugu.load(getOverrideFilePath(overridePath))
  }

  return applyOverrides(config, allOverrides, overrides)
}

/**
* Service environment env variable must be set to load non-default config file.
*
* @param obj.config {Config} - Instance of the `Config` model
* @param obj.path {string} - Absolute path to config directory
* @param obj.overrides {Object[]} - Array of objects where the keys are the `Config`
*    model property keys and the values are the corresponding values to that key.
*    Useful for passing the values of files and values from process.argv
*
*    e.g.
*
*    [
*      { environment: 'PRODUCTION' }
*      { logLevel: 'debug' },
*    ]
*
*/
exports.loadSync = function loadSync ({ config, path: overridePath, overrides }) {
  assert(!overrides || Array.isArray(overrides),
    'if present, overrides must be an array')

  if (config.applyDefaults) {
    config.applyDefaults()
  }

  let allOverrides = {}
  if (overridePath) {
    allOverrides = confugu.loadSync(getOverrideFilePath(overridePath))
  }

  return applyOverrides(config, allOverrides, overrides)
}
