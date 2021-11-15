'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPingRounter = void 0;
const get = (req, res, next) => {
    res.send(`pong/${req.params.token}`);
    next();
};
const head = (req, res, next) => {
    res.end();
    next();
};
const createPingRounter = (prefix, server) => {
    const url = `${prefix}/ping/:token`;
    server.get(url, get);
    server.head(url, head);
};
exports.createPingRounter = createPingRounter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGluZy5yb3V0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcGluZy5yb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYixNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDN0IsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUNyQyxJQUFJLEVBQUUsQ0FBQztBQUNULENBQUMsQ0FBQztBQUVGLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUM5QixHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDVixJQUFJLEVBQUUsQ0FBQztBQUNULENBQUMsQ0FBQztBQUVLLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxNQUFjLEVBQUUsTUFBTSxFQUFFLEVBQUU7SUFDMUQsTUFBTSxHQUFHLEdBQUcsR0FBRyxNQUFNLGNBQWMsQ0FBQztJQUVwQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNyQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN6QixDQUFDLENBQUM7QUFMVyxRQUFBLGlCQUFpQixxQkFLNUIifQ==