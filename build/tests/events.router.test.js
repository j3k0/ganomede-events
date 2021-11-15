'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../src/server");
const redis_1 = __importDefault(require("redis"));
(() => {
    const router = require('../src/events.router');
    const config = require('../config');
    describe.skip('events-router', () => {
        const server = (0, server_1.createServer)( /*{handleUncaughtExceptions: false}*/);
        let redisClient;
        before(done => {
            const retry_strategy = (options) => new Error('skip-test');
            redisClient = redis_1.default.createClient(config.redis.port, config.redis.host, { retry_strategy });
            redisClient.duplicate = () => redisClient = redis_1.default.createClient(config.redis.port, config.redis.host, { retry_strategy });
            router(config.http.prefix, server, redisClient);
            redisClient.info((err) => {
                // Connection to redis failed, skipping integration tests.
                if (err && err.origin && err.origin.message === 'skip-test')
                    this.skip();
                else
                    server.listen(done);
            });
        });
        after(done => {
            redisClient.quit();
            server.close(done);
        });
        const testGet = (url, status, params, done, endExpect) => {
            return (0, supertest_1.default)(server)
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
                (0, chai_1.expect)(err).to.be.null;
            })
                .catch((error) => {
                done(error);
            });
        };
        const testPost = (url, status, params, done, endExpect) => {
            return (0, supertest_1.default)(server)
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
                (0, chai_1.expect)(err).to.be.null;
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
                (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                    .and.have.string(jsonType);
                (0, chai_1.expect)(res.body).to.have.property('id');
                (0, chai_1.expect)(res.body).to.have.property('timestamp');
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
            let eventId;
            testPost(url, okStatus, {
                secret: rightSecret,
                channel: channel1
            }, done, (res) => {
                (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                    .and.have.string(jsonType);
                (0, chai_1.expect)(res.body).to.have.property('id');
                eventId = res.body.id;
                (0, chai_1.expect)(res.body).to.have.property('timestamp');
            }).then(() => {
                return testGet(url, okStatus, {
                    secret: rightSecret,
                    channel: channel1,
                    afterId: eventId - 1
                }, done, (res) => {
                    (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                        .and.have.string(jsonType);
                    (0, chai_1.expect)(res.body).to.have.lengthOf(1);
                    (0, chai_1.expect)(res.body[0]).to.have.property('id', eventId);
                    (0, chai_1.expect)(res.body[0]).to.have.property('timestamp');
                    done();
                });
            });
        });
        it(`@ ${url}: Valid POST on ${channel1} followed by GET on empty ${channel2}`, (done) => {
            testPost(url, okStatus, {
                secret: rightSecret,
                channel: channel1
            }, done, (res) => {
                (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                    .and.have.string(jsonType);
                (0, chai_1.expect)(res.body).to.have.property('id');
                (0, chai_1.expect)(res.body).to.have.property('timestamp');
            }).then(() => {
                return testGet(url, timeoutStatus, {
                    secret: rightSecret,
                    channel: channel2
                }, done, () => {
                    done();
                });
            });
        });
        it(`@ ${url}: 2 Valid POSTs followed by GET on ${channel1}`, (done) => {
            let eventId;
            testPost(url, okStatus, {
                secret: rightSecret,
                channel: channel1
            }, done, (res) => {
                (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                    .and.have.string(jsonType);
                (0, chai_1.expect)(res.body).to.have.property('id');
                eventId = res.body.id;
                (0, chai_1.expect)(res.body).to.have.property('timestamp');
            }).then(() => {
                return testPost(url, okStatus, {
                    secret: rightSecret,
                    channel: channel1
                }, done, (res) => {
                    (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                        .and.have.string(jsonType);
                    (0, chai_1.expect)(res.body).to.have.property('id');
                    (0, chai_1.expect)(res.body).to.have.property('timestamp');
                });
            }).then(() => {
                testGet(url, okStatus, {
                    secret: rightSecret,
                    channel: channel1,
                    afterId: eventId - 1
                }, done, (res) => {
                    (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                        .and.have.string(jsonType);
                    (0, chai_1.expect)(res.body).to.have.lengthOf(2);
                    (0, chai_1.expect)(res.body[0]).to.have.property('id', eventId);
                    (0, chai_1.expect)(res.body[0]).to.have.property('timestamp');
                    (0, chai_1.expect)(res.body[1]).to.have.property('id', eventId + 1);
                    (0, chai_1.expect)(res.body[1]).to.have.property('timestamp');
                    done();
                });
            });
        });
        it(`@ ${url}: Valid POST followed by GET on ${channel1} after added event`, (done) => {
            let eventId;
            testPost(url, okStatus, {
                secret: rightSecret,
                channel: channel1
            }, done, (res) => {
                (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                    .and.have.string(jsonType);
                (0, chai_1.expect)(res.body).to.have.property('id');
                eventId = res.body.id;
                (0, chai_1.expect)(res.body).to.have.property('timestamp');
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
            let eventId;
            testPost(url, okStatus, {
                secret: rightSecret,
                channel: channel1
            }, done, (res) => {
                (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                    .and.have.string(jsonType);
                (0, chai_1.expect)(res.body).to.have.property('id');
                eventId = res.body.id;
                (0, chai_1.expect)(res.body).to.have.property('timestamp');
            }).then(() => {
                testPost(url, okStatus, {
                    secret: rightSecret,
                    channel: channel1
                }, done, (res) => {
                    (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                        .and.have.string(jsonType);
                    (0, chai_1.expect)(res.body).to.have.property('id');
                    (0, chai_1.expect)(res.body).to.have.property('timestamp');
                });
            }).then(() => {
                testGet(url, okStatus, {
                    secret: rightSecret,
                    channel: channel1,
                    afterId: eventId
                }, done, (res) => {
                    (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                        .and.have.string(jsonType);
                    (0, chai_1.expect)(res.body).to.have.lengthOf(1);
                    (0, chai_1.expect)(res.body[0]).to.have.property('id', eventId + 1);
                    (0, chai_1.expect)(res.body[0]).to.have.property('timestamp');
                    done();
                });
            });
        });
        it(`@ ${url}: 3 Valid POSTs followed by GET on ${channel1} after first added event`, (done) => {
            let eventId;
            testPost(url, okStatus, {
                secret: rightSecret,
                channel: channel1
            }, done, (res) => {
                (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                    .and.have.string(jsonType);
                (0, chai_1.expect)(res.body).to.have.property('id');
                eventId = res.body.id;
                (0, chai_1.expect)(res.body).to.have.property('timestamp');
            }).then(() => {
                return testPost(url, okStatus, {
                    secret: rightSecret,
                    channel: channel1
                }, done, (res) => {
                    (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                        .and.have.string(jsonType);
                    (0, chai_1.expect)(res.body).to.have.property('id');
                    (0, chai_1.expect)(res.body).to.have.property('timestamp');
                });
            }).then(() => {
                return testPost(url, okStatus, {
                    secret: rightSecret,
                    channel: channel1
                }, done, (res) => {
                    (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                        .and.have.string(jsonType);
                    (0, chai_1.expect)(res.body).to.have.property('id');
                    (0, chai_1.expect)(res.body).to.have.property('timestamp');
                });
            }).then(() => {
                testGet(url, okStatus, {
                    secret: rightSecret,
                    channel: channel1,
                    afterId: eventId
                }, done, (res) => {
                    (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                        .and.have.string(jsonType);
                    (0, chai_1.expect)(res.body).to.have.lengthOf(2);
                    (0, chai_1.expect)(res.body[0]).to.have.property('id', eventId + 1);
                    (0, chai_1.expect)(res.body[0]).to.have.property('timestamp');
                    (0, chai_1.expect)(res.body[1]).to.have.property('id', eventId + 2);
                    (0, chai_1.expect)(res.body[1]).to.have.property('timestamp');
                    done();
                });
            });
        });
        it(`@ ${url}: Valid GET and then POST before timeout on ${channel1}`, (done) => {
            let eventId;
            testPost(url, okStatus, {
                secret: rightSecret,
                channel: channel1
            }, done, (res) => {
                (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                    .and.have.string(jsonType);
                (0, chai_1.expect)(res.body).to.have.property('id');
                eventId = res.body.id;
                (0, chai_1.expect)(res.body).to.have.property('timestamp');
            }).then(() => {
                testGet(url, okStatus, {
                    secret: rightSecret,
                    channel: channel1,
                    afterId: eventId
                }, done, (res) => {
                    (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                        .and.have.string(jsonType);
                    (0, chai_1.expect)(res.body).to.have.lengthOf(1);
                    (0, chai_1.expect)(res.body[0]).to.have.property('id', eventId + 1);
                    (0, chai_1.expect)(res.body[0]).to.have.property('timestamp');
                    done();
                });
                testPost(url, okStatus, {
                    secret: rightSecret,
                    channel: channel1
                }, done, (res) => {
                    (0, chai_1.expect)(res.header).to.have.property(typeProperty)
                        .and.have.string(jsonType);
                    (0, chai_1.expect)(res.body).to.have.property('id');
                    (0, chai_1.expect)(res.body).to.have.property('timestamp');
                });
            });
        });
    });
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLnJvdXRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdHMvZXZlbnRzLnJvdXRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7QUFHYiwrQkFBNEI7QUFDNUIsMERBQWtDO0FBQ2xDLDBDQUEyQztBQUMzQyxrREFBMEI7QUFFMUIsQ0FBQyxHQUFHLEVBQUU7SUFFSixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUMvQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFcEMsUUFBUSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBQ2xDLE1BQU0sTUFBTSxHQUFHLElBQUEscUJBQVksR0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1FBRW5FLElBQUksV0FBVyxDQUFDO1FBRWhCLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNaLE1BQU0sY0FBYyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FDakMsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDekIsV0FBVyxHQUFHLGVBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBQyxjQUFjLEVBQUMsQ0FBQyxDQUFDO1lBQ3pGLFdBQVcsQ0FBQyxTQUFTLEdBQUcsR0FBRyxFQUFFLENBQzNCLFdBQVcsR0FBRyxlQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUMsY0FBYyxFQUFDLENBQUMsQ0FBQztZQUMzRixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2hELFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDdkIsMERBQTBEO2dCQUMxRCxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxLQUFLLFdBQVc7b0JBQ3hELElBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7b0JBRXJCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNYLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuQixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxPQUFPLEdBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUU7WUFDeEQsT0FBTyxJQUFBLG1CQUFTLEVBQUMsTUFBTSxDQUFDO2lCQUN2QixHQUFHLENBQUMsR0FBRyxDQUFDO2lCQUNSLEtBQUssQ0FBQztnQkFDTCxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07Z0JBQ3JCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTztnQkFDdkIsS0FBSyxFQUFFLE1BQU0sQ0FBQyxPQUFPO2FBQ3RCLENBQUM7aUJBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztpQkFDZCxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDWixTQUFTLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNULElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQ3pCLENBQUMsQ0FBQztpQkFDRCxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDZixJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDZCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztRQUVGLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFO1lBQ3hELE9BQU8sSUFBQSxtQkFBUyxFQUFDLE1BQU0sQ0FBQztpQkFDdkIsSUFBSSxDQUFDLEdBQUcsQ0FBQztpQkFDVCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO2dCQUNyQixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87Z0JBQ3ZCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtnQkFDakIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO2dCQUNqQixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7YUFDbEIsQ0FBQztpQkFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO2lCQUNkLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNaLFNBQVMsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDOUIsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ1QsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7WUFDekIsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNmLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBRUoscUJBQXFCO1FBQ25CLE1BQU0sR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLFNBQVMsQ0FBQztRQUMzQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7UUFDNUIsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDO1FBQzVCLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQztRQUM1QixNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUM7UUFFOUIsZUFBZTtRQUNiLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQztRQUNyQixNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUM7UUFDdEIsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDO1FBQ3pCLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQztRQUUxQixNQUFNLFlBQVksR0FBRyxjQUFjLENBQUM7UUFDcEMsTUFBTSxRQUFRLEdBQUcsa0JBQWtCLENBQUM7UUFFcEMsRUFBRSxDQUFDLEtBQUssR0FBRyxxQkFBcUIsUUFBUSxxQkFBcUIsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3RFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFO2dCQUMxQixNQUFNLEVBQUUsV0FBVztnQkFDbkIsT0FBTyxFQUFFLFFBQVE7YUFDbEIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNaLElBQUksRUFBRSxDQUFDO1lBQ1QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxLQUFLLEdBQUcscUJBQXFCLFFBQVEsbUJBQW1CLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNwRSxRQUFRLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtnQkFDdkIsT0FBTyxFQUFFLFFBQVE7YUFDbEIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNaLElBQUksRUFBRSxDQUFDO1lBQ1QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxLQUFLLEdBQUcsa0NBQWtDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUN0RCxRQUFRLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtnQkFDdkIsTUFBTSxFQUFFLFdBQVc7YUFDcEIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNaLElBQUksRUFBRSxDQUFDO1lBQ1QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxLQUFLLEdBQUcsbUJBQW1CLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDakQsUUFBUSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUU7Z0JBQ3RCLE1BQU0sRUFBRSxXQUFXO2dCQUNuQixPQUFPLEVBQUUsUUFBUTthQUNsQixFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNmLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7cUJBQ2hELEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3hDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxFQUFFLENBQUM7WUFDVCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLEtBQUssR0FBRyxvQkFBb0IsUUFBUSxxQkFBcUIsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3JFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFO2dCQUN6QixNQUFNLEVBQUUsV0FBVztnQkFDbkIsT0FBTyxFQUFFLFFBQVE7YUFDbEIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNaLElBQUksRUFBRSxDQUFDO1lBQ1QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxLQUFLLEdBQUcsb0JBQW9CLFFBQVEsbUJBQW1CLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNuRSxPQUFPLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtnQkFDdEIsT0FBTyxFQUFFLFFBQVE7YUFDbEIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNaLElBQUksRUFBRSxDQUFDO1lBQ1QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxLQUFLLEdBQUcsaUNBQWlDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNyRCxPQUFPLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtnQkFDdEIsTUFBTSxFQUFFLFdBQVc7YUFDcEIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNaLElBQUksRUFBRSxDQUFDO1lBQ1QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxLQUFLLEdBQUcsd0JBQXdCLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDdEQsT0FBTyxDQUFDLEdBQUcsRUFBRSxhQUFhLEVBQUU7Z0JBQzFCLE1BQU0sRUFBRSxXQUFXO2dCQUNuQixPQUFPLEVBQUUsS0FBSzthQUNmLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRTtnQkFDWixJQUFJLEVBQUUsQ0FBQztZQUNULENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsS0FBSyxHQUFHLG1DQUFtQyxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ2pFLElBQUksT0FBTyxDQUFDO1lBQ1osUUFBUSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUU7Z0JBQ3RCLE1BQU0sRUFBRSxXQUFXO2dCQUNuQixPQUFPLEVBQUUsUUFBUTthQUNsQixFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNmLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7cUJBQ2hELEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3hDLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2pELENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ1gsT0FBTyxPQUFPLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRTtvQkFDNUIsTUFBTSxFQUFFLFdBQVc7b0JBQ25CLE9BQU8sRUFBRSxRQUFRO29CQUNqQixPQUFPLEVBQUUsT0FBTyxHQUFHLENBQUM7aUJBQ3JCLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7b0JBQ2YsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQzt5QkFDaEQsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQzNCLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDcEQsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUNsRCxJQUFJLEVBQUUsQ0FBQztnQkFDVCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsS0FBSyxHQUFHLG1CQUFtQixRQUFRLDZCQUE2QixRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3RGLFFBQVEsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFO2dCQUN0QixNQUFNLEVBQUUsV0FBVztnQkFDbkIsT0FBTyxFQUFFLFFBQVE7YUFDbEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDZixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO3FCQUNoRCxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0IsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN4QyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDWCxPQUFPLE9BQU8sQ0FBQyxHQUFHLEVBQUUsYUFBYSxFQUFFO29CQUNqQyxNQUFNLEVBQUUsV0FBVztvQkFDbkIsT0FBTyxFQUFFLFFBQVE7aUJBQ2xCLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRTtvQkFDWixJQUFJLEVBQUUsQ0FBQztnQkFDVCxDQUFDLENBQUMsQ0FBQTtZQUNKLENBQUMsQ0FDRixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsS0FBSyxHQUFHLHNDQUFzQyxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3BFLElBQUksT0FBTyxDQUFDO1lBQ1osUUFBUSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUU7Z0JBQ3RCLE1BQU0sRUFBRSxXQUFXO2dCQUNuQixPQUFPLEVBQUUsUUFBUTthQUNsQixFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNmLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7cUJBQ2hELEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3hDLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2pELENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ1gsT0FBUSxRQUFRLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRTtvQkFDOUIsTUFBTSxFQUFFLFdBQVc7b0JBQ25CLE9BQU8sRUFBRSxRQUFRO2lCQUNsQixFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO29CQUNmLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7eUJBQzlDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUM3QixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3hDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDakQsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQ0YsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNWLE9BQU8sQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFO29CQUNyQixNQUFNLEVBQUUsV0FBVztvQkFDbkIsT0FBTyxFQUFFLFFBQVE7b0JBQ2pCLE9BQU8sRUFBRSxPQUFPLEdBQUcsQ0FBQztpQkFDckIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtvQkFDZixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO3lCQUM5QyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDN0IsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUNwRCxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ2xELElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN4RCxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ2xELElBQUksRUFBRSxDQUFDO2dCQUNULENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxLQUFLLEdBQUcsbUNBQW1DLFFBQVEsb0JBQW9CLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNuRixJQUFJLE9BQU8sQ0FBQztZQUNaLFFBQVEsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFO2dCQUN0QixNQUFNLEVBQUUsV0FBVztnQkFDbkIsT0FBTyxFQUFFLFFBQVE7YUFDbEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDZixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO3FCQUNoRCxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0IsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN4QyxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3RCLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNqRCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNYLE9BQU8sQ0FBQyxHQUFHLEVBQUUsYUFBYSxFQUFFO29CQUMxQixNQUFNLEVBQUUsV0FBVztvQkFDbkIsT0FBTyxFQUFFLFFBQVE7b0JBQ2pCLE9BQU8sRUFBRSxPQUFPO2lCQUNqQixFQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7b0JBQ1osSUFBSSxFQUFFLENBQUM7Z0JBQ1QsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLEtBQUssR0FBRyxzQ0FBc0MsUUFBUSwwQkFBMEIsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQzVGLElBQUksT0FBTyxDQUFDO1lBQ1osUUFBUSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUU7Z0JBQ3RCLE1BQU0sRUFBRSxXQUFXO2dCQUNuQixPQUFPLEVBQUUsUUFBUTthQUNsQixFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNmLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7cUJBQ2hELEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3hDLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2pELENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ1gsUUFBUSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUU7b0JBQ3RCLE1BQU0sRUFBRSxXQUFXO29CQUNuQixPQUFPLEVBQUUsUUFBUTtpQkFDbEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtvQkFDZixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO3lCQUM5QyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDN0IsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN4QyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ2pELENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUNGLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVixPQUFPLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRTtvQkFDckIsTUFBTSxFQUFFLFdBQVc7b0JBQ25CLE9BQU8sRUFBRSxRQUFRO29CQUNqQixPQUFPLEVBQUUsT0FBTztpQkFDakIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtvQkFDZixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO3lCQUM5QyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDN0IsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDeEQsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUNsRCxJQUFJLEVBQUUsQ0FBQztnQkFDVCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsS0FBSyxHQUFHLHNDQUFzQyxRQUFRLDBCQUEwQixFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDNUYsSUFBSSxPQUFPLENBQUM7WUFDWixRQUFRLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRTtnQkFDdEIsTUFBTSxFQUFFLFdBQVc7Z0JBQ25CLE9BQU8sRUFBRSxRQUFRO2FBQ2xCLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ2YsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQztxQkFDaEQsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzNCLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN0QixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDWCxPQUFPLFFBQVEsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFO29CQUM3QixNQUFNLEVBQUUsV0FBVztvQkFDbkIsT0FBTyxFQUFFLFFBQVE7aUJBQ2xCLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7b0JBQ2YsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQzt5QkFDOUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQzdCLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDeEMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNqRCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FDRixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ1YsT0FBTyxRQUFRLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRTtvQkFDN0IsTUFBTSxFQUFFLFdBQVc7b0JBQ25CLE9BQU8sRUFBRSxRQUFRO2lCQUNsQixFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO29CQUNmLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7eUJBQzlDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUM3QixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3hDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDakQsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNYLE9BQU8sQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFO29CQUNyQixNQUFNLEVBQUUsV0FBVztvQkFDbkIsT0FBTyxFQUFFLFFBQVE7b0JBQ2pCLE9BQU8sRUFBRSxPQUFPO2lCQUNqQixFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO29CQUNmLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7eUJBQzlDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUM3QixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3JDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN4RCxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ2xELElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN4RCxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ2xELElBQUksRUFBRSxDQUFDO2dCQUNULENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxLQUFLLEdBQUcsK0NBQStDLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDN0UsSUFBSSxPQUFPLENBQUM7WUFDWixRQUFRLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRTtnQkFDdEIsTUFBTSxFQUFFLFdBQVc7Z0JBQ25CLE9BQU8sRUFBRSxRQUFRO2FBQ2xCLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ2YsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQztxQkFDaEQsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzNCLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN0QixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDWCxPQUFPLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRTtvQkFDckIsTUFBTSxFQUFFLFdBQVc7b0JBQ25CLE9BQU8sRUFBRSxRQUFRO29CQUNqQixPQUFPLEVBQUUsT0FBTztpQkFDakIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtvQkFDZixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO3lCQUNoRCxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDM0IsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDeEQsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUNsRCxJQUFJLEVBQUUsQ0FBQztnQkFDVCxDQUFDLENBQUMsQ0FBQztnQkFDSCxRQUFRLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRTtvQkFDdEIsTUFBTSxFQUFFLFdBQVc7b0JBQ25CLE9BQU8sRUFBRSxRQUFRO2lCQUNsQixFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO29CQUNmLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7eUJBQ2hELEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUMzQixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3hDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDakQsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsRUFBRSxDQUFDIn0=