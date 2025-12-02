'use client';

import { BlendingPage } from '@/components/blending';

export default function TablePage() {
  const handleBack = () => {
    // Navigate back to shop/library
    window.location.href = '/shop';
  };

  return <BlendingPage onBack={handleBack} />;
}
