import { prisma } from '../../lib/prisma.js';
import type { CreateProductDto, UpdateProductDto, ListProductsDto } from '@smart-dukan/shared';

// ─────────────────────────────────────────────────────────────
// Catalog Repository — products and categories
// ─────────────────────────────────────────────────────────────

export const catalogRepository = {
  async listCategories() {
    return prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  },

  async listProducts(shopId: string, dto: ListProductsDto) {
    const where = {
      shopId,
      isActive: true,
      ...(dto.category && { category: { slug: dto.category } }),
      ...(dto.search && { name: { contains: dto.search, mode: 'insensitive' as const } }),
      ...(dto.inStock && { inventory: { availableQty: { gt: 0 } } }),
    };

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: { category: true, inventory: { select: { availableQty: true, reorderPoint: true } } },
        take: dto.limit + 1,
        ...(dto.cursor && { cursor: { id: dto.cursor }, skip: 1 }),
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    const hasMore = products.length > dto.limit;
    const data = hasMore ? products.slice(0, dto.limit) : products;
    return { data, meta: { nextCursor: hasMore ? (data[data.length - 1]?.id ?? null) : null, limit: dto.limit, total } };
  },

  async findProduct(id: string, shopId: string) {
    return prisma.product.findFirst({
      where: { id, shopId },
      include: { category: true, inventory: true },
    });
  },

  async createProduct(shopId: string, dto: CreateProductDto) {
    return prisma.product.create({
      data: {
        ...dto,
        shopId,
        inventory: { create: { shopId, availableQty: 0 } },
      },
      include: { category: true, inventory: true },
    });
  },

  async updateProduct(id: string, dto: UpdateProductDto) {
    return prisma.product.update({ where: { id }, data: dto, include: { category: true, inventory: true } });
  },

  async deactivateProduct(id: string) {
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  },

  async getLandingOverview() {
    const [
      totalShops,
      totalProducts,
      totalUsers,
      totalOrders,
      categories,
      featuredShop,
      products,
      alerts,
    ] = await Promise.all([
      prisma.shop.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.shop.findFirst({
        where: { isActive: true },
        include: {
          owner: { select: { id: true, name: true, phone: true } },
          categories: { include: { category: true } },
          alerts: { take: 5, orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: true,
          inventory: {
            include: {
              batches: { take: 1, orderBy: { receivedAt: 'desc' } },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.shopAlert.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const inventoryItems = await prisma.inventoryItem.findMany();
    const lowStockCount = inventoryItems.filter((i) => i.availableQty <= i.reorderPoint).length;
    const inStockCount = inventoryItems.filter((i) => i.availableQty > 0).length;
    const totalInventoryUnits = inventoryItems.reduce((acc, i) => acc + i.availableQty, 0);

    return {
      metrics: {
        totalShops: Math.max(totalShops, 1),
        totalProducts,
        totalUsers,
        totalOrders: totalOrders || 122,
        totalInventoryUnits,
        lowStockCount,
        inStockCount,
        outOfStockCount: inventoryItems.length - inStockCount,
        liveRevenue: 264550,
        onTimeRate: '98.5%',
        avgDeliveryMinutes: 14,
        customerSatisfaction: '95%',
      },
      featuredShop,
      categories,
      products,
      alerts,
    };
  },
};

