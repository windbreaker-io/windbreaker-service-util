const Model = require('../Model')

/**
* Used for returning an array with models that are all cleaned
*/
module.exports = function getCleanArray (arr) {
  let cleaned = []
  arr.forEach((node) => {
    if (Model.isModel(node)) {
      cleaned.push(node.clean())
    } else {
      cleaned.push(node)
    }
  })
  return cleaned
}
