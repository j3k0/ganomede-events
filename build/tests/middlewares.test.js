'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const restify_1 = __importDefault(require("restify"));
const middlewares_1 = require("../src/middlewares");
const chai_1 = require("chai");
const testdouble_1 = __importDefault(require("testdouble"));
describe('Middlewares', () => {
    describe('requireSecret()', () => {
        it('calls next() if req.ganomede.secretMatches', (done) => {
            (0, middlewares_1.requireSecret)({ ganomede: { secretMatches: true } }, {}, done);
        });
        it('calls next(error) if secret was not matched', (done) => {
            (0, middlewares_1.requireSecret)({ ganomede: { secretMatches: false } }, {}, (err) => {
                (0, chai_1.expect)(err).to.be.instanceof(restify_1.default.RestError);
                (0, chai_1.expect)(err).to.have.property('restCode', 'InvalidCredentialsError');
                done();
            });
        });
    });
    describe('requireAuth()', () => {
        const authdbClient = testdouble_1.default.object(null); // td.object(['getAccount']);
        const mw = (0, middlewares_1.requireAuth)({ authdbClient, secret: '42' });
        it('token is valid', (done) => {
            const req = {
                params: { token: 'token' },
                ganomede: {}
            };
            testdouble_1.default.when(authdbClient.getAccount('token', testdouble_1.default.callback))
                .thenCallback(null, 'user');
            mw(req, {}, (err) => {
                (0, chai_1.expect)(err).to.not.be.ok;
                (0, chai_1.expect)(req.ganomede).to.have.property('userId', 'user');
                (0, chai_1.expect)(req.ganomede).to.not.have.property('secretMatches');
                done();
            });
        });
        it('spoofing secret is valid', (done) => {
            const req = {
                params: { token: '42.user' },
                ganomede: {}
            };
            mw(req, {}, (err) => {
                (0, chai_1.expect)(err).to.not.be.ok;
                (0, chai_1.expect)(req.ganomede).to.have.property('userId', 'user');
                (0, chai_1.expect)(req.ganomede).to.have.property('secretMatches', true);
                done();
            });
        });
        it('token is invalid', (done) => {
            const req = {
                params: { token: 'oops' },
                ganomede: {}
            };
            testdouble_1.default.when(authdbClient.getAccount('oops', testdouble_1.default.callback))
                .thenCallback(null, null);
            mw(req, {}, (err) => {
                (0, chai_1.expect)(err).to.be.instanceof(restify_1.default.RestError);
                (0, chai_1.expect)(err).to.have.property('restCode', 'InvalidCredentialsError');
                (0, chai_1.expect)(req.ganomede).to.not.have.property('secretMatches');
                done();
            });
        });
        it('spoofing secret is invalid', (done) => {
            const req = {
                params: { token: 'not-42.oops' },
                ganomede: {}
            };
            testdouble_1.default.when(authdbClient.getAccount('not-42.oops'))
                .thenCallback(null, null);
            mw(req, {}, (err) => {
                (0, chai_1.expect)(err).to.be.instanceof(restify_1.default.RestError);
                (0, chai_1.expect)(err).to.have.property('restCode', 'InvalidCredentialsError');
                (0, chai_1.expect)(req.ganomede).to.not.have.property('secretMatches');
                done();
            });
        });
        it('token is missing', (done) => {
            mw({ params: Object.create(null) }, {}, (err) => {
                (0, chai_1.expect)(err).to.be.instanceof(restify_1.default.RestError);
                (0, chai_1.expect)(err).to.have.property('restCode', 'InvalidAuthTokenError');
                done();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3RzL21pZGRsZXdhcmVzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7OztBQUViLHNEQUE4QjtBQUM5QixvREFBOEQ7QUFDOUQsK0JBQTRCO0FBQzVCLDREQUE0QjtBQU01QixRQUFRLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtJQUMzQixRQUFRLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1FBQy9CLEVBQUUsQ0FBQyw0Q0FBNEMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3hELElBQUEsMkJBQWEsRUFBQyxFQUFDLFFBQVEsRUFBRSxFQUFDLGFBQWEsRUFBRSxJQUFJLEVBQUMsRUFBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM3RCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3pELElBQUEsMkJBQWEsRUFBQyxFQUFDLFFBQVEsRUFBRSxFQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUMsRUFBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUM1RCxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxpQkFBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNoRCxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUseUJBQXlCLENBQUMsQ0FBQztnQkFDcEUsSUFBSSxFQUFFLENBQUM7WUFDVCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUM3QixNQUFN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