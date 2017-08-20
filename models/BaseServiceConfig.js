const DefaultsMixin = require('fashion-model-defaults')
const Environment = require('./Environment')
const LogLevel = require('./LogLevel')

let BaseServiceConfig = module.exports = require('./Model').extend({
  mixins: [DefaultsMixin],

  properties: {
    logLevel: {
      type: LogLevel,
      description: 'The level to use for logging',
      default: LogLevel.INFO
    },
    environment: {
      type: Environment,
      description: 'The current service environment',
      default: Environment.LOCALHOST
    },
    loggingColorsEnabled: {
      type: Boolean,
      description: 'Whether logging colors should be enabled or not',
      default: function () {
        return this.getEnvironment().isLocalhost()
      }
    }
  }
})

/**
* Normalize the environment variable for determining the original environment
*/
BaseServiceConfig.getServiceEnvironment = function () {
  return process.env.SERVICE_ENVIRONMENT
}
