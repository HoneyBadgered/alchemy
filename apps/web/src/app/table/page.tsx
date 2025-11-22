'use client';

import BottomNavigation from '@/components/BottomNavigation';
import { AlchemyTableScene } from '@/components/alchemy-table';

export default function TablePage() {
  return (
    <div className="min-h-screen">
      <AlchemyTableScene />
      <BottomNavigation />
    </div>
  );
}
