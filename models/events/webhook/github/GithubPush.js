const GithubCommit = require('./GithubCommit')

module.exports = require('../../../Model').extend({
  typeName: 'github-push',
  strict: false,
  properties: {
    ref: String,
    before: String,
    after: String,
    created: Boolean,
    deleted: Boolean,
    forced: Boolean,
    base_ref: String,
    compare: String,
    commits: [GithubCommit],
    head_commit: Object,
    repository: Object,
    pusher: Object,
    sender: Object
  }
})
