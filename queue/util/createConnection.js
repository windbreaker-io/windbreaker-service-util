const amqplib = require('amqplib')
const conflogger = require('conflogger')
const tri = require('tri')

const CONNECTION_ATTEMPT_OPTIONS = {
  maxAttempts: 10,
  delay: 200,
  factor: 2,
  jitter: true
}

module.exports = async function createConnection (options) {
  let {
    logger,
    amqUrl,
    connection
  } = options || {}

  logger = conflogger.configure(logger)

  if (!connection) {
    logger.info(`Attempting to connect to amq ${amqUrl}`)
    try {
      connection = await tri(async function () {
        return amqplib.connect(amqUrl)
      }, CONNECTION_ATTEMPT_OPTIONS)
    } catch (err) {
      throw new Error('Unable to connect to ActiveMQ', err)
    }
  }
  return connection
}
