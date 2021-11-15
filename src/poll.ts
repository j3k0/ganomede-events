'use strict';

import {zeroIfNaN} from './utils';

const createPoll = ({
  pubsub,
  log = require('./logger'),
  pollTimeout = zeroIfNaN(require('../config').pollTimeout),
  setTimeout = global.setTimeout,
  clearTimeout = global.clearTimeout
}) => {

  const logError = (err) => err && log.error(err);

  const listen = (channel, callback) => {

    const done = (err, message) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (handler) {
        pubsub.unsubscribe(channel, handler, logError);
        handler = null;
      }
      if (callback) {
        const cb = callback;
        callback = null;
        cb(err, message);
      }
    };

    const timeout = () => done(null, null);
    let timeoutId : null | ReturnType<typeof setTimeout> = setTimeout(timeout, pollTimeout);
    let handler : null | ((message:any)=>void)  = (message: any) => done(null, message);
    pubsub.subscribe(channel, handler, logError);
  };

  const emit = (channel, message, callback) => {
    pubsub.publish(channel, message, callback);
  };

  return {listen, emit};
};

module.exports = {createPoll};
