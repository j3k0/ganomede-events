'use strict';

var buff = {};

// ToDo: (1) Implement polling.
// ToDo: (2) Use Redis.

const sendEvents = (req, res, next) => {
  if (!('secret' in req.params) ||
      !('channel' in req.params) ||
      req.params.secret !== process.env.API_SECRET) {
    res.status(401);
    res.end();
  } else {
    res.header('Content-Type', 'application/json; charset=UTF-8');
    let chan = req.params.channel;
    let full = buff[chan];
    if (typeof full === 'undefined') {
      full = [];
    }
    let begin = 0;
    if ('after' in req.params) {
      begin = parseInt(req.params.after) + 1;
    }
    let len = full.length;
    let data = full.slice(begin, len);
    if (data.length === 0) {
      setTimeout(() => { res.end(data) }, 1000);
    } else {
      res.end(JSON.stringify(data));
    }
  }
  buff = {};
  next();
};

const getEvents = (req, res, next) => {
  res.header('Content-Type', 'application/json; charset=UTF-8');
  if ('channel' in req.params &&
      'secret' in req.params &&
      req.params.secret === process.env.API_SECRET) {
    let chan = req.params.channel;
    let len = 0;
    if (typeof buff[chan] === 'undefined') {
      buff[chan] = [];
    } else {
      len = buff[chan].length;
    }
    let ret = {
      id: len,
      timestamp: new Date(),
    }
    buff[chan][len] = ret;
    buff[chan][len].from = req.params.from;
    buff[chan][len].type = req.params.type;
    buff[chan][len].data = req.params.data;
    res.end(JSON.stringify(ret));
  }
  else {
    res.status(401);
    res.end();
  }
  next();
};

module.exports = (prefix, server) => {
  server.get(`${prefix}/events`, sendEvents);
  server.post(`${prefix}/events`, getEvents);
};
