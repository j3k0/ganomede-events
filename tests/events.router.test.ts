
import { expect } from 'chai';
import supertest from 'supertest';
import { createServer } from '../src/server';
import redis from 'redis';
import { RedisClient } from 'redis';
import { createEventsRouter } from '../src/events.router';
import { config } from '../config';

(() => {



  describe.skip('events-router', () => {
    const server = createServer(/*{handleUncaughtExceptions: false}*/);

    let redisClient: RedisClient;

    before(done => {
      const retry_strategy = () =>
        new Error('skip-test');
      redisClient = redis.createClient(config.redis.port, config.redis.host, { retry_strategy });
      redisClient.duplicate = () =>
        redisClient = redis.createClient(config.redis.port, config.redis.host, { retry_strategy });
      createEventsRouter(config.http.prefix, server, redisClient);
      redisClient.info((err) => {
        // Connection to redis failed, skipping integration tests.
        if (err && (err as any).origin && (err as any).origin.message === 'skip-test')
          (this as any).skip();
        else
          server.listen(done);
      });
    });

    after(done => {
      redisClient.quit();
      server.close(done);
    });

    const testGet = (url: string, status: number, params: any, done: (r: any) => void, endExpect: (r: any) => void) => {
      return supertest(server)
        .get(url)
        .query({
          secret: params.secret,
          channel: params.channel,
          after: params.afterId
        })
        .expect(status)
        .then((res) => {
          endExpect && endExpect(res);
        }, (err) => {
          expect(err).to.be.null;
        })
        .catch((error) => {
          done(error);
        });
    };

    const testPost = (url: string, status: number, params: any, done: (r: any) => void, endExpect: (r: any) => void) => {
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
        .then((res) => {
          endExpect && endExpect(res);
        }, (err) => {
          expect(err).to.be.null;
        })
        .catch((error) => {
          done(error);
        });
    };

    // request parameters
    const url = `${config.http.prefix}/events`;
    const rightSecret = 'right';
    const wrongSecret = 'wrong';
    const channel1 = 'channel1';
    const channel2 = 'channel2';

    // expectations
    const okStatus = 200;
    const badStatus = 400;
    const unauthStatus = 401;
    const timeoutStatus = 408;

    const typeProperty = 'content-type';
    const jsonType = 'application/json';

    it(`@ ${url}: Invalid POST on ${channel1} - incorrect secret`, (done) => {
      testPost(url, unauthStatus, {
        secret: wrongSecret,
        channel: channel1
      }, done, () => {
        done();
      });
    });

    it(`@ ${url}: Invalid POST on ${channel1} - missing secret`, (done) => {
      testPost(url, badStatus, {
        channel: channel1
      }, done, () => {
        done();
      });
    });

    it(`@ ${url}: Invalid POST - missing channel`, (done) => {
      testPost(url, badStatus, {
        secret: rightSecret
      }, done, () => {
        done();
      });
    });

    it(`@ ${url}: Valid POST on ${channel1}`, (done) => {
      testPost(url, okStatus, {
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
      testGet(url, unauthStatus, {
        secret: wrongSecret,
        channel: channel1
      }, done, () => {
        done();
      });
    });

    it(`@ ${url}: Invalid GET on ${channel1} - missing secret`, (done) => {
      testGet(url, badStatus, {
        channel: channel1
      }, done, () => {
        done();
      });
    });

    it(`@ ${url}: Invalid GET - missing channel`, (done) => {
      testGet(url, badStatus, {
        secret: rightSecret
      }, done, () => {
        done();
      });
    });

    it(`@ ${url}: Valid GET on empty ${channel1}`, (done) => {
      testGet(url, timeoutStatus, {
        secret: rightSecret,
        channel: 'asd'
      }, done, () => {
        done();
      });
    });

    it(`@ ${url}: Valid POST followed by GET on ${channel1}`, (done) => {
      let eventId: number;
      testPost(url, okStatus, {
        secret: rightSecret,
        channel: channel1
      }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.property('id');
        eventId = res.body.id;
        expect(res.body).to.have.property('timestamp');
      }).then(() => {
        return testGet(url, okStatus, {
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
      testPost(url, okStatus, {
        secret: rightSecret,
        channel: channel1
      }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('timestamp');
      }).then(() => {
        return testGet(url, timeoutStatus, {
          secret: rightSecret,
          channel: channel2
        }, done, () => {
          done();
        })
      }
      );
    });

    it(`@ ${url}: 2 Valid POSTs followed by GET on ${channel1}`, (done) => {
      let eventId: number;
      testPost(url, okStatus, {
        secret: rightSecret,
        channel: channel1
      }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.property('id');
        eventId = res.body.id;
        expect(res.body).to.have.property('timestamp');
      }).then(() => {
        return testPost(url, okStatus, {
          secret: rightSecret,
          channel: channel1
        }, done, (res) => {
          expect(res.header).to.have.property(typeProperty)
            .and.have.string(jsonType);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('timestamp');
        });
      }
      ).then(() => {
        testGet(url, okStatus, {
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
      let eventId: number;
      testPost(url, okStatus, {
        secret: rightSecret,
        channel: channel1
      }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.property('id');
        eventId = res.body.id;
        expect(res.body).to.have.property('timestamp');
      }).then(() => {
        testGet(url, timeoutStatus, {
          secret: rightSecret,
          channel: channel1,
          afterId: eventId
        }, done, () => {
          done();
        });
      });
    });

    it(`@ ${url}: 2 Valid POSTs followed by GET on ${channel1} after first added event`, (done) => {
      let eventId: number;
      testPost(url, okStatus, {
        secret: rightSecret,
        channel: channel1
      }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.property('id');
        eventId = res.body.id;
        expect(res.body).to.have.property('timestamp');
      }).then(() => {
        testPost(url, okStatus, {
          secret: rightSecret,
          channel: channel1
        }, done, (res) => {
          expect(res.header).to.have.property(typeProperty)
            .and.have.string(jsonType);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('timestamp');
        });
      }
      ).then(() => {
        testGet(url, okStatus, {
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
      let eventId: number;
      testPost(url, okStatus, {
        secret: rightSecret,
        channel: channel1
      }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.property('id');
        eventId = res.body.id;
        expect(res.body).to.have.property('timestamp');
      }).then(() => {
        return testPost(url, okStatus, {
          secret: rightSecret,
          channel: channel1
        }, done, (res) => {
          expect(res.header).to.have.property(typeProperty)
            .and.have.string(jsonType);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('timestamp');
        });
      }
      ).then(() => {
        return testPost(url, okStatus, {
          secret: rightSecret,
          channel: channel1
        }, done, (res) => {
          expect(res.header).to.have.property(typeProperty)
            .and.have.string(jsonType);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('timestamp');
        });
      }).then(() => {
        testGet(url, okStatus, {
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
      let eventId: number;
      testPost(url, okStatus, {
        secret: rightSecret,
        channel: channel1
      }, done, (res) => {
        expect(res.header).to.have.property(typeProperty)
          .and.have.string(jsonType);
        expect(res.body).to.have.property('id');
        eventId = res.body.id;
        expect(res.body).to.have.property('timestamp');
      }).then(() => {
        testGet(url, okStatus, {
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
        testPost(url, okStatus, {
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

  });

})();