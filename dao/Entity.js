const uuid = require('uuid')

module.exports = require('fashion-model').extend({
  properties: {
    /**
    * Id of the entity being stored in the database
    */
    entityId: String
  },

  init () {
    if (!this.getEntityId()) {
      this.setEntityId(uuid.v4())
    }
  },

  prototype: {
    getId () {
      return this.getEntityId()
    },

    setId (id) {
      this.setEntityId(id)
    }
  }
})
