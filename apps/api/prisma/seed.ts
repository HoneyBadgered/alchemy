/**
 * Seed script for The Alchemy Table database
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Seed Admin User
  console.log('👤 Seeding admin user...');
  
  const adminEmail = 'admin@alchemy.dev';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword('Admin123!');
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        username: 'admin',
        role: 'admin',
        emailVerified: true,
        profile: {
          create: {
            firstName: 'Admin',
            lastName: 'User',
          },
        },
        playerState: {
          create: {
            level: 99,
            xp: 0,
            totalXp: 999999,
          },
        },
        cosmetics: {
          create: {
            unlockedThemes: [],
            unlockedSkins: [],
          },
        },
      },
    });
    console.log('  ✓ Created admin user: admin@alchemy.dev / Admin123!');
  } else {
    console.log('  ⊘ Skipped (exists): admin@alchemy.dev');
  }

  console.log('');

  // Seed Products (Blends and Items)
  console.log('📦 Seeding products...');

  const products = [
    // Coffee Blends
    {
      name: 'Mystic Morning Blend',
      description: 'A harmonious blend of Ethiopian Yirgacheffe and Colombian Supremo beans, creating a bright and fruity cup with hints of blueberry and chocolate. Perfect for starting your alchemical day.',
      price: 18.99,
      imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800',
      images: [
        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800',
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800',
      ],
      category: 'Coffee Blends',
      tags: ['coffee', 'blend', 'morning', 'fruity', 'medium-roast'],
      stock: 50,
      isActive: true,
    },
    {
      name: 'Dark Ritual Roast',
      description: 'An intense blend of Sumatra Mandheling and Brazil Santos, roasted to perfection for a bold, earthy flavor with notes of dark chocolate and toasted nuts. For the serious alchemist.',
      price: 21.99,
      imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800',
      images: [
        'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800',
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
      ],
      category: 'Coffee Blends',
      tags: ['coffee', 'blend', 'dark-roast', 'bold', 'earthy'],
      stock: 45,
      isActive: true,
    },
    {
      name: 'Golden Hour Decaf',
      description: 'Swiss water processed decaf blend featuring Central American beans. Smooth and mellow with caramel sweetness and a clean finish. Alchemy at any hour.',
      price: 19.99,
      imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
      images: [
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
      ],
      category: 'Coffee Blends',
      tags: ['coffee', 'blend', 'decaf', 'smooth', 'evening'],
      stock: 30,
      isActive: true,
    },
    {
      name: 'Espresso Elixir',
      description: 'A masterfully crafted espresso blend combining beans from three continents. Rich crema, balanced acidity, and a complex flavor profile perfect for your morning ritual.',
      price: 22.99,
      imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800',
      images: [
        'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800',
        'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800',
      ],
      category: 'Coffee Blends',
      tags: ['coffee', 'espresso', 'blend', 'rich', 'crema'],
      stock: 60,
      isActive: true,
    },

    // Tea Blends
    {
      name: 'Enchanted Earl Grey',
      description: 'Classic Earl Grey elevated with organic bergamot oil, blue cornflowers, and a hint of vanilla. A refined blend for the discerning alchemist.',
      price: 14.99,
      imageUrl: 'https://images.unsplash.com/photo-1597318167278-4f85a5a8f0c1?w=800',
      images: [
        'https://images.unsplash.com/photo-1597318167278-4f85a5a8f0c1?w=800',
        'https://images.unsplash.com/photo-1563822249548-fa8a51742137?w=800',
      ],
      category: 'Tea Blends',
      tags: ['tea', 'blend', 'earl-grey', 'bergamot', 'classic'],
      stock: 40,
      isActive: true,
    },
    {
      name: 'Serenity Chamomile Fusion',
      description: 'A calming blend of Egyptian chamomile, lavender, and lemon balm. Perfect for evening meditation and peaceful contemplation.',
      price: 13.99,
      imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',
      images: [
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',
        'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800',
      ],
      category: 'Tea Blends',
      tags: ['tea', 'blend', 'herbal', 'chamomile', 'relaxing', 'caffeine-free'],
      stock: 35,
      isActive: true,
    },
    {
      name: 'Dragon\'s Breath Green',
      description: 'A powerful blend of Japanese sencha and Chinese gunpowder green tea with ginger and lemongrass. Energizing and refreshing.',
      price: 16.99,
      imageUrl: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800',
      images: [
        'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800',
        'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=800',
      ],
      category: 'Tea Blends',
      tags: ['tea', 'blend', 'green-tea', 'ginger', 'energizing'],
      stock: 42,
      isActive: true,
    },

    // Brewing Equipment
    {
      name: 'Alchemist\'s Pour Over Kit',
      description: 'Professional-grade pour over brewing set including ceramic dripper, glass carafe, filters, and thermometer. Everything you need to master the pour over technique.',
      price: 49.99,
      imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800',
      images: [
        'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
      ],
      category: 'Brewing Equipment',
      tags: ['equipment', 'pour-over', 'brewing', 'kit', 'ceramic'],
      stock: 25,
      isActive: true,
    },
    {
      name: 'Precision Burr Grinder',
      description: 'Conical burr grinder with 40 grind settings. Consistent particle size for optimal extraction. The cornerstone of any serious alchemist\'s toolkit.',
      price: 89.99,
      imageUrl: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800',
      images: [
        'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800',
        'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800',
      ],
      category: 'Brewing Equipment',
      tags: ['equipment', 'grinder', 'burr', 'precision', 'essential'],
      stock: 15,
      isActive: true,
    },
    {
      name: 'Temperature Control Kettle',
      description: 'Electric gooseneck kettle with precise temperature control (140°F-212°F). Hold function maintains temperature for 60 minutes. Perfect for all brewing methods.',
      price: 79.99,
      imageUrl: 'https://images.unsplash.com/photo-1601473420155-a6c118f5dc07?w=800',
      images: [
        'https://images.unsplash.com/photo-1601473420155-a6c118f5dc07?w=800',
        'https://images.unsplash.com/photo-1606312619070-d48b4cdb5f0f?w=800',
      ],
      category: 'Brewing Equipment',
      tags: ['equipment', 'kettle', 'temperature-control', 'gooseneck', 'electric'],
      stock: 20,
      isActive: true,
    },

    // Accessories
    {
      name: 'Alchemy Table Mug Set',
      description: 'Set of 4 handcrafted ceramic mugs with alchemical symbols. Microwave and dishwasher safe. Each mug holds 12oz.',
      price: 39.99,
      imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800',
      images: [
        'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800',
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',
      ],
      category: 'Accessories',
      tags: ['accessories', 'mugs', 'ceramic', 'handcrafted', 'set'],
      stock: 50,
      isActive: true,
    },
    {
      name: 'Bamboo Storage Canisters',
      description: 'Set of 3 airtight bamboo canisters with CO2 release valves. Keep your beans and leaves fresh. Sustainable and beautiful.',
      price: 34.99,
      imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800',
      images: [
        'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800',
        'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800',
      ],
      category: 'Accessories',
      tags: ['accessories', 'storage', 'bamboo', 'airtight', 'sustainable'],
      stock: 30,
      isActive: true,
    },
    {
      name: 'Digital Coffee Scale',
      description: 'Precision scale with 0.1g accuracy and built-in timer. Perfect for pour over and espresso. Rechargeable battery included.',
      price: 29.99,
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
      images: [
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
        'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800',
      ],
      category: 'Accessories',
      tags: ['accessories', 'scale', 'digital', 'precision', 'timer'],
      stock: 40,
      isActive: true,
    },

    // Specialty Items
    {
      name: 'Cold Brew Concentrate Kit',
      description: 'Make your own cold brew at home! Includes 1L glass carafe, stainless steel filter, and starter blend. Smooth, low-acid coffee concentrate.',
      price: 44.99,
      imageUrl: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800',
      images: [
        'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800',
        'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800',
      ],
      category: 'Specialty Items',
      tags: ['specialty', 'cold-brew', 'kit', 'concentrate', 'summer'],
      stock: 28,
      isActive: true,
    },
    {
      name: 'Matcha Ceremony Set',
      description: 'Traditional Japanese matcha set with bamboo whisk (chasen), scoop (chashaku), ceramic bowl, and 30g premium ceremonial grade matcha.',
      price: 54.99,
      imageUrl: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=800',
      images: [
        'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=800',
        'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800',
      ],
      category: 'Specialty Items',
      tags: ['specialty', 'matcha', 'tea', 'ceremony', 'japanese', 'traditional'],
      stock: 18,
      isActive: true,
    },
  ];

  let createdCount = 0;
  for (const productData of products) {
    const existing = await prisma.product.findFirst({
      where: { name: productData.name },
    });

    if (!existing) {
      await prisma.product.create({ data: productData });
      createdCount++;
      console.log(`  ✓ Created: ${productData.name}`);
    } else {
      console.log(`  ⊘ Skipped (exists): ${productData.name}`);
    }
  }

  console.log(`\n✅ Seeded ${createdCount} products (${products.length - createdCount} already existed)\n`);

  // Seed Ingredients
  console.log('🍃 Seeding ingredients...');

  const ingredients = [
    // Base Teas
    {
      name: 'Black Tea',
      role: 'base',
      category: 'tea',
      descriptionShort: 'Classic bold black tea with rich, malty flavor',
      descriptionLong: 'A robust black tea with deep amber color and full-bodied character. Offers bold, malty notes with hints of caramel and a smooth finish. Perfect as a base for complex blends.',
      flavorNotes: ['malty', 'bold', 'caramel', 'smooth'],
      caffeineLevel: 'high',
      steepTemperature: 212,
      steepTimeMin: 3,
      steepTimeMax: 5,
      baseAmount: 2.0,
      incrementAmount: 0.5,
      costPerOunce: 0.50,
      inventoryAmount: 100,
      minimumStockLevel: 20,
      status: 'active',
      isBase: true,
      tags: ['black-tea', 'caffeinated', 'base'],
    },
    {
      name: 'Green Tea',
      role: 'base',
      category: 'tea',
      descriptionShort: 'Delicate green tea with grassy, vegetal notes',
      descriptionLong: 'Light and refreshing green tea with a vibrant emerald color. Features delicate grassy and vegetal notes with a subtle sweetness and clean finish.',
      flavorNotes: ['grassy', 'vegetal', 'sweet', 'clean'],
      caffeineLevel: 'medium',
      steepTemperature: 175,
      steepTimeMin: 2,
      steepTimeMax: 3,
      baseAmount: 2.0,
      incrementAmount: 0.5,
      costPerOunce: 0.60,
      inventoryAmount: 80,
      minimumStockLevel: 15,
      status: 'active',
      isBase: true,
      tags: ['green-tea', 'caffeinated', 'base'],
    },
    {
      name: 'White Tea',
      role: 'base',
      category: 'tea',
      descriptionShort: 'Subtle and delicate with floral sweetness',
      descriptionLong: 'The most delicate of teas, white tea offers a subtle, naturally sweet flavor with floral and honey notes. Minimally processed for maximum antioxidants.',
      flavorNotes: ['delicate', 'floral', 'honey', 'sweet'],
      caffeineLevel: 'low',
      steepTemperature: 170,
      steepTimeMin: 4,
      steepTimeMax: 6,
      baseAmount: 2.0,
      incrementAmount: 0.5,
      costPerOunce: 1.20,
      inventoryAmount: 50,
      minimumStockLevel: 10,
      status: 'active',
      isBase: true,
      tags: ['white-tea', 'low-caffeine', 'premium', 'base'],
    },
    {
      name: 'Oolong Tea',
      role: 'base',
      category: 'tea',
      descriptionShort: 'Semi-oxidized tea with complex fruity notes',
      descriptionLong: 'A partially oxidized tea that bridges green and black varieties. Offers complex flavor profiles ranging from floral and fruity to toasty and creamy.',
      flavorNotes: ['fruity', 'floral', 'toasty', 'creamy'],
      caffeineLevel: 'medium',
      steepTemperature: 195,
      steepTimeMin: 3,
      steepTimeMax: 5,
      baseAmount: 2.0,
      incrementAmount: 0.5,
      costPerOunce: 0.80,
      inventoryAmount: 60,
      minimumStockLevel: 12,
      status: 'active',
      isBase: true,
      tags: ['oolong-tea', 'caffeinated', 'base'],
    },
    {
      name: 'Rooibos',
      role: 'base',
      category: 'herbal',
      descriptionShort: 'Naturally sweet, caffeine-free red bush tea',
      descriptionLong: 'South African red bush tea with a naturally sweet, nutty flavor. Completely caffeine-free and rich in antioxidants. Perfect for evening blends.',
      flavorNotes: ['sweet', 'nutty', 'vanilla', 'smooth'],
      caffeineLevel: 'none',
      steepTemperature: 212,
      steepTimeMin: 5,
      steepTimeMax: 7,
      baseAmount: 2.0,
      incrementAmount: 0.5,
      costPerOunce: 0.40,
      inventoryAmount: 90,
      minimumStockLevel: 18,
      status: 'active',
      isBase: true,
      tags: ['rooibos', 'caffeine-free', 'herbal', 'base'],
    },

    // Add-ins - Botanicals
    {
      name: 'Lavender Buds',
      role: 'addIn',
      category: 'botanical',
      descriptionShort: 'Calming floral notes with aromatic sweetness',
      descriptionLong: 'Premium dried lavender buds that add a soothing floral aroma and gentle sweetness. Perfect for relaxation blends.',
      flavorNotes: ['floral', 'sweet', 'calming', 'aromatic'],
      caffeineLevel: 'none',
      baseAmount: 0.25,
      incrementAmount: 0.25,
      costPerOunce: 1.50,
      inventoryAmount: 40,
      minimumStockLevel: 8,
      status: 'active',
      isBase: false,
      tags: ['botanical', 'floral', 'calming'],
    },
    {
      name: 'Rose Petals',
      role: 'addIn',
      category: 'botanical',
      descriptionShort: 'Delicate rose fragrance with subtle sweetness',
      descriptionLong: 'Hand-picked rose petals that infuse blends with a romantic floral essence and visual beauty. Adds elegance to any tea.',
      flavorNotes: ['floral', 'sweet', 'delicate', 'romantic'],
      caffeineLevel: 'none',
      baseAmount: 0.25,
      incrementAmount: 0.25,
      costPerOunce: 2.00,
      inventoryAmount: 35,
      minimumStockLevel: 7,
      status: 'active',
      isBase: false,
      tags: ['botanical', 'floral', 'premium'],
    },
    {
      name: 'Chamomile Flowers',
      role: 'addIn',
      category: 'botanical',
      descriptionShort: 'Soothing apple-like flavor for relaxation',
      descriptionLong: 'Whole chamomile flowers with a gentle apple-like sweetness. Known for calming properties and perfect for bedtime blends.',
      flavorNotes: ['apple', 'sweet', 'soothing', 'honey'],
      caffeineLevel: 'none',
      baseAmount: 0.5,
      incrementAmount: 0.25,
      costPerOunce: 1.00,
      inventoryAmount: 60,
      minimumStockLevel: 12,
      status: 'active',
      isBase: false,
      tags: ['botanical', 'calming', 'bedtime'],
    },
    {
      name: 'Hibiscus Petals',
      role: 'addIn',
      category: 'botanical',
      descriptionShort: 'Tart, cranberry-like flavor with vibrant color',
      descriptionLong: 'Brilliant red hibiscus petals that add a tart, fruity flavor and stunning crimson color to any blend. Rich in vitamin C.',
      flavorNotes: ['tart', 'cranberry', 'fruity', 'tangy'],
      caffeineLevel: 'none',
      baseAmount: 0.25,
      incrementAmount: 0.25,
      costPerOunce: 0.80,
      inventoryAmount: 50,
      minimumStockLevel: 10,
      status: 'active',
      isBase: false,
      tags: ['botanical', 'tart', 'colorful'],
    },

    // Add-ins - Fruits & Spices
    {
      name: 'Dried Lemon Peel',
      role: 'addIn',
      category: 'fruit',
      descriptionShort: 'Bright citrus zest with refreshing tang',
      descriptionLong: 'Organic lemon peel that adds a bright, zesty citrus note and refreshing aroma to blends. Perfect for morning teas.',
      flavorNotes: ['citrus', 'zesty', 'bright', 'refreshing'],
      caffeineLevel: 'none',
      baseAmount: 0.25,
      incrementAmount: 0.25,
      costPerOunce: 0.60,
      inventoryAmount: 45,
      minimumStockLevel: 9,
      status: 'active',
      isBase: false,
      tags: ['fruit', 'citrus', 'refreshing'],
    },
    {
      name: 'Orange Peel',
      role: 'addIn',
      category: 'fruit',
      descriptionShort: 'Sweet citrus with warm, sunny notes',
      descriptionLong: 'Dried orange peel with a sweet, aromatic citrus flavor. Adds warmth and brightness to any blend.',
      flavorNotes: ['citrus', 'sweet', 'warm', 'sunny'],
      caffeineLevel: 'none',
      baseAmount: 0.25,
      incrementAmount: 0.25,
      costPerOunce: 0.60,
      inventoryAmount: 45,
      minimumStockLevel: 9,
      status: 'active',
      isBase: false,
      tags: ['fruit', 'citrus', 'sweet'],
    },
    {
      name: 'Ginger Root',
      role: 'addIn',
      category: 'spice',
      descriptionShort: 'Warming spice with zesty kick',
      descriptionLong: 'Dried ginger root pieces that add a warming, spicy heat and digestive benefits. Perfect for chai-style blends.',
      flavorNotes: ['spicy', 'warming', 'zesty', 'pungent'],
      caffeineLevel: 'none',
      baseAmount: 0.25,
      incrementAmount: 0.25,
      costPerOunce: 0.70,
      inventoryAmount: 55,
      minimumStockLevel: 11,
      status: 'active',
      isBase: false,
      tags: ['spice', 'warming', 'digestive'],
    },
    {
      name: 'Cinnamon Chips',
      role: 'addIn',
      category: 'spice',
      descriptionShort: 'Sweet and spicy with comforting warmth',
      descriptionLong: 'Ceylon cinnamon chips with a naturally sweet, warm spice flavor. Adds depth and complexity to any blend.',
      flavorNotes: ['sweet', 'spicy', 'warm', 'comforting'],
      caffeineLevel: 'none',
      baseAmount: 0.25,
      incrementAmount: 0.25,
      costPerOunce: 0.80,
      inventoryAmount: 50,
      minimumStockLevel: 10,
      status: 'active',
      isBase: false,
      tags: ['spice', 'sweet', 'warming'],
    },
    {
      name: 'Vanilla Bean',
      role: 'addIn',
      category: 'spice',
      descriptionShort: 'Rich, creamy vanilla sweetness',
      descriptionLong: 'Premium vanilla bean pieces that infuse blends with a rich, creamy sweetness and luxurious aroma.',
      flavorNotes: ['sweet', 'creamy', 'rich', 'luxurious'],
      caffeineLevel: 'none',
      baseAmount: 0.25,
      incrementAmount: 0.25,
      costPerOunce: 3.50,
      inventoryAmount: 20,
      minimumStockLevel: 5,
      status: 'active',
      isBase: false,
      tags: ['spice', 'premium', 'sweet', 'luxury'],
    },

    // Add-ins - Premium
    {
      name: 'Jasmine Pearls',
      role: 'addIn',
      category: 'premium',
      descriptionShort: 'Hand-rolled green tea with jasmine blossoms',
      descriptionLong: 'Artisanal hand-rolled green tea pearls scented with fresh jasmine blossoms. Each pearl unfurls into a fragrant, floral infusion.',
      flavorNotes: ['floral', 'jasmine', 'sweet', 'elegant'],
      caffeineLevel: 'medium',
      baseAmount: 0.5,
      incrementAmount: 0.25,
      costPerOunce: 4.00,
      inventoryAmount: 15,
      minimumStockLevel: 3,
      status: 'active',
      isBase: false,
      tags: ['premium', 'jasmine', 'artisanal', 'floral'],
    },
    {
      name: 'Butterfly Pea Flower',
      role: 'addIn',
      category: 'premium',
      descriptionShort: 'Color-changing flowers with earthy notes',
      descriptionLong: 'Magical blue flowers that create stunning color-changing effects. Turns blue, then purple or pink with citrus. Earthy, slightly sweet flavor.',
      flavorNotes: ['earthy', 'sweet', 'mild', 'magical'],
      caffeineLevel: 'none',
      baseAmount: 0.25,
      incrementAmount: 0.25,
      costPerOunce: 2.50,
      inventoryAmount: 25,
      minimumStockLevel: 5,
      status: 'active',
      isBase: false,
      tags: ['premium', 'color-changing', 'visual', 'unique'],
    },
    {
      name: 'Saffron Threads',
      role: 'addIn',
      category: 'premium',
      descriptionShort: 'Luxurious golden threads with honey notes',
      descriptionLong: 'The world\'s most precious spice. Adds a subtle honey-like sweetness, golden color, and sophisticated depth to premium blends.',
      flavorNotes: ['honey', 'floral', 'luxurious', 'subtle'],
      caffeineLevel: 'none',
      baseAmount: 0.1,
      incrementAmount: 0.1,
      costPerOunce: 15.00,
      inventoryAmount: 5,
      minimumStockLevel: 1,
      status: 'active',
      isBase: false,
      tags: ['premium', 'luxury', 'rare', 'exotic'],
    },
  ];

  let ingredientCount = 0;
  for (const ingredientData of ingredients) {
    const existing = await prisma.ingredient.findFirst({
      where: { name: ingredientData.name },
    });

    if (!existing) {
      await prisma.ingredient.create({ data: ingredientData });
      ingredientCount++;
      console.log(`  ✓ Created: ${ingredientData.name} (${ingredientData.role})`);
    } else {
      console.log(`  ⊘ Skipped (exists): ${ingredientData.name}`);
    }
  }

  console.log(`\n✅ Seeded ${ingredientCount} ingredients (${ingredients.length - ingredientCount} already existed)\n`);
  console.log('🌱 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
