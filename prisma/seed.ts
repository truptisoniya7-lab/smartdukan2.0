import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Smart Dukan 2.0…');

  // ── Categories ────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'grocery' },       update: {}, create: { name: 'Grocery',        slug: 'grocery',       iconUrl: '🛒' } }),
    prisma.category.upsert({ where: { slug: 'dairy' },         update: {}, create: { name: 'Dairy',          slug: 'dairy',         iconUrl: '🥛' } }),
    prisma.category.upsert({ where: { slug: 'beverages' },     update: {}, create: { name: 'Beverages',      slug: 'beverages',     iconUrl: '🥤' } }),
    prisma.category.upsert({ where: { slug: 'snacks' },        update: {}, create: { name: 'Snacks',         slug: 'snacks',        iconUrl: '🍿' } }),
    prisma.category.upsert({ where: { slug: 'personal-care' }, update: {}, create: { name: 'Personal Care',  slug: 'personal-care', iconUrl: '🧴' } }),
    prisma.category.upsert({ where: { slug: 'household' },     update: {}, create: { name: 'Household',      slug: 'household',     iconUrl: '🏠' } }),
  ]);

  console.log(`  ✅ ${categories.length} categories`);

  const [grocery, dairy, beverages, snacks] = categories;

  // ── Shopkeeper ────────────────────────────────────────────
  const shopkeeperPwHash = await argon2.hash('Shopkeeper@123', { type: argon2.argon2id, memoryCost: 65536, timeCost: 3 });
  const shopkeeper = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      phone: '+919876543210',
      email: 'ramesh@smartdukan.dev',
      name: 'Ramesh Kumar',
      passwordHash: shopkeeperPwHash,
      role: 'SHOPKEEPER',
      isVerified: true,
    },
  });

  // ── Shop ──────────────────────────────────────────────────
  const shop = await prisma.shop.upsert({
    where: { ownerId: shopkeeper.id },
    update: {},
    create: {
      ownerId: shopkeeper.id,
      name: "Ramesh's Kirana Store",
      description: 'Your trusted neighbourhood grocery store since 1995.',
      address: '12, MG Road, Koramangala',
      city: 'Bengaluru',
      pincode: '560034',
      phone: '+919876543210',
      latitude: 12.9352,
      longitude: 77.6245,
      deliveryRadiusKm: 3,
      isOpen: true,
      categories: {
        create: categories.map((c) => ({ categoryId: c.id })),
      },
    },
  });

  // ── Products + Inventory ──────────────────────────────────
  const productDefs = [
    { sku: 'ATTA-5KG',    name: 'Aashirvaad Atta 5kg',    categoryId: grocery!.id, mrp: 265, sell: 249, unit: '5kg',    qty: 24, costPrice: 220 },
    { sku: 'MILK-1L',     name: 'Amul Full Cream Milk 1L', categoryId: dairy!.id,   mrp: 68,  sell: 68,  unit: '1L',     qty: 40, costPrice: 58  },
    { sku: 'COKE-600ML',  name: 'Coca-Cola 600ml',         categoryId: beverages!.id,mrp: 40, sell: 38,  unit: '600ml',  qty: 48, costPrice: 30  },
    { sku: 'LAYS-MASALA', name: "Lay's Masala 26g",        categoryId: snacks!.id,  mrp: 20,  sell: 20,  unit: '26g',    qty: 60, costPrice: 14  },
    { sku: 'TOOR-DAL-1',  name: 'Toor Dal 1kg',            categoryId: grocery!.id, mrp: 135, sell: 128, unit: '1kg',    qty: 18, costPrice: 110 },
    { sku: 'MILK-500ML',  name: 'Amul Toned Milk 500ml',   categoryId: dairy!.id,   mrp: 34,  sell: 34,  unit: '500ml',  qty: 5,  costPrice: 28  }, // low stock
    { sku: 'OIL-SUNF-1L', name: 'Sunflower Oil 1L',        categoryId: grocery!.id, mrp: 145, sell: 138, unit: '1L',     qty: 0,  costPrice: 120 }, // out of stock
  ];

  for (const def of productDefs) {
    const existing = await prisma.product.findUnique({ where: { shopId_sku: { shopId: shop.id, sku: def.sku } } });
    if (!existing) {
      const product = await prisma.product.create({
        data: {
          shopId: shop.id, categoryId: def.categoryId,
          sku: def.sku, name: def.name,
          mrp: def.mrp, sellPrice: def.sell, unit: def.unit,
        },
      });
      const inv = await prisma.inventoryItem.create({
        data: { productId: product.id, shopId: shop.id, availableQty: def.qty, reorderPoint: 10, safetyStock: 5 },
      });
      if (def.qty > 0) {
        await prisma.stockBatch.create({
          data: { inventoryId: inv.id, qty: def.qty, costPrice: def.costPrice, expiryDate: def.categoryId === dairy!.id ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null },
        });
      }
    }
  }

  console.log(`  ✅ ${productDefs.length} products + inventory`);

  // ── Customer ──────────────────────────────────────────────
  const customerPwHash = await argon2.hash('Customer@123', { type: argon2.argon2id, memoryCost: 65536, timeCost: 3 });
  const customer = await prisma.user.upsert({
    where: { phone: '+919123456789' },
    update: { passwordHash: customerPwHash },
    create: { phone: '+919123456789', name: 'Anjali Singh', passwordHash: customerPwHash, role: 'CUSTOMER', isVerified: true },
  });

  // ── Rider ─────────────────────────────────────────────────
  const riderPwHash = await argon2.hash('Rider@123', { type: argon2.argon2id, memoryCost: 65536, timeCost: 3 });
  const rider = await prisma.user.upsert({
    where: { phone: '+919988776655' },
    update: { passwordHash: riderPwHash },
    create: { phone: '+919988776655', name: 'Sohail Khan', passwordHash: riderPwHash, role: 'RIDER', isVerified: true },
  });

  await prisma.riderProfile.upsert({
    where: { userId: rider.id },
    update: {},
    create: { userId: rider.id, vehicleType: 'two-wheeler', isAvailable: true, city: 'Bengaluru', locality: 'Koramangala', isVerified: true },
  });

  // ── Alerts ────────────────────────────────────────────────
  const milkItem = await prisma.inventoryItem.findFirst({ where: { shopId: shop.id, product: { sku: 'MILK-500ML' } } });
  if (milkItem) {
    await prisma.shopAlert.create({
      data: { shopId: shop.id, productId: milkItem.productId, type: 'LOW_STOCK', message: 'Amul Toned Milk 500ml is running low (5 units). Reorder point: 10.' },
    });
  }

  const oilItem = await prisma.inventoryItem.findFirst({ where: { shopId: shop.id, product: { sku: 'OIL-SUNF-1L' } } });
  if (oilItem) {
    await prisma.shopAlert.create({
      data: { shopId: shop.id, productId: oilItem.productId, type: 'LOW_STOCK', message: 'Sunflower Oil 1L is out of stock. Customers are asking for it.' },
    });
  }

  console.log('  ✅ Sample alerts created');
  console.log('\n🎉 Seed complete!\n');
  console.log('  Shopkeeper  → phone: +919876543210  password: Shopkeeper@123');
  console.log('  Customer    → phone: +919123456789  (OTP login)');
  console.log('  Rider       → phone: +919988776655  (OTP login)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
