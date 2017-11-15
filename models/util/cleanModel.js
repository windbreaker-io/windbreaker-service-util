const Model = require('fashion-model')

function cleanModel (document) {
  return document && Model.isModel(document)
    ? Model.clean(document)
    : document
}

module.exports = cleanModel
