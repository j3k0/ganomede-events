'use strict';

const {expect} = require('chai');
const supertest = require('supertest');
const td = require('testdouble');
const createServer = require('../src/server');
const router = require('../src/events.router');
const config = require('../config');

describe('events-router', () => {
  const server = createServer();

  before(done => {
    router(config.http.prefix, server);
    server.listen(done);
  });

  after(done => server.close(done));

  const testGet = (url, status, params, done, endExpect) => {
    return supertest(server)
      .get(url)
      .query({
        secret: params.secret,
        channel: params.channel,
        after: params.afterId
      })
      .expect(status)
      .then( (res) => {
        endExpect && endExpect(res);
      }, (err) => {
        expect(err).to.be.null;
      })
      .catch( (error) => {
        done(error);
      });
  };

  const testGetTimeout = (url, timeout, params, done, endExpect) => {
    return supertest(server)
      .get(url)
      .query({
        secret: params.secret,
        channel: params.channel,
        after: params.afterId
      })
      .timeout(timeout)
      .then( (res) => {
        expect(res).to.be.null;
      }, (err) => {
        endExpect && endExpect(err);
      })
      .catch( (error) => {
        done(error);
      });
  };

  const testPost = (url, status, params, done, endExpect) => {
    return supertest(server)
      .post(url)
      .send({
        secret: params.secret,
        channel: params.channel,
        from: params.from,
        type: params.type,
        data: params.data
      })
      .expect(status)
      .then( (res) => {
        endExpect && endExpect(res);
      }, (err) => {
        expect(err).to.be.null;
      })
      .catch( (error) => {
        done(error);
      });
  };

  // request parameters
  const url = `${config.http.prefix}/events`;
  const rightSecret = 'right';
  const wrongSecret = 'wrong';  
  const channel1 = 'channel1';
  const channel2 = 'channel2';
  const getTimeout = 500;

  // expectations
  const okStat = 200;
  const badStat = 400;
  const unauthStat = 401;

  const typeProperty = 'content-type';
  const jsonType = 'application/json';

  it(`@ ${url}: Invalid POST on ${channel1} - incorrect secret`, (done) => {
    testPost(url, unauthStat, {
          secret: wrongSecret,
          channel: channel1
        }, done, () => {
      done();
    });
  });

  it(`@ ${url}: Invalid POST on ${channel1} - missing secret`, (done) => {
    testPost(url, badStat, {
          channel: channel1
        }, done, () => {
      done();
    });
  });

  it(`@ ${url}: Invalid POST - missing channel`, (done) => {
    testPost(url, badStat, {
          secret: rightSecret
        }, done, () => {
      done();
    });
  });

  it(`@ ${url}: Valid POST on ${channel1}`, (done) => {
    testPost(url, okStat, {
          secret: rightSecret,
          channel: channel1
        }, done, (res) => {
      expect(res.header).to.have.property(typeProperty)
        .and.have.string(jsonType);
      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('timestamp');
      done();
    });
  });

  it(`@ ${url}: Invalid GET on ${channel1} - incorrect secret`, (done) => {
    testGet(url, unauthStat, {
          secret: wrongSecret,
          channel: channel1
        }, done, () => {
      done();
    });
  });

  it(`@ ${url}: Invalid GET on ${channel1} - missing secret`, (done) => {
    testGet(url, badStat, {
          channel: channel1
        }, done, () => {
      done();
    });
  });

  it(`@ ${url}: Invalid GET - missing channel`, (done) => {
    testGet(url, badStat, {
          secret: rightSecret
        }, done, () => {
      done();
    });
  });
// ToDo: Comment out as soon as store dependency is replaced with testdouble
/*
  it(`@ ${url}: Valid GET on empty ${channel1}`, (done) => {
    testGetTimeout(url, getTimeout, {
          secret: rightSecret,
          channel: channel1
        }, done, () => {
      done();
    });
  });

  it(`@ ${url}: Valid POST followed by GET on ${channel1}`, (done) => {
    let eventId;
    testPost(url, okStat, {
          secret: rightSecret,
          channel: channel1
        }, done, (res) => {
      expect(res.header).to.have.property(typeProperty)
        .and.have.string(jsonType);
      expect(res.body).to.have.property('id');
      eventId = res.body.id;
      expect(res.body).to.have.property('timestamp');
    }).then( () => {
      return testGet(url, okStat, {
            secret: rightSecret,
            channel: channel1,
            afterId: eventId - 1
          }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.lengthOf(1);
        expect(res.body[0]).to.have.property('id', eventId);
        expect(res.body[0]).to.have.property('timestamp');
        done();
      });
    });
  });

  it(`@ ${url}: Valid POST on ${channel1} followed by GET on empty ${channel2}`, (done) => {
    testPost(url, okStat, {
          secret: rightSecret,
          channel: channel1
        }, done, (res) => {
      expect(res.header).to.have.property(typeProperty)
        .and.have.string(jsonType);
      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('timestamp');
    }).then(
      testGetTimeout(url, getTimeout, {
            secret: rightSecret,
            channel: channel2
          }, done, () => {
        done();
      })
    );
  });

  it(`@ ${url}: 2 Valid POSTs followed by GET on ${channel1}`, (done) => {
    let eventId;
    testPost(url, okStat, {
          secret: rightSecret,
          channel: channel1
        }, done, (res) => {
      expect(res.header).to.have.property(typeProperty)
        .and.have.string(jsonType);
      expect(res.body).to.have.property('id');
      eventId = res.body.id;
      expect(res.body).to.have.property('timestamp');
    }).then(
      testPost(url, okStat, {
            secret: rightSecret,
            channel: channel1
          }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('timestamp');
      })
    ).then( () => {
      return testGet(url, okStat, {
            secret: rightSecret,
            channel: channel1,
            afterId: eventId - 1
          }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.lengthOf(2);
        expect(res.body[0]).to.have.property('id', eventId);
        expect(res.body[0]).to.have.property('timestamp');
        expect(res.body[1]).to.have.property('id', eventId + 1);
        expect(res.body[1]).to.have.property('timestamp');
        done();
      });
    });
  });

  it(`@ ${url}: Valid POST followed by GET on ${channel1} after added event`, (done) => {
    let eventId;
    testPost(url, okStat, {
          secret: rightSecret,
          channel: channel1
        }, done, (res) => {
      expect(res.header).to.have.property(typeProperty)
        .and.have.string(jsonType);
      expect(res.body).to.have.property('id');
      eventId = res.body.id;
      expect(res.body).to.have.property('timestamp');
    }).then( () => {
      return testGetTimeout(url, getTimeout, {
            secret: rightSecret,
            channel: channel1,
            afterId: eventId
          }, done, () => {
        done();
      });
    });
  });

  it(`@ ${url}: 2 Valid POSTs followed by GET on ${channel1} after first added event`, (done) => {
    let eventId;
    testPost(url, okStat, {
          secret: rightSecret,
          channel: channel1
        }, done, (res) => {
      expect(res.header).to.have.property(typeProperty)
        .and.have.string(jsonType);
      expect(res.body).to.have.property('id');
      eventId = res.body.id;
      expect(res.body).to.have.property('timestamp');
    }).then(
      testPost(url, okStat, {
            secret: rightSecret,
            channel: channel1
          }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('timestamp');
      })
    ).then( () => {
      return testGet(url, okStat, {
            secret: rightSecret,
            channel: channel1,
            afterId: eventId
          }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.lengthOf(1);
        expect(res.body[0]).to.have.property('id', eventId + 1);
        expect(res.body[0]).to.have.property('timestamp');
        done();
      });
    });
  });

  it(`@ ${url}: 3 Valid POSTs followed by GET on ${channel1} after first added event`, (done) => {
    let eventId;
    testPost(url, okStat, {
          secret: rightSecret,
          channel: channel1
        }, done, (res) => {
      expect(res.header).to.have.property(typeProperty)
        .and.have.string(jsonType);
      expect(res.body).to.have.property('id');
      eventId = res.body.id;
      expect(res.body).to.have.property('timestamp');
    }).then(
      testPost(url, okStat, {
            secret: rightSecret,
            channel: channel1
          }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('timestamp');
      })
    ).then(
      testPost(url, okStat, {
            secret: rightSecret,
            channel: channel1
          }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('timestamp');
      })
    ).then( () => {
      return testGet(url, okStat, {
            secret: rightSecret,
            channel: channel1,
            afterId: eventId
          }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.lengthOf(2);
        expect(res.body[0]).to.have.property('id', eventId + 1);
        expect(res.body[0]).to.have.property('timestamp');
        expect(res.body[1]).to.have.property('id', eventId + 2);
        expect(res.body[1]).to.have.property('timestamp');
        done();
      });
    });
  });

  it(`@ ${url}: Valid GET and then POST before timeout on ${channel1}`, (done) => {
    let eventId;
    testPost(url, okStat, {
          secret: rightSecret,
          channel: channel1
        }, done, (res) => {
      expect(res.header).to.have.property(typeProperty)
        .and.have.string(jsonType);
      expect(res.body).to.have.property('id');
      eventId = res.body.id;
      expect(res.body).to.have.property('timestamp');
    }).then( () => {
      return testGet(url, okStat, {
            secret: rightSecret,
            channel: channel1,
            afterId: eventId
          }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.lengthOf(1);
        expect(res.body[0]).to.have.property('id', eventId + 1);
        expect(res.body[0]).to.have.property('timestamp');
        done();
      });
      testPost(url, okStat, {
            secret: rightSecret,
            channel: channel1
          }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('timestamp');
      });
    });
  });
*/
});
