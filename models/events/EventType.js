module.exports = require('../Enum').create({
  values: {
    'github-push': require('./webhook/github/GithubPush'),
    'github-installation': require('./webhook/github/Installation'),
    'dependency-update': require('./dependency/DependencyUpdate')
  }
})
