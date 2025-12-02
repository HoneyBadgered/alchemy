'use client';

import { useRouter } from 'next/navigation';
import { BlendingPage } from '@/components/blending';
import type { ExtendedBlendState } from '@/components/blending/types';

export default function TablePage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/shop');
  };

  const handleContinue = (blendState: ExtendedBlendState) => {
    // Store blend state in sessionStorage and navigate to review page
    sessionStorage.setItem('pendingBlend', JSON.stringify(blendState));
    router.push('/table/review');
  };

  return <BlendingPage onBack={handleBack} onContinue={handleContinue} />;
}
