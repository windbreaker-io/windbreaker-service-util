const conflogger = require('conflogger')
const QueueConsumer = require('../QueueConsumer')
const createConnection = require('./createConnection')

const DEFAULT_RECONNECT_TIMEOUT = 5000

function _restartConsumer (createConsumerOptions) {
  const reconnectTimeout = createConsumerOptions.reconnectTimeout || DEFAULT_RECONNECT_TIMEOUT
  const consumerOptions = createConsumerOptions.consumerOptions

  if (consumerOptions) {
    // Dispose of the orignal connection object that was passed, so we can start
    // with a fresh connection
    delete consumerOptions.connection
  }

  setTimeout(async () => {
    try {
      await createConnection(createConsumerOptions)
    } catch (err) {
      throw new Error('Error restarting event consumer', err)
    }
  }, reconnectTimeout)
}

module.exports = async function createConsumer (options) {
  let {
    logger,
    amqUrl,
    onMessage,
    consumerOptions
  } = options || {}

  consumerOptions = consumerOptions || {}

  const amqConnection = await createConnection({
    logger,
    amqUrl,
    connection: consumerOptions.connection
  })

  logger = conflogger.configure(logger)

  const queueName = consumerOptions.queueName

  if (!queueName) {
    throw new Error(`createConsumer is expecting a "queueName" in "consumerOptions"`)
  }

  logger.info(`Attempting to create consumer with queue name "${queueName}"`)

  const consumer = new QueueConsumer(Object.assign({
    connection: amqConnection
  }, consumerOptions))

  consumer.on('message', async (message) => {
    try {
      await onMessage(message)
      // acknowledge the message on success
      await consumer.acknowledgeMessage(message)
    } catch (err) {
      logger.error('Error handling message:', err)

      // reject/requeue message
      await consumer.rejectMessage(message)
    }
  })

  // TODO: Consider allowing external service to handle the following logic.
  // Will other services want to handle this a bit differently?
  const _closeConsumer = async () => {
    await consumer.stop()
    // TODO: Only restart this X number of times before stopping and reporting
    // back to the user that there was a fatal error. Otherwise, we may get stuck
    // in an infinite loop of trying to restart a consumer that will never start.
    _restartConsumer(options)
  }

  const _handleConnectionClosed = (err) => {
    logger.error('Connection error', err)
    _closeConsumer()
  }

  consumer.on('error', async (err) => {
    logger.error('Consumer error', err)
    _closeConsumer()
  })

  amqConnection.on('error', _handleConnectionClosed)
  amqConnection.on('close', _handleConnectionClosed)

  await consumer.start()
  return consumer
}
