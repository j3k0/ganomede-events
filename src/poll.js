( () => {

'use strict'

const pubsub = require('./redis.pubsub')
const utils = require('./utils')


// Constants
const selfProp = 'self'

const invalidTimeout = 'invalid timeout function'
const invalidTrigger = 'invalid trigger function'


const _validHandler = (hndlr) => {
  return typeof hndlr === 'function'
}

const _unsubscribe = (client, channel, subscribed, doUnsubscribe = true) => {
  doUnsubscribe && 
    pubsub.unsubscribe(client, channel, subscribed)
}

const _unsubscribeOnTimeout = (timeout, client, channel, subscribed, callback) => {
  let cb = utils.messageCallback.bind(null, callback)
  _validHandler(timeout) || cb(invalidTimeout)
  timeout(_unsubscribe.bind(null, client, channel, subscribed[selfProp]))
}

const _clear = (client, channel, subscribed, id, doClear = true) => {
  doClear && (() => {
    clearTimeout(id)
    pubsub.unsubscribe(client, channel, subscribed)
  })()
}

const _clearOnTrigger = (trigger, client, subscribed, id, callback, channel, message) => {
  let cb = utils.messageCallback.bind(null, callback)
  _validHandler(trigger) || cb(invalidTrigger)
  trigger(channel, message,
    _clear.bind(null, client, channel, subscribed[selfProp], id))
}

const add = (client, channel, delay, trigger, timeout, callback) => {
  // trigger here is from outside caller
  let subscribed = {}
  let timeoutfunc = _unsubscribeOnTimeout.bind(null, timeout, client, channel, subscribed, callback)
  let dly = utils.zeroIfNaN(delay)
  let id = setTimeout(timeoutfunc, dly)
  let triggerfunc = _clearOnTrigger.bind(null, trigger, client, subscribed, id, callback)
  subscribed[selfProp] = triggerfunc
  pubsub.subscribe(client, channel, triggerfunc, callback)
}

const trigger = (client, channel, message, callback) => {
  pubsub.publish(client, channel, message, callback)
}


module.exports = {
  invalidTimeout,
  invalidTrigger,
  add,
  trigger,
}

})()
