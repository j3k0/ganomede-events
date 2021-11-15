'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../src/server");
const about_router_1 = require("../src/about.router");
const config_1 = require("../config");
const package_json_1 = __importDefault(require("../package.json"));
const about = about_router_1.createAbout;
describe('about-router', () => {
    const server = (0, server_1.createServer)();
    before(done => {
        about(config_1.config.http.prefix, server);
        server.listen(done);
    });
    after(done => server.close(done));
    const test = (url) => {
        it(`GET ${url}`, (done) => {
            (0, supertest_1.default)(server)
                .get(url)
                .expect(200)
                .end((err, res) => {
                (0, chai_1.expect)(err).to.be.null;
                (0, chai_1.expect)(res.body).to.have.property('type', package_json_1.default.name);
                done();
            });
        });
    };
    test('/about');
    test(`${config_1.config.http.prefix}/about`);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJvdXQucm91dGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0cy9hYm91dC5yb3V0ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7O0FBRWIsK0JBQTRCO0FBQzVCLDBEQUFrQztBQUNsQywwQ0FBMkM7QUFDM0Msc0RBQWdEO0FBQ2hELHNDQUFpQztBQUNqQyxtRUFBa0M7QUFFbEMsTUFBTSxLQUFLLEdBQUcsMEJBQVcsQ0FBQztBQUUxQixRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtJQUM1QixNQUFNLE1BQU0sR0FBRyxJQUFBLHFCQUFZLEdBQUUsQ0FBQztJQUU5QixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDWixLQUFLLENBQUMsZUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDLENBQUMsQ0FBQztJQUVILEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUVsQyxNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQ25CLEVBQUUsQ0FBQyxPQUFPLEdBQUcsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDeEIsSUFBQSxtQkFBUyxFQUFDLE1BQU0sQ0FBQztpQkFDZCxHQUFHLENBQUMsR0FBRyxDQUFDO2lCQUNSLE1BQU0sQ0FBQyxHQUFHLENBQUM7aUJBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUNoQixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztnQkFDdkIsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxzQkFBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwRCxJQUFJLEVBQUUsQ0FBQztZQUNULENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7SUFFRixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDZixJQUFJLENBQUMsR0FBRyxlQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sUUFBUSxDQUFDLENBQUM7QUFDdEMsQ0FBQyxDQUFDLENBQUMifQ==