const ConvertDataMixin = require('../util/convert-data-mixin')

module.exports = require('../Model').extend({
  mixins: [ConvertDataMixin],

  properties: {
    type: require('./EventType'),
    data: Object
  }
})
