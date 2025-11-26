/**
 * Seed script for The Alchemy Table database
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

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
