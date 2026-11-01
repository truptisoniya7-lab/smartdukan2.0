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
};
