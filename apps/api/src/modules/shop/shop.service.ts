import { shopRepository } from './shop.repository.js';
import { createApiError } from '../../middleware/errorHandler.js';
import type { CreateShopDto, UpdateShopDto, GetNearbyShopsDto } from '@smart-dukan/shared';

// ─────────────────────────────────────────────────────────────
// Shop Service
// ─────────────────────────────────────────────────────────────

export const shopService = {
  async getById(id: string) {
    const shop = await shopRepository.findById(id);
    if (!shop) {
      throw createApiError({ status: 404, code: 'SHOP_NOT_FOUND', title: 'Not Found', detail: 'Shop not found.' });
    }
    return shop;
  },

  async getOwnShop(ownerId: string) {
    return shopRepository.ensureShopForUser(ownerId);
  },

  async create(ownerId: string, dto: CreateShopDto) {
    const existing = await shopRepository.findByOwnerId(ownerId);
    if (existing) {
      throw createApiError({ status: 409, code: 'SHOP_EXISTS', title: 'Conflict', detail: 'You already have a shop.' });
    }
    return shopRepository.create(ownerId, dto);
  },

  async update(ownerId: string, dto: UpdateShopDto) {
    const shop = await shopRepository.findByOwnerId(ownerId);
    if (!shop) {
      throw createApiError({ status: 404, code: 'SHOP_NOT_FOUND', title: 'Not Found', detail: 'Shop not found.' });
    }
    return shopRepository.update(shop.id, dto);
  },

  async getNearby(dto: GetNearbyShopsDto) {
    return shopRepository.findNearby(dto.lat, dto.lng, dto.radius, dto.cursor, dto.limit);
  },
};
