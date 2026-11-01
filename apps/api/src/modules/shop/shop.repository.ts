import { prisma } from '../../lib/prisma.js';
import type { CreateShopDto, UpdateShopDto } from '@smart-dukan/shared';

// ─────────────────────────────────────────────────────────────
// Shop Repository
// ─────────────────────────────────────────────────────────────

export const shopRepository = {
  async findById(id: string) {
    return prisma.shop.findUnique({
      where: { id },
      include: { categories: { include: { category: true } } },
    });
  },

  async findByOwnerId(ownerId: string) {
    return prisma.shop.findUnique({ where: { ownerId } });
  },

  async ensureShopForUser(ownerId: string) {
    let shop = await prisma.shop.findUnique({
      where: { ownerId },
      include: { categories: { include: { category: true } } },
    });
    if (shop) return shop;

    const user = await prisma.user.findUnique({ where: { id: ownerId } });
    const userName = user?.name || 'My';
    const allCategories = await prisma.category.findMany();

    shop = await prisma.shop.create({
      data: {
        ownerId,
        name: `${userName}'s Dukan`,
        description: `Local neighbourhood store operated by ${userName}.`,
        address: '12, Main Bazaar Road',
        city: 'Bengaluru',
        pincode: '560001',
        phone: user?.phone || '+919876543210',
        latitude: 12.9716,
        longitude: 77.5946,
        deliveryRadiusKm: 5,
        isOpen: true,
        isActive: true,
        categories: {
          create: allCategories.map((c) => ({ categoryId: c.id })),
        },
      },
      include: { categories: { include: { category: true } } },
    });

    const defaultProducts = [
      { sku: 'ATTA-5KG', name: 'Aashirvaad Atta 5kg', mrp: 265, sellPrice: 249, unit: '5kg', slug: 'grocery', qty: 24, costPrice: 220 },
      { sku: 'MILK-1L', name: 'Amul Full Cream Milk 1L', mrp: 68, sellPrice: 68, unit: '1L', slug: 'dairy', qty: 40, costPrice: 58 },
      { sku: 'COKE-600ML', name: 'Coca-Cola 600ml', mrp: 40, sellPrice: 38, unit: '600ml', slug: 'beverages', qty: 48, costPrice: 30 },
      { sku: 'LAYS-MASALA', name: "Lay's Masala 26g", mrp: 20, sellPrice: 20, unit: '26g', slug: 'snacks', qty: 60, costPrice: 14 },
      { sku: 'TOOR-DAL-1', name: 'Toor Dal 1kg', mrp: 135, sellPrice: 128, unit: '1kg', slug: 'grocery', qty: 18, costPrice: 110 },
      { sku: 'MILK-500ML', name: 'Amul Toned Milk 500ml', mrp: 34, sellPrice: 34, unit: '500ml', slug: 'dairy', qty: 5, costPrice: 28 },
      { sku: 'OIL-SUNF-1L', name: 'Sunflower Oil 1L', mrp: 145, sellPrice: 138, unit: '1L', slug: 'grocery', qty: 0, costPrice: 120 },
    ];

    for (const def of defaultProducts) {
      const cat = allCategories.find((c) => c.slug === def.slug) || allCategories[0];
      if (!cat) continue;
      const product = await prisma.product.create({
        data: {
          shopId: shop.id,
          categoryId: cat.id,
          sku: def.sku,
          name: def.name,
          mrp: def.mrp,
          sellPrice: def.sellPrice,
          unit: def.unit,
        },
      });
      const inv = await prisma.inventoryItem.create({
        data: {
          productId: product.id,
          shopId: shop.id,
          availableQty: def.qty,
          reorderPoint: 10,
          safetyStock: 5,
        },
      });
      if (def.qty > 0) {
        await prisma.stockBatch.create({
          data: {
            inventoryId: inv.id,
            qty: def.qty,
            costPrice: def.costPrice,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    return shop;
  },

  async create(ownerId: string, dto: CreateShopDto) {
    const { categories, ...rest } = dto;
    return prisma.shop.create({
      data: {
        ...rest,
        ownerId,
        categories: {
          create: categories.map((categoryId) => ({ categoryId })),
        },
      },
      include: { categories: { include: { category: true } } },
    });
  },

  async update(id: string, dto: UpdateShopDto) {
    const { categories, ...rest } = dto;
    return prisma.shop.update({
      where: { id },
      data: {
        ...rest,
        ...(categories && {
          categories: {
            deleteMany: {},
            create: categories.map((categoryId) => ({ categoryId })),
          },
        }),
      },
      include: { categories: { include: { category: true } } },
    });
  },

  async findNearby(lat: number, lng: number, radiusKm: number, cursor?: string, limit = 20) {
    // PostgreSQL haversine distance filter
    // In production this would use PostGIS ST_DWithin
    const shops = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        distance_km: number;
        is_open: boolean;
        rating: number;
        logo_url: string | null;
      }>
    >`
      SELECT
        id, name, latitude, longitude, rating, is_open, logo_url,
        (6371 * acos(
          cos(radians(${lat})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(latitude))
        )) AS distance_km
      FROM shops
      WHERE is_active = true
        AND (6371 * acos(
          cos(radians(${lat})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(latitude))
        )) <= ${radiusKm}
      ORDER BY distance_km ASC
      LIMIT ${limit + 1}
    `;

    const hasMore = shops.length > limit;
    const data = hasMore ? shops.slice(0, limit) : shops;
    return { data, nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null };
  },
};
