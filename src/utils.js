'use strict';

const logger = require('./logger');

const logError = (err, next, type) => {
  type = type || 'error';
  logger[type](err);
  return (next && next(err));
};

const stringToObject = (data) => {
  return (
    (typeof data === 'string') &&
      JSON.parse(data) ||
    data
  );
};

const objectToString = (data) => {
  return (
    (typeof data === 'object') &&
      JSON.stringify(data) ||
    data
  );
};

const objectCheck = (variable, label) => {
  if ((typeof variable !== 'object') ||
      (variable === null)) {
    throw new TypeError(label + ' should be a non-null object');
  };
};

const propertyCheck = (object, property, label) => {
  if (!(property in object)) {
    throw new TypeError(label + ' should have ' + property);
  };
};

const stringCheck = (variable, label) => {
  if (typeof variable !== 'string') {
    throw new TypeError(label + ' should be a string');
  };
};

const stringCheckIfExists = (object, property, label) => {
  if (property in object) {
    stringCheck(object[property], label);
  };
};

const numberCheck = (variable, label) => {
  if ( !((typeof variable === 'number') || 
      (typeof variable === 'string') &&
      (!isNaN(parseInt(variable)))) ) {
    throw new TypeError(label + ' should be a number');
  };
};

const numberCheckIfExists = (object, property, label) => {
  if (property in object) {
    numberCheck(object[property], label);
  };
};

module.exports = {
  logError:             logError,
  stringToObject:       stringToObject,
  objectToString:       objectToString,
  objectCheck:          objectCheck,
  propertyCheck:        propertyCheck,
  stringCheck:          stringCheck,
  stringCheckIfExists:  stringCheckIfExists,
  numberCheck:          numberCheck,
  numberCheckIfExists:  numberCheckIfExists,
};
