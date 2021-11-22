// A restify server.on('after', ...) handler
//
// Will send requests statistics to a statsd server
import { Request, Response, Next as NextFunction } from 'restify';
import { createClient } from './statsd-wrapper';

const stats = createClient(undefined);

const cleanupStatsKey = (key: string) => key.replace(/[-.]/g, '_').toLowerCase();

export const sendAuditStats = (req: Request, res: Response, next: NextFunction) => {

  // send number of calls to this route (with response status code) with 10% sampling
  const routeName = (req as any).route ? 'route.' + (req as any).route.name : 'invalid_route';
  stats.increment(routeName + '.status.' + res.statusCode, 1, 0.1);

  // send error statuses (with response status code) with 10% sampling
  if ((req as any)._body && (req as any)._body.restCode) {
    stats.increment(routeName + '.code.' + cleanupStatsKey((req as any)._body.restCode), 1, 0.1);
  }

  // send timings with 1% sampling
  (req.timers || []).forEach((timer) => {
    const t = timer.time;
    const n = cleanupStatsKey(timer.name);
    stats.timing(routeName + '.timers.' + n, 1000000000 * t[0] + t[1], 0.01);
  });

  if (typeof next == 'function') {
    next();
  }
};
