module.exports = require('../../../Model').extend({
  properties: {
    id: String,
    tree_id: String,
    distinct: Boolean,
    message: String,
    timestamp: Date,
    url: String,
    author: Object,
    committer: Object,
    added: [String],
    removed: [String],
    modified: [String]
  }
})
