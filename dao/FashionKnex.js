const knex = require('knex')
const Model = require('fashion-model/Model')
const conflogger = require('conflogger')
const _getTableName = require('./util/getTableName')

function _clean (document) {
  return Model.isModel(document)
    ? Model.clean(document)
    : document
}

module.exports = class FashionKnex {
  constructor (options) {
    let {
      modelType,
      tableName,
      logger,
      knexConfig
    } = options

    this._logger = conflogger.configure(logger)
    this._modelType = modelType
    this._tableName = tableName || _getTableName(modelType)
    this._knex = knex(knexConfig)
  }

  async insert (data, returning) {
    data = _clean(data)
    returning = returning || '*'

    return this._knex
      .insert(data, 'entityId')
      .into(this._tableName)
      .returning(returning)
  }

  async findById (id, toReturn) {
    const tableName = this._tableName

    toReturn = toReturn || '*'
    let wrapped

    try {
      const result = await this._knex
        .select(toReturn)
        .from(tableName)
        .where('entityId', id)
        .limit(1)

      let errors = []

      wrapped = this._modelType.wrap(result[0], errors)

      if (errors.length) {
        throw new Error(`Error(s) while wrapping model with data "${result[0]}": "${errors}"`)
      }
    } catch (err) {
      this._logger.error(`Error fetching id "${id}" from  table "${tableName}"`, err)
      throw err
    }
    return wrapped
  }

  async destroy () {
    return this._knex.destroy()
  }

  getKnex () {
    return this._knex
  }

  getTableName () {
    return this._tableName
  }
}
