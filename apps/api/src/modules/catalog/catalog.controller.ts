import type { Request, Response, NextFunction } from 'express';
import { catalogService } from './catalog.service.js';
import type { JwtPayload } from '../../middleware/auth.js';

export const catalogController = {
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try { res.json(await catalogService.getCategories()); } catch (err) { next(err); }
  },

  async getLandingOverview(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await catalogService.getLandingOverview());
    } catch (err) {
      next(err);
    }
  },


  async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await catalogService.listProducts(req.params['shopId'] as string, req.query as any));
    } catch (err) { next(err); }
  },

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals['user'] as JwtPayload;
      res.status(201).json(await catalogService.createProduct(user.sub, req.body));
    } catch (err) { next(err); }
  },

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals['user'] as JwtPayload;
      res.json(await catalogService.updateProduct(user.sub, req.params['id'] as string, req.body));
    } catch (err) { next(err); }
  },

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals['user'] as JwtPayload;
      await catalogService.deleteProduct(user.sub, req.params['id'] as string);
      res.status(204).end();
    } catch (err) { next(err); }
  },
};
