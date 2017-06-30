const BaseQueue = require('./BaseQueue')
const generateTagName = require('./util/generateTagName')
const assertQueue = require('./util/assertQueue')

const DEFAULT_PREFETCH_COUNT = 10
const DEFAULT_MAX_MESSAGE_REJECTIONS = 5
const DEAD_LETTER_HEADER = 'x-death'

const FANOUT = 'fanout'
const REQUEUE_MESSAGE = true
const REJECT_ALL_MESSAGES = true

const REJECTED_REASON = 'rejected'

module.exports = class QueueConsumer extends BaseQueue {
  constructor (options) {
    const {
      queueName,
      connection,
      prefetchCount,
      logger,
      maxMessageRejections,
      deadLetterQueueName
    } = options

    super({
      queueName,
      connection,
      tag: generateTagName(queueName, 'consumer'),
      logger
    })

    this._prefetchCount = prefetchCount || DEFAULT_PREFETCH_COUNT
    this._deadLetterExchangeName = `${queueName}-dead-letter-exchange`

    this._deadLetterQueueName = deadLetterQueueName ||
      `${queueName}-dead-letter-queue`

    this._maxMessageRejections = Number.isInteger(maxMessageRejections)
      ? maxMessageRejections
      : DEFAULT_MAX_MESSAGE_REJECTIONS
  }

  getDeadLetterQueueName () {
    return this._deadLetterQueueName
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

    const messageContent = message.content

    const maxMessageRejections = this._maxMessageRejections
    const queueName = this.getQueueName()
    const deadLetterQueueName = this.getDeadLetterQueueName()

    const { headers } = message.properties
    const deadLetterHeader = headers[DEAD_LETTER_HEADER]

    let rejectedRecord
    if (deadLetterHeader) {
      // find 'rejected' record
      // TODO: handle other reasons in the future
      // ex. dead letter messages from TTL expires (not implemented yet)
      for (const record of deadLetterHeader) {
        const { queue, reason } = record
        if (queue === queueName && reason === REJECTED_REASON) {
          rejectedRecord = record
          break
        }
      }
    }

    if (rejectedRecord) {
      // get the number of times this message has been attempted
      const rejectionCount = rejectedRecord.count

      if (rejectionCount < maxMessageRejections) {
        // send to dead letter exchange again
        return this._channel.nack(message, !REJECT_ALL_MESSAGES, !REQUEUE_MESSAGE)
      }

      // otherwise...
      // publish to dead letter queue to be handled later
      await this._channel.sendToQueue(deadLetterQueueName, messageContent)

      // acknowledge message so it doesn't show up on
      // queue again
      return this._channel.ack(message)
    }

    // reject message, don't reject all messages,
    // and don't requeue it in the main queue
    // (this will move the message over to the dead letter exchange
    // and will cause the message to be handled by instances of this
    // consumer again)
    return this._channel.nack(message, !REJECT_ALL_MESSAGES, !REQUEUE_MESSAGE)
  }

  async start () {
    const queueName = this._queueName
    const deadLetterQueueName = this._deadLetterQueueName
    const deadLetterExchangeName = this._deadLetterExchangeName
    const connection = this._connection
    const tag = this._tag

    this._logger.info(`Initializing consumer "${tag}"`)

    const channel = this._channel = await connection.createChannel()

    // apply prefetch limit for this consumer
    // (this is used to limit the number of "inflight"
    // messages that are being handled at once)
    await channel.prefetch(this._prefetchCount)

    // create exchange for dead letter exchange,
    // we specify the "fanout" so that messages published to
    // this exchange sent to all queues that are bound
    // to the exchange.
    //
    // In this case, we only have a single queue to listening
    // for this exchange
    await channel.assertExchange(deadLetterExchangeName, FANOUT)

    // assert the main queue to consume from
    await assertQueue(channel, queueName)

    // create dead letter queue to store messages that will
    // be analyzed later
    //
    // (use regular assert queue here since this is unique to consumer)
    await channel.assertQueue(deadLetterQueueName, {
      durable: true,
      noAck: false
    })

    // bind the queue and the dead letter exchange together
    await channel.bindQueue(queueName, deadLetterExchangeName, 'key')

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
