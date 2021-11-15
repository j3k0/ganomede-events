// unit tests for events.middleware.get
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../src/server");
const config_1 = require("../config");
const latest_router_1 = require("../src/latest.router");
const parse_http_params_1 = require("../src/parse-http-params");
const redis_1 = __importDefault(require("redis"));
const url = `${config_1.config.http.prefix}/latest`;
const NON_EMPTY_CHANNEL = 'non-empty-channel';
let redisClient;
describe('Testing ParseLatestGetParams', () => {
    it('Empty params to be null', () => {
        const parsed = (0, parse_http_params_1.parseLatestGetParams)();
        (0, chai_1.expect)(parsed).to.be.instanceof(Error);
    });
    it('defaults channel/limit to ' + NON_EMPTY_CHANNEL + '/100', () => {
        const parsed = (0, parse_http_params_1.parseLatestGetParams)({ channel: NON_EMPTY_CHANNEL });
        (0, chai_1.expect)(parsed).to.eql({
            channel: NON_EMPTY_CHANNEL,
            limit: 100
        });
    });
    it('Params channel/limit to ' + NON_EMPTY_CHANNEL + '/20', () => {
        const parsed = (0, parse_http_params_1.parseLatestGetParams)({ channel: NON_EMPTY_CHANNEL, limit: 20 });
        (0, chai_1.expect)(parsed).to.eql({
            channel: NON_EMPTY_CHANNEL,
            limit: 20
        });
    });
    it('channel must be non-empty string', () => {
        const t = (input) => {
            const actual = (0, parse_http_params_1.parseLatestGetParams)(input);
            (0, chai_1.expect)(actual).to.be.instanceof(Error);
            (0, chai_1.expect)(actual.message).to.equal('Invalid Channel');
        };
        t({});
        t({ channel: '' });
        t({ channel: 42 });
        t({ channel: false });
        t({ channel: undefined });
    });
});
describe.skip('events.latest.get', () => {
    const server = (0, server_1.createServer)();
    before(done => {
        const retry_strategy = (options) => new Error('skip-test');
        redisClient = redis_1.default.createClient(config_1.config.redis.port, config_1.config.redis.host, { retry_strategy });
        redisClient.duplicate = () => redisClient = redis_1.default.createClient(config_1.config.redis.port, config_1.config.redis.host, { retry_strategy });
        (0, latest_router_1.latest)(config_1.config.http.prefix, server, redisClient);
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
    const testUrl = (url) => {
        it(`GET ${url}`, (done) => {
            (0, supertest_1.default)(server)
                .get(url)
                .expect(200)
                .query({ channel: NON_EMPTY_CHANNEL })
                .end((err, res) => {
                (0, chai_1.expect)(res.status).to.equal(200);
                (0, chai_1.expect)(err).to.be.null;
                done();
            });
        });
    };
    testUrl(url);
    const testRequestParams = (url) => {
        it(`Test-Params ${url} `, (done) => {
            (0, supertest_1.default)(server)
                .get(url)
                .query({ channel: NON_EMPTY_CHANNEL })
                .expect(200)
                .end((err, res) => {
                (0, chai_1.expect)(res.status).to.equal(200);
                (0, chai_1.expect)(err).to.be.null;
                (0, chai_1.expect)(res.body).to.be.instanceof(Array);
                done();
            });
        });
    };
    testRequestParams(url);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmxhdGVzdC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdHMvZXZlbnRzLmxhdGVzdC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHVDQUF1QztBQUV2QyxZQUFZLENBQUM7Ozs7O0FBR2IsK0JBQTRCO0FBQzVCLDBEQUFrQztBQUNsQywwQ0FBMkM7QUFDM0Msc0NBQWlDO0FBQ2pDLHdEQUE0QztBQUM1QyxnRUFBOEQ7QUFDOUQsa0RBQTBCO0FBRTFCLE1BQU0sR0FBRyxHQUFHLEdBQUcsZUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLFNBQVMsQ0FBQztBQUUzQyxNQUFNLGlCQUFpQixHQUFHLG1CQUFtQixDQUFDO0FBRTlDLElBQUksV0FBVyxDQUFDO0FBRWhCLFFBQVEsQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLEVBQUU7SUFDNUMsRUFBRSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtRQUNqQyxNQUFNLE1BQU0sR0FBRyxJQUFBLHdDQUFvQixHQUFFLENBQUM7UUFDdEMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsNEJBQTRCLEdBQUcsaUJBQWlCLEdBQUcsTUFBTSxFQUFFLEdBQUcsRUFBRTtRQUNqRSxNQUFNLE1BQU0sR0FBRyxJQUFBLHdDQUFvQixFQUFDLEVBQUMsT0FBTyxFQUFFLGlCQUFpQixFQUFDLENBQUMsQ0FBQztRQUNsRSxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ3BCLE9BQU8sRUFBRSxpQkFBaUI7WUFDMUIsS0FBSyxFQUFFLEdBQUc7U0FDWCxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQywwQkFBMEIsR0FBRyxpQkFBaUIsR0FBRyxL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