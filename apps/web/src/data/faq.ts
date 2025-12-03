/**
 * Static FAQ data.
 * In production, this would come from a CMS or API.
 */

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const faqItems: FAQItem[] = [
  // Orders & Shipping
  {
    id: 'shipping-time',
    question: 'How long does shipping take?',
    answer: 'Standard shipping typically takes 3-5 business days within the continental US. Express shipping (1-2 business days) is available at checkout. International orders may take 7-14 business days depending on destination.',
    category: 'Orders & Shipping',
  },
  {
    id: 'shipping-cost',
    question: 'What are the shipping costs?',
    answer: 'We offer free standard shipping on orders over $50. For orders under $50, shipping starts at $5.99. Express shipping is available for $12.99. International shipping rates vary by destination.',
    category: 'Orders & Shipping',
  },
  {
    id: 'track-order',
    question: 'How can I track my order?',
    answer: 'Once your order ships, you\'ll receive an email with tracking information. You can also track your order by logging into your account and visiting the Orders section.',
    category: 'Orders & Shipping',
  },
  {
    id: 'international-shipping',
    question: 'Do you ship internationally?',
    answer: 'Yes! We ship to most countries worldwide. International shipping rates and delivery times are calculated at checkout based on your location.',
    category: 'Orders & Shipping',
  },

  // Products
  {
    id: 'product-freshness',
    question: 'How fresh are your products?',
    answer: 'All our blends are made to order or from recently roasted/processed ingredients. We date every package so you know exactly when it was prepared. Most products are best used within 2-4 weeks of the roast/blend date for optimal freshness.',
    category: 'Products',
  },
  {
    id: 'ingredients-sourcing',
    question: 'Where do you source your ingredients?',
    answer: 'We partner with ethical farms and suppliers from around the world. Our coffee comes from specialty-grade farms in Ethiopia, Colombia, Guatemala, and more. Our teas and herbs are sourced from trusted growers who share our commitment to quality and sustainability.',
    category: 'Products',
  },
  {
    id: 'organic-products',
    question: 'Are your products organic?',
    answer: 'Many of our products are certified organic, which is indicated on the product page. We prioritize organic and sustainably-grown ingredients whenever possible, even when formal certification isn\'t available.',
    category: 'Products',
  },
  {
    id: 'allergens',
    question: 'Do your products contain allergens?',
    answer: 'We clearly label all ingredients and potential allergens on each product page and package. If you have specific allergy concerns, please contact us before ordering and we\'ll help you find suitable options.',
    category: 'Products',
  },

  // Custom Blends
  {
    id: 'create-blend',
    question: 'How do I create a custom blend?',
    answer: 'Visit our "Create Your Blend" page (The Alchemy Table) to design your own unique blend. Select your base, add complementary ingredients, and adjust proportions using our intuitive interface. You can save your recipes and order them anytime.',
    category: 'Custom Blends',
  },
  {
    id: 'blend-minimum',
    question: 'Is there a minimum order for custom blends?',
    answer: 'Custom blends start at a minimum of 4oz (approximately 10-12 servings). This ensures each blend is properly mixed and allows you to enjoy your creation over multiple sessions.',
    category: 'Custom Blends',
  },
  {
    id: 'save-blend',
    question: 'Can I save my custom blend recipes?',
    answer: 'Yes! Create an account to save unlimited blend recipes to your profile. You can name them, add notes, and reorder with a single click. You can also share your creations with friends.',
    category: 'Custom Blends',
  },

  // Account & Rewards
  {
    id: 'rewards-program',
    question: 'How does the rewards program work?',
    answer: 'Earn XP (experience points) with every purchase and action on the site. Level up to unlock achievements, exclusive blends, discounts, and more. Complete quests for bonus XP. Check your profile to see your progress!',
    category: 'Account & Rewards',
  },
  {
    id: 'account-benefits',
    question: 'What are the benefits of creating an account?',
    answer: 'Account holders can save custom blend recipes, track orders, earn rewards XP, save items to wishlists, access order history, and receive personalized recommendations. Plus, checkout is faster with saved addresses and payment methods.',
    category: 'Account & Rewards',
  },
  {
    id: 'reset-password',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page and enter your email address. We\'ll send you a link to create a new password. The link expires after 24 hours for security.',
    category: 'Account & Rewards',
  },

  // Returns & Refunds
  {
    id: 'return-policy',
    question: 'What is your return policy?',
    answer: 'We want you to love your purchase! If you\'re not satisfied, contact us within 30 days of delivery. For unopened items, we offer a full refund or exchange. For opened items, we\'ll work with you to find a solution — this might include a partial refund, store credit, or replacement.',
    category: 'Returns & Refunds',
  },
  {
    id: 'damaged-items',
    question: 'What if my order arrives damaged?',
    answer: 'Contact us immediately with photos of the damage and we\'ll send a replacement at no cost. We carefully package all orders, but sometimes accidents happen in transit. We\'ll make it right.',
    category: 'Returns & Refunds',
  },
  {
    id: 'refund-timeline',
    question: 'How long do refunds take?',
    answer: 'Once we receive your return or approve your refund request, processing takes 3-5 business days. The refund will appear on your original payment method within 5-10 business days after that, depending on your bank.',
    category: 'Returns & Refunds',
  },
];

export function getFAQByCategory(category: string): FAQItem[] {
  return faqItems.filter((item) => item.category === category);
}

export function getAllFAQCategories(): string[] {
  return [...new Set(faqItems.map((item) => item.category))];
}

export function searchFAQ(query: string): FAQItem[] {
  const lowerQuery = query.toLowerCase();
  return faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(lowerQuery) ||
      item.answer.toLowerCase().includes(lowerQuery)
  );
}
