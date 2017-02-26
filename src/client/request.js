'use strict';

const request = require('request');
const util = require('util');

module.exports = ({apiRoot, secret, agent, clientID}) => ({
  _opts (method, payload, callback) {
    return {
      method,
      uri: apiRoot,
      agent,
      json: true,
      gzip: true,
      [(method === 'get') ? 'qs' : 'body']: payload
    };
  },

  request (method, payload, callback) {
    const data = Object.assign({clientID, secret}, payload);
    request(this._opts(method, data), (err, res, body) => {
      if (err)
        return callback(err);

      if (res.statusCode !== 200) {
        const message = util.format('Http%d: %j', res.statusCode, body);
        return callback(new Error(message));
      }

      callback(null, body);
    });
  },

  get (cursor, callback) {
    this.request('get', cursor.toQuery(), callback);
  },

  post (type, data, callback) {
    const channel = `${clientID}:${type}`;
    const body = {channel, from: clientID, type};

    if (data)
      body.data = data;

    this.request('post', body, callback);
  }
});