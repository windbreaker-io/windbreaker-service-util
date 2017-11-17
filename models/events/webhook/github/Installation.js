const Model = require('../../../Model')
const Action = require('./InstallationAction')

// TODO: trim this down. Possibly abstract if other repo flows allow it.
const Installation = Model.extend({
  properties: {
    id: Number,
    account: Object,
    repository_selection: String,
    access_tokens_url: String,
    repositories_url: String,
    html_url: String,
    app_id: Number,
    target_id: Number,
    target_type: String,
    permissions: Object,
    events: [ String ],
    created_at: Number,
    updated_at: Number,
    single_file_name: String
  }
})

const Repository = Model.extend({
  properties: {
    id: Number,
    name: String,
    full_name: String
  }
})

const InstallationEvent = Model.extend({
  typeName: 'github-installation',
  strict: false,
  properties: {
    action: Action,
    installation: Installation,
    // not present if installation is being deleted
    repositories: [ Repository ],
    sender: Object
  }
})

module.exports = InstallationEvent
