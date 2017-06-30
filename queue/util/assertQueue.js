/**
 * *USE IN UTIL ONLY*
 *
 * Common assertQueue that will be used by both
 * QueueProducer and QueueConsumer to ensure
 * that the same queues to consume
 * and publish from are created
 */

const generateDeadLetterExchangeName =
  require('./generateDeadLetterExchangeName')

module.exports = async function assertQueue (channel, queueName) {
  const deadLetterExchange = generateDeadLetterExchangeName(queueName)

  await channel.assertQueue(queueName, {
    durable: true,
    noAck: false,
    arguments: {
      'x-dead-letter-exchange': deadLetterExchange
    }
  })
}
