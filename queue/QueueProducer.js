const tri = require('tri')
const BaseQueue = require('./BaseQueue')
const generateTagName = require('./util/generateTagName')
const messageParser = require('./util/message-parser')

const SEND_MESSAGE_ATTEMPT_OPTIONS = {
  maxAttempts: 10,
  delay: 100,
  factor: 2,
  jitter: true
}

module.exports = class QueueProducer extends BaseQueue {
  constructor ({queueName, connection, prefetchCount, logger}) {
    super({
      queueName,
      connection,
      tag: generateTagName(queueName, 'producer'),
      logger
    })
  }

  async sendMessage (message) {
    try {
      message = messageParser.encode(message)
    } catch (err) {
      throw new Error(`Message "${message}" could not be encoded`, err)
    }

    const queueName = this._queueName
    await tri(async () => {
      return this._channel.sendToQueue(queueName, message)
    }, SEND_MESSAGE_ATTEMPT_OPTIONS)
  }

  async start () {
    const queueName = this._queueName
    const connection = this._connection
    const tag = this._tag

    this._logger.info(`Initializing producer "${tag}"`)

    const channel = this._channel = await connection.createChannel()

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
  }

  getConnection () {
    return this._connection
  }
}
