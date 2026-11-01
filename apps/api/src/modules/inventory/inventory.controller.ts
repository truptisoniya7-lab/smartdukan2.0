import type { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service.js';
import type { JwtPayload } from '../../middleware/auth.js';

export const inventoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals['user'] as JwtPayload;
      res.json(await inventoryService.listInventory(user.sub));
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals['user'] as JwtPayload;
      res.json(await inventoryService.updateInventory(user.sub, req.params['productId'] as string, req.body));
    } catch (err) { next(err); }
  },

  async addBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals['user'] as JwtPayload;
      res.status(201).json(await inventoryService.addStockBatch(user.sub, req.body));
    } catch (err) { next(err); }
  },

  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals['user'] as JwtPayload;
      res.json(await inventoryService.getAlerts(user.sub));
    } catch (err) { next(err); }
  },
};
