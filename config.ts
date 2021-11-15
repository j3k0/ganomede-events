'use strict';

import util from 'util';
const bunyan = require('bunyan');
const pkg = require('./package.json');

const parseLogLevel = (envValue) => {
  const defaultLevel = 'INFO';
  const desiredLevel = envValue ? String(envValue).toUpperCase() : defaultLevel;
  const levels = [
    'FATAL',
    'ERROR',
    'WARN',
    'INFO',
    'DEBUG',
    'TRACE'
  ];

  const hasMatch = levels.includes(desiredLevel);
  const level = hasMatch ? desiredLevel : defaultLevel;

  if (!hasMatch) {
    const available = `Please specify one of ${util.inspect(levels)}.`;
    const message = `Uknown log level "${desiredLevel}". ${available}`;
    throw new Error(message);
  }

  return bunyan[level];
};

const parseApiSecret = () => {
  const valid = process.env.hasOwnProperty('API_SECRET')
    && (typeof process.env.API_SECRET === 'string')
    && (process.env.API_SECRET.length > 0);

  if (!valid)
    throw new Error('API_SECRET must be non-empty string');

  return process.env.API_SECRET;
};

export const config = {
  name: 'events',
  logLevel: parseLogLevel(process.env.LOG_LEVEL),
  secret: parseApiSecret(),

  http: {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.hasOwnProperty('PORT')
      ? parseInt(process.env.PORT!, 10)
      : 8000,
    prefix: `/${pkg.api}`
  },

  redis: {
    host: process.env.REDIS_EVENTS_PORT_6379_TCP_ADDR! || 'localhost',
    port: +process.env.REDIS_EVENTS_PORT_6379_TCP_PORT! || 6379
  },

  pollTimeout: +process.env.POLL_TIMEOUT! || 5000
};
