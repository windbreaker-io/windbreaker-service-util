const knex = require('knex')
const Model = require('fashion-model/Model')
const conflogger = require('conflogger')
const _getTableName = require('./util/getTableName')

function _clean (document) {
  return Model.isModel(document)
    ? Model.clean(document)
    : document
}

class FashionKnex {
  constructor (options) {
    let {
      modelType,
      tableName,
      logger,
      knexConnection,
      knexConfig
    } = options

    this._logger = conflogger.configure(logger)
    this._modelType = modelType
    this._tableName = tableName || _getTableName(modelType)
    this._knex = knexConnection || knex(knexConfig)
  }

  async insert (data, returning) {
    data = _clean(data)
    returning = returning || '*'

    let result

    try {
      result = await this._knex
        .insert(data, 'id')
        .into(this._tableName)
        .returning(returning)
    } catch (err) {
      const stringified = JSON.stringify(data)
      this._logger.error(`Error inserting data "${stringified}"`, err)
      throw err
    }
    return result
  }

  async findById (id, toReturn) {
    const tableName = this._tableName

    toReturn = toReturn || '*'
    let wrapped
    let result

    try {
      result = await this._knex
        .select(toReturn)
        .from(tableName)
        .where('id', id)
        .limit(1)
    } catch (err) {
      this._logger.error(`Error fetching id "${id}" from  table "${tableName}"`, err)
      throw err
    }

    let errors = []

    wrapped = this._modelType.wrap(result[0], errors)

    if (errors.length) {
      const stringified = JSON.stringify(result[0])
      throw new Error(`Error(s) while wrapping model with data "${stringified}": "${errors}"`)
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

module.exports = FashionKnex
