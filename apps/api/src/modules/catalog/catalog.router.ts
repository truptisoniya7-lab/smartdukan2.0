import { Router } from 'express';
import { catalogController } from './catalog.controller.js';
import { validate } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema, listProductsSchema } from '@smart-dukan/shared';
import { authenticate, requireShopkeeper } from '../../middleware/auth.js';
import { z } from 'zod';

const router = Router({ mergeParams: true });

// Public
router.get('/landing-overview', catalogController.getLandingOverview);
router.get('/categories', catalogController.getCategories);
router.get('/shops/:shopId/products', validate({ query: listProductsSchema }), catalogController.listProducts);

// Shopkeeper: manage own shop products
router.post('/shop/products', authenticate, requireShopkeeper, validate({ body: createProductSchema }), catalogController.createProduct);
router.patch('/shop/products/:id', authenticate, requireShopkeeper, validate({ body: updateProductSchema }), catalogController.updateProduct);
router.delete('/shop/products/:id', authenticate, requireShopkeeper, catalogController.deleteProduct);

export { router as catalogRouter };
