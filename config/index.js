function printConfig (config) {
  // print config values
  console.log('Config values:')
  const configObj = config.clean()
  for (const key in configObj) {
    console.log(`  ${key}: ${configObj[key]}`)
  }
  console.log('\n')
}

/**
* Patches the `Config` model instance to contain a `load` function, which can
* be called when the config is ready to be loaded
*
* @param config {Config} - Instance of the `Config` model
* @param overrides {Object[]} - Array of objects where the keys are the `Config`
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
module.exports = function (config, overrides) {
  config.load = function () {
    if (config.applyDefaults) {
      config.applyDefaults()
    }

    if (overrides) {
      overrides.forEach((override) => {
        for (const key in override) {
          config.set(key, override[key])
        }
      })
    }

    printConfig(config)
    // force config to be immutable
    Object.freeze(config)
  }
}
