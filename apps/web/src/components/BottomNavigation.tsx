'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

const navItems = [
  { href: '/table', label: 'Table', icon: '🧪' },
  { href: '/inventory', label: 'Inventory', icon: '📦' },
  { href: '/shop', label: 'Shop', icon: '🛒' },
  { href: '/appearance', label: 'Style', icon: '✨' },
  { href: '/labels', label: 'Labels', icon: '🏷️' },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const isShop = item.href === '/shop';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full relative ${
                  isActive ? 'text-purple-600' : 'text-gray-600'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                {isShop && itemCount > 0 && (
                  <span className="absolute top-2 right-1/4 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
