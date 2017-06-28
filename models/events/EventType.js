module.exports = require('../Enum').create({
  values: {
    'github-push': require('./webhook/github/GithubPush')
  }
})
