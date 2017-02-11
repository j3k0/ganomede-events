( () => {

'use strict'

const logger = require('./logger')

// Callbacks
const loggingCallback = (callback, error, message) => {
  error && logger['error'](error)
  typeof callback === 'function' && callback(error, message)
}

const messageCallback = (callback, error, message) =>
  callback && callback(error, message)

const customCallback = (callback, custom, error) => {
  typeof callback === 'function' && callback(error, custom)
}

// Transforms
const stringToObject = (data) => {
  return typeof data === 'string' ? JSON.parse(data) : data
}

const objectToString = (data) => {
  return typeof data === 'object' ? JSON.stringify(data) : data
}

const zeroIfNaN = (data) => {
  const intdata = parseInt(data)
  return isNaN(intdata) ? 0 : intdata
}

const defaultIfNotFunction = (data, def) => {
  return typeof data === 'function' ? data : def
}

const nopIfNotFunction = (data) => {
  return defaultIfNotFunction(data, () => {})
}

const addOne = (data) =>
  data !== undefined ? zeroIfNaN(data) + 1 : 1

const debug = (func, label) => (...args) => {
  console.log("calling " + (label || func.name) + " with arguments:")
  console.log(args)
  return func.apply(this, args)
}


module.exports = {
  loggingCallback,
  messageCallback,
  customCallback,
  stringToObject,
  objectToString,
  zeroIfNaN,
  defaultIfNotFunction,
  nopIfNotFunction,
  addOne,
  debug
}

})()
