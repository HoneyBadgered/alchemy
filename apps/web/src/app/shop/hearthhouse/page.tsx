'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { apiClient } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  stock: number;
  flavorNotes?: string[];
  caffeineLevel?: 'none' | 'low' | 'medium' | 'high';
  teaType?: string;
  occasion?: string[];
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

interface Zone {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  theme: string;
  gradient: string;
  bgGradient: string;
  accentColor: string;
  heroImageUrl?: string;
  buttonImageUrl?: string;
  defaultFilters: {
    flavorProfile: string[];
    caffeineLevel: string[];
  };
  subTabs: Array<{
    id: string;
    label: string;
    bias: string[] | null;
  }>;
  sortOrder: number;
  isActive: boolean;
}

type SubTab = 'all' | 'deep' | 'spiced' | 'mellow';

const ZONE_FALLBACK = {
  name: 'The Hearthhouse',
  tagline: 'Dark, smoky, grounding',
  theme: 'Where warmth gathers and stories linger',
  gradient: 'from-amber-900 via-orange-800 to-red-900',
  bgColor: 'bg-gradient-to-br from-orange-950/40 via-red-950/30 to-amber-950/40',
  accentColor: 'amber-600',
  heroImageUrl: undefined,
  defaultFilters: {
    flavorProfile: ['smoky', 'roasted'],
    caffeineLevel: ['medium', 'high'],
  },
  subTabs: [
    { id: 'all' as SubTab, label: 'All', bias: null },
    { id: 'deep' as SubTab, label: 'Deep', bias: ['smoky', 'roasted', 'earthy'] },
    { id: 'spiced' as SubTab, label: 'Spiced', bias: ['spiced', 'warming'] },
    { id: 'mellow' as SubTab, label: 'Mellow', bias: ['mellow', 'smooth'] },
  ],
};

const CAFFEINE_ICONS = {
  none: '○',
  low: '◔',
  medium: '◑',
  high: '●',
};

export default function HeathhousePage() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedTeaTypes, setSelectedTeaTypes] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedCaffeine, setSelectedCaffeine] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [specialConstraints, setSpecialConstraints] = useState<string[]>([]);

  // Fetch zone data
  const { data: zoneData } = useQuery<Zone>({
    queryKey: ['zone', 'hearthhouse'],
    queryFn: async () => {
      const response = await apiClient.get<{ zones: Zone[] }>('/zones');
      return response.zones.find(z => z.slug === 'hearthhouse') || ZONE_FALLBACK as any;
    },
  });

  const ZONE = zoneData || ZONE_FALLBACK;

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ['products', ZONE.name],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('perPage', '50');
      params.set('zone', 'The Hearthhouse');
      
      console.log('Fetching products with params:', params.toString());
      
      const response = await apiClient.get<ProductsResponse>(
        `/catalog/products?${params.toString()}`
      );
      
      console.log('Products response:', response);
      console.log('Products count:', response.products?.length);
      
      return response;
    },
  });

  // Extract available filter options from actual products
  const availableFilters = useMemo(() => {
    if (!data?.products) return {
      teaTypes: [],
      flavors: [],
      caffeineLevels: [],
      occasions: [],
    };

    const products = data.products;
    const teaTypes = new Set<string>();
    const flavors = new Set<string>();
    const caffeineLevels = new Set<string>();
    const occasions = new Set<string>();

    products.forEach(product => {
      if (product.teaType) teaTypes.add(product.teaType);
      if (product.caffeineLevel) caffeineLevels.add(product.caffeineLevel);
      product.flavorNotes?.forEach(note => flavors.add(note));
      product.occasion?.forEach(occ => occasions.add(occ));
    });

    return {
      teaTypes: Array.from(teaTypes).sort(),
      flavors: Array.from(flavors).sort(),
      caffeineLevels: Array.from(caffeineLevels).sort(),
      occasions: Array.from(occasions).sort(),
    };
  }, [data?.products]);

  // Apply filters and sub-tab bias
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];

    console.log('Filtering products. Initial count:', data.products.length);
    console.log('First product stock:', data.products[0]?.stock);
    console.log('All product stocks:', data.products.map(p => ({name: p.name, stock: p.stock})));
    
    let filtered = data.products.filter(p => p.stock > 0);
    console.log('After stock filter (stock > 0):', filtered.length);

    // Apply tea type filter
    if (selectedTeaTypes.length > 0) {
      filtered = filtered.filter(p => 
        p.teaType && selectedTeaTypes.includes(p.teaType)
      );
      console.log('After tea type filter:', filtered.length);
    }

    // Apply flavor profile filter
    if (selectedFlavors.length > 0) {
      console.log('Selected flavors:', selectedFlavors);
      console.log('Products before flavor filter:', filtered.length);
      filtered = filtered.filter(p =>
        p.flavorNotes?.some(note => selectedFlavors.includes(note))
      );
      console.log('After flavor filter:', filtered.length);
    }

    // Apply caffeine level filter
    if (selectedCaffeine.length > 0) {
      console.log('Selected caffeine:', selectedCaffeine);
      console.log('Products before caffeine filter:', filtered.length);
      filtered = filtered.filter(p =>
        p.caffeineLevel && selectedCaffeine.includes(p.caffeineLevel)
      );
      console.log('After caffeine filter:', filtered.length);
    }

    // Apply occasion filter
    if (selectedOccasions.length > 0) {
      filtered = filtered.filter(p =>
        p.occasion?.some(occ => selectedOccasions.includes(occ))
      );
    }

    // Apply special constraints
    if (specialConstraints.includes('caffeine-free')) {
      filtered = filtered.filter(p => p.caffeineLevel === 'none');
    }
    if (specialConstraints.includes('no-flavorings')) {
      filtered = filtered.filter(p => !p.flavorNotes || p.flavorNotes.length === 0);
    }

    // Apply sub-tab bias (soft filter - prioritize but don't exclude)
    const currentTab = ZONE.subTabs.find(tab => tab.id === activeSubTab);
    if (currentTab?.bias) {
      filtered.sort((a, b) => {
        const aMatch = a.flavorNotes?.some(note => currentTab.bias?.includes(note)) ? 1 : 0;
        const bMatch = b.flavorNotes?.some(note => currentTab.bias?.includes(note)) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    return filtered;
  }, [data?.products, selectedTeaTypes, selectedFlavors, selectedCaffeine, selectedOccasions, specialConstraints, activeSubTab]);

  const resetFilters = () => {
    setSelectedTeaTypes([]);
    setSelectedFlavors(ZONE.defaultFilters.flavorProfile);
    setSelectedCaffeine(ZONE.defaultFilters.caffeineLevel);
    setSelectedOccasions([]);
    setSpecialConstraints([]);
    setActiveSubTab('all');
  };

  const activeFilterCount = 
    selectedTeaTypes.length +
    (JSON.stringify(selectedFlavors.sort()) !== JSON.stringify(ZONE.defaultFilters.flavorProfile.sort()) ? 1 : 0) +
    (JSON.stringify(selectedCaffeine.sort()) !== JSON.stringify(ZONE.defaultFilters.caffeineLevel.sort()) ? 1 : 0) +
    selectedOccasions.length +
    specialConstraints.length;

  const toggleFilter = (value: string, selected: string[], setter: (val: string[]) => void) => {
    if (selected.includes(value)) {
      setter(selected.filter(v => v !== value));
    } else {
      setter([...selected, value]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950">
      <Header />
      
      {/* Zone Hero - Compact */}
      <div className={`relative mt-16 overflow-hidden bg-gradient-to-r ${ZONE.gradient}`}>
        {/* Atmospheric background effect */}
        {!ZONE.heroImageUrl && (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,200,100,0.3),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,150,50,0.2),transparent_40%)]" />
          </div>
        )}
        
        <div className="relative max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-white mb-3 tracking-tight">
            {ZONE.name}
          </h1>
          <p className="text-xl text-amber-100 italic font-light mb-1">
            {ZONE.tagline}
          </p>
          <p className="text-base text-white/70 max-w-2xl mx-auto">
            {ZONE.theme}
          </p>
        </div>
      </div>

      {/* Zone Navigation */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-white/10 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link
              href="/shop/hearthhouse"
              className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap bg-amber-600 text-white"
            >
              The Hearthhouse
            </Link>
            <Link
              href="/shop/conservatory"
              className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap bg-white/10 text-white/70 hover:bg-white/20 transition"
            >
              The Conservatory
            </Link>
            <Link
              href="/shop/east-pavilion"
              className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap bg-white/10 text-white/70 hover:bg-white/20 transition"
            >
              The East Pavilion
            </Link>
            <Link
              href="/shop/observatory"
              className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap bg-white/10 text-white/70 hover:bg-white/20 transition"
            >
              The Observatory
            </Link>
            <Link
              href="/shop/liminal-tent"
              className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap bg-white/10 text-white/70 hover:bg-white/20 transition"
            >
              The Liminal Tent
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area with Background */}
      <div className="relative min-h-screen">
        {/* Background Image */}
        {ZONE.heroImageUrl && (
          <div className="fixed inset-0 z-0 mt-16">
            <img 
              src={ZONE.heroImageUrl} 
              alt={`${ZONE.name} background`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          {/* Sub-tabs */}
          <div className="flex gap-2 mb-6">
          {ZONE.subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeSubTab === tab.id
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Panel */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} lg:col-span-1`}>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 sticky top-32">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Refine</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-amber-400 hover:text-amber-300 transition"
                  >
                    Reset ({activeFilterCount})
                  </button>
                )}
              </div>

              {/* Tea Type Filter - Only show if available */}
              {availableFilters.teaTypes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-white/80 mb-3">Built On</h4>
                  <div className="space-y-2">
                    {availableFilters.teaTypes.map(type => (
                      <label key={type} className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedTeaTypes.includes(type)}
                          onChange={() => toggleFilter(type, selectedTeaTypes, setSelectedTeaTypes)}
                          className="mr-3 rounded border-white/30 bg-white/10 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-white/70 group-hover:text-white transition capitalize">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Flavor Profile Filter */}
              {availableFilters.flavors.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-white/80 mb-3">Flavor Profile</h4>
                  <div className="space-y-2">
                    {availableFilters.flavors.slice(0, 8).map(flavor => (
                      <label key={flavor} className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedFlavors.includes(flavor)}
                          onChange={() => toggleFilter(flavor, selectedFlavors, setSelectedFlavors)}
                          className="mr-3 rounded border-white/30 bg-white/10 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-white/70 group-hover:text-white transition capitalize">
                          {flavor}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Caffeine Level Filter */}
              {availableFilters.caffeineLevels.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-white/80 mb-3">Caffeine Level</h4>
                  <div className="space-y-2">
                    {availableFilters.caffeineLevels.map(level => (
                      <label key={level} className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedCaffeine.includes(level)}
                          onChange={() => toggleFilter(level, selectedCaffeine, setSelectedCaffeine)}
                          className="mr-3 rounded border-white/30 bg-white/10 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-white/70 group-hover:text-white transition capitalize flex items-center gap-2">
                          <span className="text-lg">{CAFFEINE_ICONS[level as keyof typeof CAFFEINE_ICONS]}</span>
                          {level}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Occasion Filter */}
              {availableFilters.occasions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-white/80 mb-3">Occasion / Time</h4>
                  <div className="space-y-2">
                    {availableFilters.occasions.map(occasion => (
                      <label key={occasion} className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedOccasions.includes(occasion)}
                          onChange={() => toggleFilter(occasion, selectedOccasions, setSelectedOccasions)}
                          className="mr-3 rounded border-white/30 bg-white/10 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-white/70 group-hover:text-white transition capitalize">
                          {occasion}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Constraints */}
              <div>
                <h4 className="text-sm font-medium text-white/80 mb-3">Special Constraints</h4>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={specialConstraints.includes('caffeine-free')}
                      onChange={() => toggleFilter('caffeine-free', specialConstraints, setSpecialConstraints)}
                      className="mr-3 rounded border-white/30 bg-white/10 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-white/70 group-hover:text-white transition">
                      Caffeine-free only
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={specialConstraints.includes('no-flavorings')}
                      onChange={() => toggleFilter('no-flavorings', specialConstraints, setSpecialConstraints)}
                      className="mr-3 rounded border-white/30 bg-white/10 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-white/70 group-hover:text-white transition">
                      No flavorings
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden mb-4 w-full bg-white/10 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-white/60 text-lg">Preparing your collection...</div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/60 text-lg mb-4">No blends match your criteria</p>
                <button
                  onClick={resetFilters}
                  className="text-amber-400 hover:text-amber-300 underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <Link
                    key={product.id}
                    href={`/shop/${product.id}`}
                    className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all hover:shadow-xl hover:shadow-amber-900/20"
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-gradient-to-br from-orange-950/40 to-amber-950/40 relative overflow-hidden">
                      {product.imageUrl || product.images?.[0] ? (
                        <img
                          src={product.imageUrl || product.images?.[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-6xl opacity-30">🍵</div>
                        </div>
                      )}
                      
                      {/* Quick info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                        <div className="flex items-center gap-3 text-white/80 text-xs">
                          {product.caffeineLevel && (
                            <span className="flex items-center gap-1">
                              <span className="text-base">{CAFFEINE_ICONS[product.caffeineLevel]}</span>
                              {product.caffeineLevel}
                            </span>
                          )}
                          {product.teaType && (
                            <span className="capitalize">{product.teaType}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-5">
                      <h3 className="text-lg font-serif font-semibold text-white mb-2 group-hover:text-amber-400 transition">
                        {product.name}
                      </h3>
                      
                      <p className="text-sm text-white/60 mb-3 line-clamp-2 italic">
                        {product.description}
                      </p>

                      {/* Flavor notes */}
                      {product.flavorNotes && product.flavorNotes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {product.flavorNotes.slice(0, 3).map(note => (
                            <span
                              key={note}
                              className="text-xs px-2 py-1 rounded-full bg-amber-900/30 text-amber-200 capitalize"
                            >
                              {note}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <span className="text-lg font-semibold text-white">
                          ${Number(product.price).toFixed(2)}
                        </span>
                        <span className="text-sm text-amber-400 group-hover:text-amber-300 transition font-medium">
                          View Blend →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zone Footer CTA */}
        <div className="mt-16 text-center py-12 border-t border-white/10">
          <p className="text-white/60 mb-4 text-lg font-light">
            Can't find what you're seeking?
          </p>
          <Link
            href="/table"
            className="inline-block px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-amber-900/30 transition-all hover:scale-105"
          >
            Create Your Own Blend
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
