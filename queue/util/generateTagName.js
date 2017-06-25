const uuid = require('uuid')

/**
* Generates a unique tag name to easily identify connections to ActiveMQ
*/
module.exports = function (queueName, type) {
  return `${queueName}-${type}-${uuid.v4()}`
}
