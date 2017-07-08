const uuid = require('uuid')

module.exports = require('fashion-model').extend({
  properties: {
    /**
    * Id of the entity being stored in the database
    */
    id: String
  },

  init () {
    if (!this.getId()) {
      this.setId(uuid.v4())
    }
  }
})
