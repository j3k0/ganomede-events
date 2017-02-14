'use strict';

const request = require('request');
const util = require('util');

module.exports = (options, callback) => {
  request(options, (err, res, body) => {
    if (err)
      return callback(err);

    if (res.statusCode !== 200) {
      const message = util.format('Http%d: %j', res.statusCode, body);
      return callback(new Error(message));
    }

    callback(null, body);
  });
};
