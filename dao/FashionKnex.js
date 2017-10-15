const knex = require('knex')
const Model = require('fashion-model/Model')
const conflogger = require('conflogger')
const _getTableName = require('./util/getTableName')
const getCleanArray = require('../models/util/getCleanArray')

function _clean (document) {
  return document && Model.isModel(document)
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

    knexConfig = _clean(knexConfig)

    this._logger = conflogger.configure(logger)
    this._modelType = modelType
    this._tableName = tableName || _getTableName(modelType)
    this._knex = knexConnection || knex(knexConfig)
  }

  /**
   * TODO: replace with https://github.com/tgriesser/knex/pull/2197 after new
   * and improved implementation is submitted
   * Ref: https://gist.github.com/plurch/118721c2216f77640232
   * http://www.postgresql.org/docs/9.5/static/sql-insert.html
   */
  async upsert (data, {conflictColumn = 'id', returning = '*'} = {}) {
    data = _clean(data)

    const insertString = this._knex
      .insert(data)
      .into(this._tableName)
      .toString()
    const conflictString = this._knex.raw(` ON CONFLICT (??) DO NOTHING`,
      conflictColumn).toString()
    const query = (insertString + conflictString + ` RETURNING ${returning}`)
      .replace(/\?/g, '\\?')

    try {
      const result = await this._knex.raw(query)
      return result.rows[0] // undefined if row already exists in table
    } catch (err) {
      this._logger.error('Error during upsert', err)
      throw err
    }
  }

  async batchInsert (data, {returning = '*'} = {}) {
    const dataArray = getCleanArray(data)

    return this._knex
      .batchInsert(this._tableName, dataArray)
      .returning(returning)
      .catch(err => {
        this._logger.error('Error during batch insert', err)
        throw err
      })
  }

  async insert (data, {returning = '*'} = {}) {
    data = _clean(data)

    return this._knex
      .insert(data, 'id')
      .into(this._tableName)
      .returning(returning)
      .catch((err) => {
        this._logger.error(`Error inserting data "${JSON.stringify(data)}"`, err)
        throw err
      })
  }

  async findById (id, {select = '*'} = {}) {
    const tableName = this._tableName

    let wrapped
    let result

    try {
      result = await this._knex
        .select(select)
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

  async deleteById (id) {
    const deleteResponse = await this._knex(this._tableName)
      .del()
      .where('id', id)

    if (deleteResponse === 0) {
      throw new Error(`Could not delete object with id "${id}" because it does not exist`)
    }

    return deleteResponse
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
