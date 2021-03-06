const conflogger = require('conflogger')
const QueueConsumer = require('../QueueConsumer')
const createConnection = require('./createConnection')
const messageParser = require('./message-parser')

module.exports = async function (options) {
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

  const { queueName } = consumerOptions

  if (!queueName) {
    throw new Error(`createConsumer is expecting a "queueName" in "consumerOptions"`)
  }

  if (!onMessage) {
    throw new Error('createConsumer is expecting a "onMessage" option')
  }

  logger.info(`Attempting to create consumer with queue name "${queueName}"`)

  const consumer = new QueueConsumer(Object.assign({
    connection: amqConnection
  }, consumerOptions))

  consumer.on('message', async (message) => {
    let content

    try {
      content = messageParser.decode(message.content)
    } catch (err) {
      // We should not try to requeue the message if it failed to be decoded
      // because it will never be able to properly decode
      logger.error('Error decoding message: ', err)
      return
    }

    try {
      await onMessage(content)
      // acknowledge the message on success
      await consumer.acknowledgeMessage(message)
    } catch (err) {
      logger.error('Error handling message:', err)

      // TODO: This needs more thought. If a message is continuously failing,
      // we shouldn't keep requeuing
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
  }

  consumer.once('error', async (err) => {
    logger.error('Consumer error', err)
    _closeConsumer()
  })

  amqConnection.once('error', (err) => {
    logger.error('Connection error', err)
    consumer.emit('error', err)
  })

  await consumer.start()

  logger.info(`Consumer "${consumer.getTag()}" is now consuming on queue: ${queueName}`)

  return consumer
}
