import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { validate } from '../../middleware/validate.js';
import { updateInventorySchema, addStockBatchSchema } from '@smart-dukan/shared';
import { authenticate, requireShopkeeper } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate, requireShopkeeper);

router.get('/', inventoryController.list);
router.patch('/:productId', validate({ body: updateInventorySchema }), inventoryController.update);
router.post('/batches', validate({ body: addStockBatchSchema }), inventoryController.addBatch);
router.get('/alerts', inventoryController.getAlerts);

export { router as inventoryRouter };
