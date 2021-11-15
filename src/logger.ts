'use strict';

const bunyan = require('bunyan');
import {config} from '../config';

module.exports = bunyan.createLogger({
  level: config.logLevel,
  name: config.name
});
