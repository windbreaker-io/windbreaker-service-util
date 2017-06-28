module.exports = {
  id: 'convert-data',

  initType (Type) {
    Type.prototype.convertData = function (errors) {
      let data = this.getData() || {}
      const Type = this.getType()

      if (!Type) {
        if (errors) {
          errors.push(new Error('Converting data requires a "type" property'))
        }
        return
      }

      if (data.constructor === String) {
        try {
          data = JSON.parse(data)
        } catch (err) {
          if (errors) {
            errors.push(new Error(`Could not parse data "${data}"`, err))
          }
          return
        }
      }

      data = Type.data.wrap(data, errors)
      this.setData(data)

      return data
    }
  }
}
