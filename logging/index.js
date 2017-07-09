const bunyan = require('bunyan')
const PrettyStream = require('bunyan-prettystream')
const Model = require('../models/Model')

const prettyStdOut = new PrettyStream()

prettyStdOut.pipe(process.stdout)

let projectRootPath
let logger

exports.configure = function (options) {
  let {
    packagePath,
    logLevel,
    loggerName,
    loggerConfig
  } = options

  // If an Enum is passed, convert it to the string equivalent
  if (Model.isModel(logLevel)) {
    logLevel = logLevel.name().toLowerCase()
  }

  projectRootPath = packagePath.substring(0, packagePath.length - 'package.json'.length)

  logger = bunyan.createLogger(loggerConfig || {
    name: loggerName || 'windbreaker',
    level: logLevel,

    // TODO: stream json logs to a file
    streams: [
      {
        type: 'raw',
        stream: prettyStdOut
      }
    ]
  })

  return logger
}

exports.logger = function (fileModule) {
  let fileName = (fileModule && fileModule.filename) || module.parent.filename
  fileName = fileName.substring(projectRootPath.length)

  return logger.child({ fileName })
}

exports.getProjectRootPath = () => projectRootPath

exports.resetLogger = function () {
  projectRootPath = undefined
  logger = undefined
}
