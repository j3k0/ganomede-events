'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../src/server");
const ping_router_1 = require("../src/ping.router");
const config_1 = require("../config");
describe('ping-router', () => {
    const server = (0, server_1.createServer)();
    const go = () => (0, supertest_1.default)(server);
    const url = `${config_1.config.http.prefix}/ping/something`;
    before(done => {
        (0, ping_router_1.createPingRounter)(config_1.config.http.prefix, server);
        server.listen(done);
    });
    after(done => server.close(done));
    it('GET /ping/:token', (done) => {
        go()
            .get(url)
            .expect(200, '"pong/something"', done);
    });
    it('HEAD /ping/:token', (done) => {
        go()
            .head(url)
            .expect(200, done);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGluZy5yb3V0ZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3RzL3Bpbmcucm91dGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7OztBQUViLDBEQUFrQztBQUNsQywwQ0FBMkM7QUFDM0Msb0RBQXFEO0FBQ3JELHNDQUFpQztBQUVqQyxRQUFRLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtJQUMzQixNQUFNLE1BQU0sR0FBRyxJQUFBLHFCQUFZLEdBQUUsQ0FBQztJQUM5QixNQUFNLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFBLG1CQUFTLEVBQUMsTUFBTSxDQUFDLENBQUM7SUFDbkMsTUFBTSxHQUFHLEdBQUcsR0FBRyxlQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0saUJBQWlCLENBQUM7SUFFbkQsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ1osSUFBQSwrQkFBaUIsRUFBQyxlQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM5QyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBRUgsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRWxDLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1FBQzlCLEVBQUUsRUFBRTthQUNELEdBQUcsQ0FBQyxHQUFHLENBQUM7YUFDUixNQUFNLENBQUMsR0FBRyxFQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLG1CQUFtQixFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDL0IsRUFBRSxFQUFFO2FBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQzthQUNULE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdkIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9