'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { apiClient } from '@/lib/api-client';
import { ZONE_CONFIGS, CAFFEINE_ICONS, ZoneConfig } from '../zone-config';

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

const ZONE = ZONE_CONFIGS.conservatory;

export default function ConservatoryPage() {
  const [activeSubTab, setActiveSubTab] = useState(ZONE.subTabs[0].id);
  const [showFilters, setShowFilters] = useState(false);
  
  const [selectedTeaTypes, setSelectedTeaTypes] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedCaffeine, setSelectedCaffeine] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [specialConstraints, setSpecialConstraints] = useState<string[]>([]);

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ['products', ZONE.name],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('perPage', '50');
      params.set('zone', 'The Conservatory');
      
      return apiClient.get<ProductsResponse>(
        `/catalog/products?${params.toString()}`
      );
    },
  });

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

  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];

    let filtered = data.products.filter(p => p.stock > 0);

    if (selectedTeaTypes.length > 0) {
      filtered = filtered.filter(p => 
        p.teaType && selectedTeaTypes.includes(p.teaType)
      );
    }

    if (selectedFlavors.length > 0) {
      filtered = filtered.filter(p =>
        p.flavorNotes?.some(note => selectedFlavors.includes(note))
      );
    }

    if (selectedCaffeine.length > 0) {
      filtered = filtered.filter(p =>
        p.caffeineLevel && selectedCaffeine.includes(p.caffeineLevel)
      );
    }

    if (selectedOccasions.length > 0) {
      filtered = filtered.filter(p =>
        p.occasion?.some(occ => selectedOccasions.includes(occ))
      );
    }

    if (specialConstraints.includes('caffeine-free')) {
      filtered = filtered.filter(p => p.caffeineLevel === 'none');
    }
    if (specialConstraints.includes('no-flavorings')) {
      filtered = filtered.filter(p => !p.flavorNotes || p.flavorNotes.length === 0);
    }

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
    setActiveSubTab(ZONE.subTabs[0].id);
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
    <div className={`min-h-screen bg-gradient-to-b ${ZONE.bgGradient}`}>
      <Header />
      
      <div className={`relative mt-16 overflow-hidden bg-gradient-to-r ${ZONE.gradient}`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(200,255,220,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(150,255,200,0.2),transparent_40%)]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-6xl md:text-7xl font-serif font-bold text-white mb-4 tracking-tight">
            {ZONE.name}
          </h1>
          <p className="text-2xl text-emerald-100 italic font-light mb-2">
            {ZONE.tagline}
          </p>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            {ZONE.theme}
          </p>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-sm border-b border-white/10 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link href="/shop/hearthhouse" className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap bg-white/10 text-white/70 hover:bg-white/20 transition">The Hearthhouse</Link>
            <Link href="/shop/conservatory" className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap bg-${ZONE.accentColor}-600 text-white`}>The Conservatory</Link>
            <Link href="/shop/east-pavilion" className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap bg-white/10 text-white/70 hover:bg-white/20 transition">The East Pavilion</Link>
            <Link href="/shop/observatory" className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap bg-white/10 text-white/70 hover:bg-white/20 transition">The Observatory</Link>
            <Link href="/shop/liminal-tent" className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap bg-white/10 text-white/70 hover:bg-white/20 transition">The Liminal Tent</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6">
          {ZONE.subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeSubTab === tab.id
                  ? `bg-${ZONE.accentColor}-600 text-white shadow-lg`
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} lg:col-span-1`}>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 sticky top-32">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Refine</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className={`text-sm text-${ZONE.accentColor}-400 hover:text-${ZONE.accentColor}-300 transition`}
                  >
                    Reset ({activeFilterCount})
                  </button>
                )}
              </div>

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
                          className={`mr-3 rounded border-white/30 bg-white/10 text-${ZONE.accentColor}-600 focus:ring-${ZONE.accentColor}-500`}
                        />
                        <span className="text-sm text-white/70 group-hover:text-white transition capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
                          className={`mr-3 rounded border-white/30 bg-white/10 text-${ZONE.accentColor}-600 focus:ring-${ZONE.accentColor}-500`}
                        />
                        <span className="text-sm text-white/70 group-hover:text-white transition capitalize">{flavor}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
                          className={`mr-3 rounded border-white/30 bg-white/10 text-${ZONE.accentColor}-600 focus:ring-${ZONE.accentColor}-500`}
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
                          className={`mr-3 rounded border-white/30 bg-white/10 text-${ZONE.accentColor}-600 focus:ring-${ZONE.accentColor}-500`}
                        />
                        <span className="text-sm text-white/70 group-hover:text-white transition capitalize">{occasion}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-white/80 mb-3">Special Constraints</h4>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={specialConstraints.includes('caffeine-free')}
                      onChange={() => toggleFilter('caffeine-free', specialConstraints, setSpecialConstraints)}
                      className={`mr-3 rounded border-white/30 bg-white/10 text-${ZONE.accentColor}-600 focus:ring-${ZONE.accentColor}-500`}
                    />
                    <span className="text-sm text-white/70 group-hover:text-white transition">Caffeine-free only</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={specialConstraints.includes('no-flavorings')}
                      onChange={() => toggleFilter('no-flavorings', specialConstraints, setSpecialConstraints)}
                      className={`mr-3 rounded border-white/30 bg-white/10 text-${ZONE.accentColor}-600 focus:ring-${ZONE.accentColor}-500`}
                    />
                    <span className="text-sm text-white/70 group-hover:text-white transition">No flavorings</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden mb-4 w-full bg-white/10 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className={`bg-${ZONE.accentColor}-600 text-white text-xs px-2 py-1 rounded-full`}>
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
                <button onClick={resetFilters} className={`text-${ZONE.accentColor}-400 hover:text-${ZONE.accentColor}-300 underline`}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <Link
                    key={product.id}
                    href={`/shop/${product.id}`}
                    className={`group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-${ZONE.accentColor}-500/50 transition-all hover:shadow-xl hover:shadow-${ZONE.accentColor}-900/20`}
                  >
                    <div className={`aspect-square bg-gradient-to-br from-${ZONE.accentColor}-950/40 to-${ZONE.accentColor}-950/40 relative overflow-hidden`}>
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
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                        <div className="flex items-center gap-3 text-white/80 text-xs">
                          {product.caffeineLevel && (
                            <span className="flex items-center gap-1">
                              <span className="text-base">{CAFFEINE_ICONS[product.caffeineLevel]}</span>
                              {product.caffeineLevel}
                            </span>
                          )}
                          {product.teaType && <span className="capitalize">{product.teaType}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className={`text-lg font-serif font-semibold text-white mb-2 group-hover:text-${ZONE.accentColor}-400 transition`}>
                        {product.name}
                      </h3>
                      
                      <p className="text-sm text-white/60 mb-3 line-clamp-2 italic">
                        {product.description}
                      </p>

                      {product.flavorNotes && product.flavorNotes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {product.flavorNotes.slice(0, 3).map(note => (
                            <span
                              key={note}
                              className={`text-xs px-2 py-1 rounded-full bg-${ZONE.accentColor}-900/30 text-${ZONE.accentColor}-200 capitalize`}
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
                        <span className={`text-sm text-${ZONE.accentColor}-400 group-hover:text-${ZONE.accentColor}-300 transition font-medium`}>
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

        <div className="mt-16 text-center py-12 border-t border-white/10">
          <p className="text-white/60 mb-4 text-lg font-light">
            Can't find what you're seeking?
          </p>
          <Link
            href="/table"
            className={`inline-block px-8 py-3 bg-gradient-to-r from-${ZONE.accentColor}-600 to-${ZONE.accentColor}-700 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-${ZONE.accentColor}-900/30 transition-all hover:scale-105`}
          >
            Create Your Own Blend
          </Link>
        </div>
      </div>
    </div>
  );
}
