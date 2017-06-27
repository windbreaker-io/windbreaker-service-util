const ManagedConsumer = require('../ManagedConsumer')

module.exports = async function (options) {
  if (!options) {
    throw new Error('Options must be provided for ManagedConsumer')
  }

  // destructure to make args obvious
  const {
    logger,
    amqUrl,
    restart,
    reconnectTimeout,
    consumerOptions,
    onMessage
  } = options

  const managedConsumer = new ManagedConsumer({
    logger,
    amqUrl,
    restart,
    reconnectTimeout,
    consumerOptions,
    onMessage
  })

  // start up consumer
  await managedConsumer.start()

  return managedConsumer
}
