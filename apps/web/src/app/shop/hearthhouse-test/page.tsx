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

const ZONE_FALLBACK = {
  name: 'The Hearthhouse',
  tagline: 'Dark, smoky, grounding',
  theme: 'Where warmth gathers and stories linger',
  gradient: 'from-amber-900 via-orange-800 to-red-900',
  heroImageUrl: undefined,
};

const CAFFEINE_ICONS = {
  none: '○',
  low: '◔',
  medium: '◑',
  high: '●',
};

export default function HeathhouseTestPage() {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedCaffeine, setSelectedCaffeine] = useState<string[]>([]);
  const [showAllFilters, setShowAllFilters] = useState(false);

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
      
      return await apiClient.get<ProductsResponse>(
        `/catalog/products?${params.toString()}`
      );
    },
  });

  // Extract available filter options
  const availableFilters = useMemo(() => {
    if (!data?.products) return { flavors: [], caffeineLevels: [], teaTypes: [], occasions: [] };

    const flavors = new Set<string>();
    const caffeineLevels = new Set<string>();
    const teaTypes = new Set<string>();
    const occasions = new Set<string>();

    data.products.forEach(p => {
      p.flavorNotes?.forEach(note => flavors.add(note));
      if (p.caffeineLevel) caffeineLevels.add(p.caffeineLevel);
      if (p.teaType) teaTypes.add(p.teaType);
      p.occasion?.forEach(occ => occasions.add(occ));
    });

    return {
      flavors: Array.from(flavors).sort(),
      caffeineLevels: Array.from(caffeineLevels).sort(),
      teaTypes: Array.from(teaTypes).sort(),
      occasions: Array.from(occasions).sort(),
    };
  }, [data?.products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    
    return data.products.filter(p => {
      if (p.stock <= 0) return false;
      
      if (selectedFlavors.length > 0) {
        const hasMatch = p.flavorNotes?.some(note => selectedFlavors.includes(note));
        if (!hasMatch) return false;
      }
      
      if (selectedCaffeine.length > 0) {
        if (!p.caffeineLevel || !selectedCaffeine.includes(p.caffeineLevel)) return false;
      }
      
      return true;
    });
  }, [data?.products, selectedFlavors, selectedCaffeine]);

  const toggleFilter = (value: string, selected: string[], setter: (val: string[]) => void) => {
    if (selected.includes(value)) {
      setter(selected.filter(v => v !== value));
    } else {
      setter([...selected, value]);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Header />
      
      {/* Environmental Interior Background */}
      <div className="fixed inset-0 z-0">
        {ZONE.heroImageUrl ? (
          <img 
            src={ZONE.heroImageUrl} 
            alt={`${ZONE.name} interior`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${ZONE.gradient}`} />
        )}
      </div>

      {/* Content Layer */}
      <div className="relative z-10 pt-16">
        {/* Zone Identity - Minimal */}
        <div className="text-center py-8 px-6">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2 drop-shadow-lg">
            {ZONE.name}
          </h1>
          <p className="text-lg text-white/90 italic drop-shadow">
            {ZONE.tagline}
          </p>
        </div>

        {/* Empty Center Space */}
        <div className="h-24" />

        {/* Floating Product Grid */}
        <div className="max-w-6xl mx-auto px-6 pb-12">
          {/* Gentle Filters */}
          <div className="backdrop-blur-md bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-sm uppercase tracking-wide">Refine</h3>
              {(selectedFlavors.length > 0 || selectedCaffeine.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedFlavors([]);
                    setSelectedCaffeine([]);
                  }}
                  className="text-white/60 hover:text-white text-sm"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Flavor Notes */}
            {availableFilters.flavors.length > 0 && (
              <div className="mb-4">
                <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                  Flavor Notes
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.flavors.slice(0, showAllFilters ? undefined : 6).map(flavor => (
                    <button
                      key={flavor}
                      onClick={() => toggleFilter(flavor, selectedFlavors, setSelectedFlavors)}
                      className={`px-4 py-1.5 rounded-full text-sm transition-all backdrop-blur-sm ${
                        selectedFlavors.includes(flavor)
                          ? 'bg-white/90 text-stone-900 shadow-lg'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {flavor}
                    </button>
                  ))}
                  {availableFilters.flavors.length > 6 && (
                    <button
                      onClick={() => setShowAllFilters(!showAllFilters)}
                      className="px-4 py-1.5 rounded-full text-sm bg-white/10 text-white/60 hover:bg-white/20"
                    >
                      {showAllFilters ? 'Show less' : `+${availableFilters.flavors.length - 6} more`}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Caffeine Level */}
            {availableFilters.caffeineLevels.length > 0 && (
              <div className="mb-4">
                <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                  Caffeine Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.caffeineLevels.map(level => (
                    <button
                      key={level}
                      onClick={() => toggleFilter(level, selectedCaffeine, setSelectedCaffeine)}
                      className={`px-4 py-1.5 rounded-full text-sm transition-all backdrop-blur-sm ${
                        selectedCaffeine.includes(level)
                          ? 'bg-white/90 text-stone-900 shadow-lg'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {CAFFEINE_ICONS[level as keyof typeof CAFFEINE_ICONS]} {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tea Types */}
            {availableFilters.teaTypes.length > 0 && (
              <div className="mb-4">
                <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                  Tea Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.teaTypes.map(type => (
                    <button
                      key={type}
                      className="px-4 py-1.5 rounded-full text-sm bg-white/20 text-white hover:bg-white/30 transition-all backdrop-blur-sm"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Occasions */}
            {availableFilters.occasions.length > 0 && (
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                  Occasions
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.occasions.map(occasion => (
                    <button
                      key={occasion}
                      className="px-4 py-1.5 rounded-full text-sm bg-white/20 text-white hover:bg-white/30 transition-all backdrop-blur-sm"
                    >
                      {occasion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Cards */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-white/80 text-lg backdrop-blur-sm bg-black/20 px-6 py-3 rounded-lg">
                Loading...
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/80 text-lg backdrop-blur-sm bg-black/20 px-6 py-3 rounded-lg inline-block">
                No blends match your criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className={`group backdrop-blur-md bg-white/10 rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-all ${
                    expandedProduct === product.id ? 'md:col-span-2 lg:col-span-3' : ''
                  }`}
                  onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-white group-hover:text-amber-200 transition">
                        {product.name}
                      </h3>
                      {product.caffeineLevel && (
                        <span className="text-white/60 text-sm">
                          {CAFFEINE_ICONS[product.caffeineLevel]}
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-white/70 text-sm mb-4 ${expandedProduct === product.id ? '' : 'line-clamp-2'}`}>
                      {product.description}
                    </p>

                    {expandedProduct === product.id && (
                      <div className="mt-4 pt-4 border-t border-white/20">
                        {product.flavorNotes && product.flavorNotes.length > 0 && (
                          <div className="mb-3">
                            <span className="text-white/60 text-xs uppercase tracking-wide">Notes: </span>
                            <span className="text-white/80 text-sm">{product.flavorNotes.join(', ')}</span>
                          </div>
                        )}
                        {product.occasion && product.occasion.length > 0 && (
                          <div className="mb-3">
                            <span className="text-white/60 text-xs uppercase tracking-wide">Occasions: </span>
                            <span className="text-white/80 text-sm">{product.occasion.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-2xl font-bold text-white">
                        ${Number(product.price).toFixed(2)}
                      </span>
                      <Link
                        href={`/products/${product.id}`}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition backdrop-blur-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone Transition Links */}
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <div className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10">
            <p className="text-white/60 text-center mb-6 text-sm uppercase tracking-wide">
              Explore Other Zones
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/shop/conservatory"
                className="px-6 py-2 rounded-full bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600/30 transition backdrop-blur-sm border border-emerald-400/20"
              >
                The Conservatory
              </Link>
              <Link
                href="/shop/east-pavilion"
                className="px-6 py-2 rounded-full bg-cyan-600/20 text-cyan-200 hover:bg-cyan-600/30 transition backdrop-blur-sm border border-cyan-400/20"
              >
                The East Pavilion
              </Link>
              <Link
                href="/shop/observatory"
                className="px-6 py-2 rounded-full bg-indigo-600/20 text-indigo-200 hover:bg-indigo-600/30 transition backdrop-blur-sm border border-indigo-400/20"
              >
                The Observatory
              </Link>
              <Link
                href="/shop/liminal-tent"
                className="px-6 py-2 rounded-full bg-pink-600/20 text-pink-200 hover:bg-pink-600/30 transition backdrop-blur-sm border border-pink-400/20"
              >
                The Liminal Tent
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
