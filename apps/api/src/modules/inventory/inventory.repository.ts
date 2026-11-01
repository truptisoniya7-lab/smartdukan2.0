import { prisma } from '../../lib/prisma.js';
import type { Prisma } from '@prisma/client';
import type { UpdateInventoryDto, AddStockBatchDto } from '@smart-dukan/shared';

// ─────────────────────────────────────────────────────────────
// Inventory Repository
// ─────────────────────────────────────────────────────────────

export const inventoryRepository = {
  async listByShop(shopId: string) {
    return prisma.inventoryItem.findMany({
      where: { shopId },
      include: {
        product: { include: { category: true } },
        batches: { orderBy: { expiryDate: 'asc' } },
      },
      orderBy: { product: { name: 'asc' } },
    });
  },

  async findByProduct(productId: string, shopId: string) {
    return prisma.inventoryItem.findFirst({
      where: { productId, shopId },
      include: { product: true, batches: { orderBy: { expiryDate: 'asc' } } },
    });
  },

  async update(id: string, dto: UpdateInventoryDto) {
    return prisma.inventoryItem.update({ where: { id }, data: dto });
  },

  async addBatch(dto: AddStockBatchDto & { inventoryId: string }) {
    const { inventoryId, qty, ...batchData } = dto;
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const batch = await tx.stockBatch.create({
        data: { inventoryId, qty, ...batchData },
      });
      await tx.inventoryItem.update({
        where: { id: inventoryId },
        data: { availableQty: { increment: qty } },
      });
      return batch;
    });
  },

  async getAlerts(shopId: string) {
    return prisma.shopAlert.findMany({
      where: { shopId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async markAlertRead(id: string, shopId: string) {
    return prisma.shopAlert.update({
      where: { id, shopId },
      data: { isRead: true },
    });
  },

  // Bulk upsert from CSV upload
  async bulkUpsert(shopId: string, rows: Array<{
    sku: string; name: string; categoryId: string; mrp: number;
    sellPrice: number; unit: string; qty: number; costPrice?: number; expiryDate?: Date;
  }>) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const results = [];
      for (const row of rows) {
        const product = await tx.product.upsert({
          where: { shopId_sku: { shopId, sku: row.sku } },
          create: {
            shopId, sku: row.sku, name: row.name, categoryId: row.categoryId,
            mrp: row.mrp, sellPrice: row.sellPrice, unit: row.unit,
          },
          update: { name: row.name, mrp: row.mrp, sellPrice: row.sellPrice },
        });

        const inventory = await tx.inventoryItem.upsert({
          where: { productId: product.id },
          create: { productId: product.id, shopId, availableQty: row.qty },
          update: { availableQty: { increment: row.qty } },
        });

        if (row.costPrice) {
          await tx.stockBatch.create({
            data: {
              inventoryId: inventory.id, qty: row.qty,
              costPrice: row.costPrice, expiryDate: row.expiryDate,
            },
          });
        }
        results.push(product);
      }
      return results;
    });
  },
};
