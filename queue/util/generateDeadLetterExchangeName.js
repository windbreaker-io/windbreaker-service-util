/**
* Generates a dead letter exchange name from a queueName
*/
module.exports = function generateDeadLetterExchangeName (queueName) {
  return `${queueName}-dead-letter-exchange`
}
