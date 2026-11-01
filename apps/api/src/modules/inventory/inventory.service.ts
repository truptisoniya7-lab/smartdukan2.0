import { inventoryRepository } from './inventory.repository.js';
import { shopRepository } from '../shop/shop.repository.js';
import { createApiError } from '../../middleware/errorHandler.js';
import type { UpdateInventoryDto, AddStockBatchDto } from '@smart-dukan/shared';

export const inventoryService = {
  async listInventory(ownerId: string) {
    const shop = await shopRepository.ensureShopForUser(ownerId);
    return inventoryRepository.listByShop(shop.id);
  },

  async updateInventory(ownerId: string, productId: string, dto: UpdateInventoryDto) {
    const shop = await shopRepository.ensureShopForUser(ownerId);
    const item = await inventoryRepository.findByProduct(productId, shop.id);
    if (!item) throw createApiError({ status: 404, code: 'INVENTORY_NOT_FOUND', title: 'Not Found', detail: 'Inventory item not found.' });
    return inventoryRepository.update(item.id, dto);
  },

  async addStockBatch(ownerId: string, dto: AddStockBatchDto) {
    const shop = await shopRepository.ensureShopForUser(ownerId);
    const item = await inventoryRepository.findByProduct(dto.productId, shop.id);
    if (!item) throw createApiError({ status: 404, code: 'INVENTORY_NOT_FOUND', title: 'Not Found', detail: 'Inventory item not found.' });
    return inventoryRepository.addBatch({ ...dto, inventoryId: item.id });
  },

  async getAlerts(ownerId: string) {
    const shop = await shopRepository.ensureShopForUser(ownerId);
    return inventoryRepository.getAlerts(shop.id);
  },
};
