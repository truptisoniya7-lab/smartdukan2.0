import { catalogRepository } from './catalog.repository.js';
import { shopRepository } from '../shop/shop.repository.js';
import { createApiError } from '../../middleware/errorHandler.js';
import type { CreateProductDto, UpdateProductDto, ListProductsDto } from '@smart-dukan/shared';

export const catalogService = {
  async getCategories() {
    return catalogRepository.listCategories();
  },

  async listProducts(shopId: string, dto: ListProductsDto) {
    return catalogRepository.listProducts(shopId, dto);
  },

  async getProduct(id: string, shopId: string) {
    const product = await catalogRepository.findProduct(id, shopId);
    if (!product) throw createApiError({ status: 404, code: 'PRODUCT_NOT_FOUND', title: 'Not Found', detail: 'Product not found.' });
    return product;
  },

  async createProduct(ownerId: string, dto: CreateProductDto) {
    const shop = await shopRepository.ensureShopForUser(ownerId);
    return catalogRepository.createProduct(shop.id, dto);
  },

  async updateProduct(ownerId: string, productId: string, dto: UpdateProductDto) {
    const shop = await shopRepository.ensureShopForUser(ownerId);
    await catalogService.getProduct(productId, shop.id); // ownership check
    return catalogRepository.updateProduct(productId, dto);
  },

  async deleteProduct(ownerId: string, productId: string) {
    const shop = await shopRepository.ensureShopForUser(ownerId);
    await catalogService.getProduct(productId, shop.id); // ownership check
    return catalogRepository.deactivateProduct(productId);
  },

  async getLandingOverview() {
    return catalogRepository.getLandingOverview();
  },
};

