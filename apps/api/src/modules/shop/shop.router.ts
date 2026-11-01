import { Router } from 'express';
import { shopController } from './shop.controller.js';
import { validate } from '../../middleware/validate.js';
import { createShopSchema, updateShopSchema, getNearbyShopsSchema } from '@smart-dukan/shared';
import { authenticate, requireShopkeeper } from '../../middleware/auth.js';

const router = Router();

// Public
router.get('/', validate({ query: getNearbyShopsSchema }), shopController.getNearby);
router.get('/:id', shopController.getById);

// Shopkeeper only
router.get('/me/shop', authenticate, requireShopkeeper, shopController.getOwnShop);
router.post('/', authenticate, requireShopkeeper, validate({ body: createShopSchema }), shopController.create);
router.patch('/me', authenticate, requireShopkeeper, validate({ body: updateShopSchema }), shopController.update);

export { router as shopRouter };
