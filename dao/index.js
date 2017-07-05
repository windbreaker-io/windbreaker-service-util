const FashionKnex = require('./FashionKnex')

exports.createDaoHelper = function (options) {
  return new FashionKnex(options)
}
