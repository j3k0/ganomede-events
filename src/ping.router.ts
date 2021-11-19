
import { Request, Response, Server } from 'restify';
import { NextFunction } from 'express';

const get = (req: Request, res: Response, next: NextFunction) => {
  res.send(`pong/${req.params.token}`);
  next();
};

const head = (req: Request, res: Response, next: NextFunction) => {
  res.end();
  next();
};

export const createPingRouter = (prefix: string, server: Server) => {
  const url = `${prefix}/ping/:token`;

  server.get(url, get);
  server.head(url, head);
};
