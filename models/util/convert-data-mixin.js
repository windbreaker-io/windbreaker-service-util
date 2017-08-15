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

      if (Type.data.strict === false) {
        const strictErrors = []
        data = Type.data.wrap(data, strictErrors)

        // TODO: Consider adding an option to enable this behavior. Currently,
        // this should only happen if a webhook event is received from a webhook
        // provider that has changed its payload from exactly what we expect.
        // (e.g. GitHub has added properties to one of its webhook payloads). In
        // this case we do not want to error out.
        if (strictErrors.length) {
          console.warn(`Warning: Errors wrapping model in non-strict mode: ${errors.join(',')}`)
        }
      } else {
        data = Type.data.wrap(data, errors)
      }

      this.setData(data)

      return data
    }
  }
}
