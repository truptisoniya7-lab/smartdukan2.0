import type { Request, Response, NextFunction } from 'express';
import { shopService } from './shop.service.js';
import type { JwtPayload } from '../../middleware/auth.js';

export const shopController = {
  async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await shopService.getNearby(req.query as any);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await shopService.getById(req.params['id'] as string);
      res.json(shop);
    } catch (err) { next(err); }
  },

  async getOwnShop(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals['user'] as JwtPayload;
      const shop = await shopService.getOwnShop(user.sub);
      res.json(shop);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals['user'] as JwtPayload;
      const shop = await shopService.create(user.sub, req.body);
      res.status(201).json(shop);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals['user'] as JwtPayload;
      const shop = await shopService.update(user.sub, req.body);
      res.json(shop);
    } catch (err) { next(err); }
  },
};
