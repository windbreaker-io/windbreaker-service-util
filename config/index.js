require('require-self-ref')

const assert = require('assert')
const confugu = require('confugu')
const BaseServiceConfig = require('~/models/BaseServiceConfig')
const Environment = require('~/models/Environment')
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

function applyOverrides ({ config, env, allOverrides, overrides }) {
  config.setEnvironment(env)

  if (overrides) {
    Object.assign(allOverrides, ...overrides)
  }

  for (const key in allOverrides) {
    config.set(key, allOverrides[key])
  }

  printConfig(config)
  // force config to be immutable
  Object.freeze(config)
  return config
}

function getEnvironment () {
  const serviceEnv = BaseServiceConfig.getServiceEnvironment()
  let env

  if (serviceEnv) {
    const upperServiceEnv = serviceEnv.toUpperCase()

    // Validate that the service environment variable provided
    if (!Environment[upperServiceEnv]) {
      throw new Error(`Service environment variable value provided is invalid ${serviceEnv}`)
    }

    env = serviceEnv.toLowerCase()
  } else {
    env = Environment.LOCALHOST.name().toLowerCase()
  }

  return env
}

function getOverrideFilePath (env, overridePath) {
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

  const env = getEnvironment()

  let allOverrides = {}
  if (overridePath) {
    allOverrides = await confugu.load(
      getOverrideFilePath(env, overridePath))
  }

  return applyOverrides({ config, env, allOverrides, overrides })
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

  const env = getEnvironment()

  let allOverrides = {}
  if (overridePath) {
    allOverrides = confugu.loadSync(
      getOverrideFilePath(env, overridePath))
  }

  return applyOverrides({ config, env, allOverrides, overrides })
}
