const conflogger = require('conflogger')
const QueueProducer = require('../QueueProducer')
const createConnection = require('./createConnection')

module.exports = async function createProducer (options) {
  let {
    logger,
    amqUrl,
    producerOptions
  } = options || {}

  const queueName = producerOptions && producerOptions.queueName

  if (!queueName) {
    throw new Error(`createConsumer is expecting a "queueName" in "producerOptions"`)
  }

  const amqConnection = await createConnection({
    logger,
    amqUrl,
    connection: producerOptions.connection
  })

  logger = conflogger.configure(logger)

  logger.info(`Attempting to create producer with queue name "${queueName}"`)

  const producer = new QueueProducer(Object.assign({
    connection: amqConnection
  }, producerOptions))

  amqConnection.on('error', (err) => {
    producer.emit('error', err)
  })

  await producer.start()
  return producer
}
