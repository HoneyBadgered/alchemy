'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { Header } from '@/components/layout';
import { useCart } from '@/contexts/CartContext';
import { useIngredients, getIngredientById } from '@/hooks/useIngredients';
import type { ExtendedBlendState } from '@/components/blending/types';
import { useBlendPricing } from '@/components/blending/useBlendPricing';
import { ShareBlend } from '@/components/ShareBlend';

// Default empty blend state for pricing calculation
const EMPTY_BLEND_STATE: ExtendedBlendState = {
  baseTeaId: undefined,
  addIns: [],
  blendName: '',
  size: 2,
};

// Zone color mappings
const ZONE_COLORS = {
  'The Hearthhouse': { bg: 'from-amber-900/20 to-orange-900/20', accent: 'amber-600', text: 'amber-900' },
  'The Conservatory': { bg: 'from-emerald-900/20 to-green-900/20', accent: 'emerald-600', text: 'emerald-900' },
  'The East Pavilion': { bg: 'from-cyan-900/20 to-blue-900/20', accent: 'cyan-600', text: 'cyan-900' },
  'The Observatory': { bg: 'from-indigo-900/20 to-purple-900/20', accent: 'indigo-600', text: 'indigo-900' },
  'The Liminal Tent': { bg: 'from-pink-900/20 to-rose-900/20', accent: 'pink-600', text: 'pink-900' },
};

export default function BlendReviewPage() {
  const router = useRouter();
  const { addBlendToCart, isLoading } = useCart();
  const { bases, addIns } = useIngredients();
  const [blendState, setBlendState] = useState<ExtendedBlendState | null>(null);
  const [blendName, setBlendName] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNoteField, setShowNoteField] = useState(false);
  const [privateNote, setPrivateNote] = useState('');
  const [showIngredientsExpanded, setShowIngredientsExpanded] = useState(false);

  // Parse blend state from sessionStorage
  useEffect(() => {
    const storedBlend = sessionStorage.getItem('pendingBlend');
    if (storedBlend) {
      try {
        const parsed = JSON.parse(storedBlend);
        setBlendState(parsed);
        setBlendName(parsed.blendName || '');
      } catch (e) {
        console.error('Failed to parse blend state:', e);
        setError('Invalid blend data. Please try creating your blend again.');
      }
    } else {
      setError('No blend found. Please create a blend first.');
    }
  }, []);

  // Add steam animation keyframes on client side
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rise {
        0%, 100% { 
          transform: translateY(0) scale(1);
          opacity: 0.2;
        }
        50% { 
          transform: translateY(-20px) scale(0.8);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const pricing = useBlendPricing(blendState || EMPTY_BLEND_STATE);

  const baseTea = blendState?.baseTeaId ? getIngredientById(blendState.baseTeaId, bases, addIns) : null;

  const handleAddToCart = async () => {
    if (!blendState?.baseTeaId) {
      setError('No base tea selected');
      return;
    }

    if (!blendName.trim()) {
      setError('Please name your blend');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      console.log('Adding blend to cart:', {
        baseTeaId: blendState.baseTeaId,
        addIns: blendState.addIns,
        blendName: blendName.trim(),
      });
      // baseTeaId is guaranteed to be defined after the guard above
      await addBlendToCart(blendState.baseTeaId, blendState.addIns, blendName.trim());
      // Clear the pending blend from storage
      sessionStorage.removeItem('pendingBlend');
      // Navigate to cart
      router.push('/cart');
    } catch (e) {
      console.error('Failed to add blend to cart:', e);
      setError('Failed to add blend to cart. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditBlend = () => {
    // Update blend state in storage with the current blend name before going back
    if (blendState) {
      const updatedBlend = { ...blendState, blendName };
      sessionStorage.setItem('pendingBlend', JSON.stringify(updatedBlend));
    }
    router.push('/table');
  };

  if (error && !blendState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 pb-20">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
            <button
              onClick={() => router.push('/table')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Create a Blend
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!blendState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-purple-900 text-lg">Loading blend...</div>
      </div>
    );
  }

  // Generate dynamic meta description for sharing
  const shareDescription = `${blendState.size} oz custom tea blend with ${baseTea?.name || 'base tea'} and ${blendState.addIns.length} special ingredients. Created at The Alchemy Table ✨`;

  // Helper functions
  const getFlavorSummary = () => {
    if (!baseTea) return '';
    const flavors: string[] = [];
    if (baseTea.flavorProfile) {
      const profile = baseTea.flavorProfile as any;
      if (profile.earthy > 30) flavors.push('Earthy');
      if (profile.floral > 30) flavors.push('Floral');
      if (profile.citrus > 20) flavors.push('Citrus');
      if (profile.sweet > 25) flavors.push('Sweet');
    }
    // Add up to 2 add-in flavors
    blendState.addIns.slice(0, 2).forEach(addIn => {
      const ingredient = getIngredientById(addIn.ingredientId, bases, addIns);
      if (ingredient?.category) {
        const cat = ingredient.category.charAt(0).toUpperCase() + ingredient.category.slice(1);
        if (!flavors.includes(cat)) flavors.push(cat);
      }
    });
    return flavors.slice(0, 3).join(' · ');
  };

  // Get brew guidance based on base tea
  const getBrewGuidance = () => {
    if (!baseTea) return null;
    const temps: Record<string, string> = {
      'black': '200-212°F',
      'green': '160-180°F',
      'white': '160-175°F',
      'oolong': '185-205°F',
      'herbal': '212°F',
    };
    const times: Record<string, string> = {
      'black': '3-5 min',
      'green': '2-3 min',
      'white': '4-5 min',
      'oolong': '3-4 min',
      'herbal': '5-7 min',
    };
    const category = baseTea.category?.toLowerCase() || 'herbal';
    return {
      temp: temps[category] || '200°F',
      time: times[category] || '3-5 min',
      note: 'Adjust to taste. Multiple steepings recommended.',
    };
  };

  const brewGuidance = getBrewGuidance();
  const flavorSummary = getFlavorSummary();

  return (
    <>
      <Head>
        <title>{blendName || 'Custom Tea Blend'} - The Alchemy Table</title>
        <meta name="description" content={shareDescription} />
        <meta property="og:title" content={`${blendName || 'My Custom Tea Blend'} - The Alchemy Table`} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:type" content="article" />
        <meta name="twitter:title" content={`${blendName || 'My Custom Tea Blend'} - The Alchemy Table`} />
        <meta name="twitter:description" content={shareDescription} />
      </Head>
      
      <Header />
      
      {/* Immersive Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-purple-900/40 to-slate-900 -z-10" />
      <div className="fixed inset-0 bg-[url('/images/tea-steam.png')] opacity-5 -z-10" />
      
      <div className="min-h-screen relative pt-16">
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-8 py-16 min-h-screen">
          
          {/* LEFT: Blend Identity */}
          <div className="space-y-8 flex flex-col justify-center">
            {/* Editable Blend Name */}
            <div>
              <input
                type="text"
                value={blendName}
                onChange={(e) => setBlendName(e.target.value)}
                placeholder="Name your blend"
                className="w-full text-4xl font-serif font-bold text-white bg-transparent border-b-2 border-white/20 focus:border-amber-400/60 outline-none pb-3 placeholder-white/30 transition-colors"
                maxLength={50}
              />
              <p className="text-white/50 text-sm mt-2">{blendState.size} oz</p>
            </div>

            {/* Zone Badge */}
            <div>
              <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/90 text-sm font-medium">
                The Conservatory
              </span>
            </div>

            {/* Flavor Summary */}
            {flavorSummary && (
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Flavor Profile</p>
                <p className="text-xl text-amber-200/90 font-light tracking-wide">{flavorSummary}</p>
              </div>
            )}

            {/* Private Note */}
            <div>
              {!showNoteField ? (
                <button
                  onClick={() => setShowNoteField(true)}
                  className="text-white/50 hover:text-white/80 text-sm underline decoration-dotted transition-colors"
                >
                  + Why did you make this?
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="text-white/60 text-xs uppercase tracking-wider">Private Note</label>
                  <textarea
                    value={privateNote}
                    onChange={(e) => setPrivateNote(e.target.value)}
                    placeholder="For your eyes only..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 outline-none focus:border-amber-400/40 resize-none transition-colors"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          {/* CENTER: Blend Visual */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Main Cup Visual */}
              <div className="w-64 h-64 relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
                
                {/* Cup */}
                <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-b from-amber-900/40 to-amber-950/60 border-4 border-amber-700/40 backdrop-blur-sm shadow-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">{baseTea?.emoji || '🍵'}</div>
                    <div className="text-white/40 text-xs uppercase tracking-widest">Complete</div>
                  </div>
                </div>

                {/* Subtle Steam Animation */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4">
                  <div className="flex gap-1">
                    <div className="w-1 h-8 bg-white/20 rounded-full animate-[rise_3s_ease-in-out_infinite]" />
                    <div className="w-1 h-6 bg-white/15 rounded-full animate-[rise_3s_ease-in-out_0.5s_infinite]" />
                    <div className="w-1 h-7 bg-white/20 rounded-full animate-[rise_3s_ease-in-out_1s_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Composition & Facts */}
          <div className="space-y-6 flex flex-col justify-center">
            
            {/* Ingredients List */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-white/60 text-xs uppercase tracking-wider mb-4">Composition</h3>
              <div className="space-y-3">
                {/* Base Tea */}
                {baseTea && (
                  <div className="flex items-start gap-3 pb-3 border-b border-white/10">
                    <span className="text-2xl">{baseTea.emoji}</span>
                    <div className="flex-1">
                      <div className="text-white font-medium">{baseTea.name}</div>
                      <div className="text-white/40 text-xs">Base · ~5g</div>
                    </div>
                  </div>
                )}
                
                {/* Add-ins */}
                {blendState.addIns.slice(0, 3).map((addIn) => {
                  const ingredient = getIngredientById(addIn.ingredientId, bases, addIns);
                  if (!ingredient) return null;
                  return (
                    <div key={addIn.ingredientId} className="flex items-start gap-3">
                      <span className="text-xl">{ingredient.emoji}</span>
                      <div className="flex-1">
                        <div className="text-white/90 text-sm">{ingredient.name}</div>
                        <div className="text-white/40 text-xs">Add-in · {addIn.quantity.toFixed(1)}g</div>
                      </div>
                    </div>
                  );
                })}

                {blendState.addIns.length > 3 && (
                  <button
                    onClick={() => setShowIngredientsExpanded(!showIngredientsExpanded)}
                    className="text-white/50 hover:text-white/80 text-xs underline decoration-dotted transition-colors"
                  >
                    {showIngredientsExpanded ? 'Show less' : `+${blendState.addIns.length - 3} more ingredients`}
                  </button>
                )}

                {showIngredientsExpanded && blendState.addIns.slice(3).map((addIn) => {
                  const ingredient = getIngredientById(addIn.ingredientId, bases, addIns);
                  if (!ingredient) return null;
                  return (
                    <div key={addIn.ingredientId} className="flex items-start gap-3">
                      <span className="text-xl">{ingredient.emoji}</span>
                      <div className="flex-1">
                        <div className="text-white/90 text-sm">{ingredient.name}</div>
                        <div className="text-white/40 text-xs">Add-in · {addIn.quantity.toFixed(1)}g</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Caffeine Level */}
            {baseTea && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-white/60 text-xs uppercase tracking-wider mb-3">Caffeine</h3>
                <div className="flex items-center gap-3">
                  {baseTea.caffeineLevel === 'none' && (
                    <>
                      <div className="flex gap-1">
                        <div className="w-2 h-6 bg-white/10 rounded" />
                        <div className="w-2 h-6 bg-white/10 rounded" />
                        <div className="w-2 h-6 bg-white/10 rounded" />
                      </div>
                      <div>
                        <div className="text-white">Caffeine-free</div>
                        <div className="text-white/40 text-xs">0mg per cup</div>
                      </div>
                    </>
                  )}
                  {baseTea.caffeineLevel === 'low' && (
                    <>
                      <div className="flex gap-1">
                        <div className="w-2 h-6 bg-amber-400 rounded" />
                        <div className="w-2 h-6 bg-white/10 rounded" />
                        <div className="w-2 h-6 bg-white/10 rounded" />
                      </div>
                      <div>
                        <div className="text-white">Low</div>
                        <div className="text-white/40 text-xs">15-30mg per cup</div>
                      </div>
                    </>
                  )}
                  {baseTea.caffeineLevel === 'medium' && (
                    <>
                      <div className="flex gap-1">
                        <div className="w-2 h-6 bg-amber-400 rounded" />
                        <div className="w-2 h-6 bg-amber-400 rounded" />
                        <div className="w-2 h-6 bg-white/10 rounded" />
                      </div>
                      <div>
                        <div className="text-white">Medium</div>
                        <div className="text-white/40 text-xs">30-50mg per cup</div>
                      </div>
                    </>
                  )}
                  {baseTea.caffeineLevel === 'high' && (
                    <>
                      <div className="flex gap-1">
                        <div className="w-2 h-6 bg-amber-400 rounded" />
                        <div className="w-2 h-6 bg-amber-400 rounded" />
                        <div className="w-2 h-6 bg-amber-400 rounded" />
                      </div>
                      <div>
                        <div className="text-white">High</div>
                        <div className="text-white/40 text-xs">50-70mg per cup</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Brew Guidance */}
            {brewGuidance && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-white/60 text-xs uppercase tracking-wider mb-3">Brew Guidance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Temperature</span>
                    <span className="text-white text-sm font-medium">{brewGuidance.temp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Steep Time</span>
                    <span className="text-white text-sm font-medium">{brewGuidance.time}</span>
                  </div>
                  <p className="text-white/40 text-xs mt-3 italic">{brewGuidance.note}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden px-4 py-8 pb-32 space-y-8">
          {/* Blend Visual */}
          <div className="flex justify-center py-8">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative z-10 w-48 h-48 rounded-full bg-gradient-to-b from-amber-900/40 to-amber-950/60 border-4 border-amber-700/40 backdrop-blur-sm shadow-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-2">{baseTea?.emoji || '🍵'}</div>
                  <div className="text-white/40 text-xs uppercase tracking-widest">Complete</div>
                </div>
              </div>
            </div>
          </div>

          {/* Blend Name */}
          <div>
            <input
              type="text"
              value={blendName}
              onChange={(e) => setBlendName(e.target.value)}
              placeholder="Name your blend"
              className="w-full text-3xl font-serif font-bold text-white text-center bg-transparent border-b-2 border-white/20 focus:border-amber-400/60 outline-none pb-3 placeholder-white/30 transition-colors"
              maxLength={50}
            />
            <p className="text-white/50 text-sm mt-2 text-center">{blendState.size} oz</p>
          </div>

          {/* Zone Badge */}
          <div className="flex justify-center">
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/90 text-sm font-medium">
              The Conservatory
            </span>
          </div>

          {/* Flavor Summary */}
          {flavorSummary && (
            <div className="text-center">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Flavor Profile</p>
              <p className="text-lg text-amber-200/90 font-light tracking-wide">{flavorSummary}</p>
            </div>
          )}

          {/* Ingredients (Accordion) */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <button
              onClick={() => setShowIngredientsExpanded(!showIngredientsExpanded)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="text-white/60 text-xs uppercase tracking-wider">Composition</h3>
              <svg
                className={`w-5 h-5 text-white/60 transition-transform ${showIngredientsExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showIngredientsExpanded && (
              <div className="mt-4 space-y-3">
                {baseTea && (
                  <div className="flex items-start gap-3 pb-3 border-b border-white/10">
                    <span className="text-2xl">{baseTea.emoji}</span>
                    <div className="flex-1">
                      <div className="text-white font-medium">{baseTea.name}</div>
                      <div className="text-white/40 text-xs">Base · ~5g</div>
                    </div>
                  </div>
                )}
                
                {blendState.addIns.map((addIn) => {
                  const ingredient = getIngredientById(addIn.ingredientId, bases, addIns);
                  if (!ingredient) return null;
                  return (
                    <div key={addIn.ingredientId} className="flex items-start gap-3">
                      <span className="text-xl">{ingredient.emoji}</span>
                      <div className="flex-1">
                        <div className="text-white/90 text-sm">{ingredient.name}</div>
                        <div className="text-white/40 text-xs">Add-in · {addIn.quantity.toFixed(1)}g</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Caffeine & Brew Info */}
          <div className="space-y-4">
            {baseTea && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-white/60 text-xs uppercase tracking-wider mb-3">Caffeine</h3>
                <div className="flex items-center gap-3">
                  {baseTea.caffeineLevel === 'none' && (
                    <>
                      <div className="flex gap-1">
                        <div className="w-2 h-6 bg-white/10 rounded" />
                        <div className="w-2 h-6 bg-white/10 rounded" />
                        <div className="w-2 h-6 bg-white/10 rounded" />
                      </div>
                      <div>
                        <div className="text-white">Caffeine-free</div>
                        <div className="text-white/40 text-xs">0mg per cup</div>
                      </div>
                    </>
                  )}
                  {baseTea.caffeineLevel === 'low' && (
                    <>
                      <div className="flex gap-1">
                        <div className="w-2 h-6 bg-amber-400 rounded" />
                        <div className="w-2 h-6 bg-white/10 rounded" />
                        <div className="w-2 h-6 bg-white/10 rounded" />
                      </div>
                      <div>
                        <div className="text-white">Low</div>
                        <div className="text-white/40 text-xs">15-30mg per cup</div>
                      </div>
                    </>
                  )}
                  {baseTea.caffeineLevel === 'medium' && (
                    <>
                      <div className="flex gap-1">
                        <div className="w-2 h-6 bg-amber-400 rounded" />
                        <div className="w-2 h-6 bg-amber-400 rounded" />
                        <div className="w-2 h-6 bg-white/10 rounded" />
                      </div>
                      <div>
                        <div className="text-white">Medium</div>
                        <div className="text-white/40 text-xs">30-50mg per cup</div>
                      </div>
                    </>
                  )}
                  {baseTea.caffeineLevel === 'high' && (
                    <>
                      <div className="flex gap-1">
                        <div className="w-2 h-6 bg-amber-400 rounded" />
                        <div className="w-2 h-6 bg-amber-400 rounded" />
                        <div className="w-2 h-6 bg-amber-400 rounded" />
                      </div>
                      <div>
                        <div className="text-white">High</div>
                        <div className="text-white/40 text-xs">50-70mg per cup</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {brewGuidance && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-white/60 text-xs uppercase tracking-wider mb-3">Brew Guidance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Temperature</span>
                    <span className="text-white text-sm font-medium">{brewGuidance.temp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Steep Time</span>
                    <span className="text-white text-sm font-medium">{brewGuidance.time}</span>
                  </div>
                  <p className="text-white/40 text-xs mt-3 italic">{brewGuidance.note}</p>
                </div>
              </div>
            )}
          </div>

          {/* Private Note */}
          <div>
            {!showNoteField ? (
              <button
                onClick={() => setShowNoteField(true)}
                className="text-white/50 hover:text-white/80 text-sm underline decoration-dotted transition-colors"
              >
                + Why did you make this?
              </button>
            ) : (
              <div className="space-y-2">
                <label className="text-white/60 text-xs uppercase tracking-wider">Private Note</label>
                <textarea
                  value={privateNote}
                  onChange={(e) => setPrivateNote(e.target.value)}
                  placeholder="For your eyes only..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 outline-none focus:border-amber-400/40 resize-none transition-colors"
                  rows={3}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-200 rounded-xl p-4 text-center text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/10 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Adjust Blend (Secondary) */}
              <button
                onClick={handleEditBlend}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg font-medium transition-all border border-white/20"
              >
                Adjust Blend
              </button>

              <div className="flex items-center gap-3">
                {/* Share (Icon Only) */}
                <div className="hidden sm:block">
                  <ShareBlend 
                    blendName={blendName || 'My Custom Blend'} 
                    blendDetails={`${blendState.size} oz blend with ${baseTea?.name || 'base tea'} and ${blendState.addIns.length} special ingredients`}
                  />
                </div>

                {/* Save to Library (Primary) */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || isLoading || !blendName.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAdding ? 'Saving...' : 'Save to Library'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
