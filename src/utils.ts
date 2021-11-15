'use strict';

  const logger = require('./logger');

// Callbacks
  export const loggingCallback = (callback, error, message) => {
    error && logger['error'](error);
    typeof callback === 'function' && callback(error, message);
  };

  export const messageCallback = (callback, error, message) =>
  callback && callback(error, message);

  export const customCallback = (callback, custom, error) => {
    typeof callback === 'function' && callback(error, custom);
  };

// Transforms
  export const stringToObject = (data) => {
    return typeof data === 'string' ? JSON.parse(data) : data;
  };

  export const objectToString = (data) => {
    return typeof data === 'object' ? JSON.stringify(data) : data;
  };

  export const zeroIfNaN = (data) => {
    const intdata = parseInt(data);
    return isNaN(intdata) ? 0 : intdata;
  };

  export const defaultIfNotFunction = (data, def) => {
    return typeof data === 'function' ? data : def;
  };

  export const nopIfNotFunction = (data) => {
    return defaultIfNotFunction(data, () => {});
  };

  export const addOne = (data) => {
    return data !== undefined ? zeroIfNaN(data) + 1 : 1;
  };

  export const debug = (func, label) => (...args) => {
    /* eslint-disable no-console */
    console.log('calling ' + (label || func.name) + ' with arguments:');
    console.log(args); 
    /* eslint-enable no-console */
    return func.apply(this, args);
  };

