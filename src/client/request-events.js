'use strict';

const request = require('request');
const util = require('util');

module.exports = ({apiRoot, secret, agent, clientID}) => (cursor, callback) => {
  const options = {
    uri: apiRoot,
    method: 'get',
    agent: agent,
    json: true,
    gzip: true,
    qs: Object.assign({secret, clientID}, cursor.toQuery())
  };

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
