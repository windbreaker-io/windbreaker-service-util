const BaseQueue = require('./BaseQueue')
const generateTagName = require('./util/generateTagName')

module.exports = class QueueConsumer extends BaseQueue {
  constructor ({queueName, connection, prefetchCount, logger}) {
    super({
      queueName,
      connection,
      tag: generateTagName(queueName, 'consumer'),
      logger
    })

    this._prefetchCount = prefetchCount || 10
  }

  async acknowledgeMessage (message) {
    if (!this._channel) {
      throw new Error('Channel not initialized')
    }
    return this._channel.ack(message)
  }

  async rejectMessage (message) {
    if (!this._channel) {
      throw new Error('Channel not initialized')
    }
    // reject message, don't reject all messages,
    // requeue the message
    return this._channel.nack(message, false, true)
  }

  async start () {
    const queueName = this._queueName
    const connection = this._connection
    const tag = this._tag

    this._logger.info(`Initializing consumer "${tag}"`)

    const channel = this._channel = await connection.createChannel()

    // apply prefetch limit for this consumer
    // (this is used to limit the number of "inflight"
    // messages that are being handled at once)
    await channel.prefetch(this._prefetchCount)

    // TODO: other assertions may need ot be done on the queue
    await channel.assertQueue(queueName, {
      durable: true,
      noAck: false
    })

    // NOTE: channel will *only* emit an error if there is a
    // precondition that has failed or if the channel is manually
    // closed via an admin tool
    channel.on('error', (err) => {
      this.emit('error', err)
    })

    this._logger.info(`Starting to consume messages from queue "${queueName}"`)

    // NOTE: a null message is received if a consumer closes
    channel.consume(queueName, (message) => {
      if (message) {
        this.emit('message', message)
      }
    }, { consumerTag: tag })
  }

  getConnection () {
    return this._connection
  }
}
