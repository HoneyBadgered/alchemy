'use client';

/**
 * Address Management Page
 * 
 * Add, edit, delete shipping addresses with dark-fairytale aesthetic.
 */

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import BottomNavigation from '@/components/BottomNavigation';
import { addressApi, Address, CreateAddressInput } from '@/lib/profile-api';

function AddressesContent() {
  const { accessToken } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<CreateAddressInput, 'isDefault'>>({
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
  });
  
  // Fetch addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await addressApi.getAddresses(accessToken);
        setAddresses(response.addresses);
      } catch (error) {
        setMessage({ type: 'error', text: (error as Error).message || 'Failed to fetch addresses.' });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAddresses();
  }, [accessToken]);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      phone: '',
    });
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setFormData({
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone || '',
    });
    setIsAddingNew(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    if (!accessToken) {
      setMessage({ type: 'error', text: 'You must be logged in to save addresses.' });
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        // Update existing address
        const updatedAddress = await addressApi.updateAddress(editingId, formData, accessToken);
        // If updated address is now default, update all other addresses to non-default
        if (updatedAddress.isDefault) {
          setAddresses(prev => prev.map(addr => 
            addr.id === editingId ? updatedAddress : { ...addr, isDefault: false }
          ));
        } else {
          setAddresses(prev => prev.map(addr => 
            addr.id === editingId ? updatedAddress : addr
          ));
        }
        setMessage({ type: 'success', text: 'Address updated successfully.' });
      } else {
        // Add new address
        const newAddress = await addressApi.addAddress(formData, accessToken);
        // Always update list: set other addresses to non-default if new one is default
        setAddresses(prev => {
          const updated = newAddress.isDefault 
            ? prev.map(addr => ({ ...addr, isDefault: false }))
            : prev;
          return [...updated, newAddress];
        });
        setMessage({ type: 'success', text: 'New address added successfully.' });
      }

      resetForm();
      setIsAddingNew(false);
      setEditingId(null);
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message || 'Failed to save address. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) {
      setMessage({ type: 'error', text: 'You must be logged in to delete addresses.' });
      return;
    }
    
    try {
      await addressApi.deleteAddress(id, accessToken);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      setDeleteConfirmId(null);
      setMessage({ type: 'success', text: 'Address removed from your records.' });
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message || 'Failed to delete address.' });
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!accessToken) {
      setMessage({ type: 'error', text: 'You must be logged in to set default address.' });
      return;
    }
    
    try {
      await addressApi.setDefaultAddress(id, accessToken);
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      })));
      setMessage({ type: 'success', text: 'Default delivery location updated.' });
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message || 'Failed to set default address.' });
    }
  };

  const isFormValid = () => {
    return formData.firstName && formData.lastName && formData.addressLine1 && 
           formData.city && formData.state && formData.zipCode && formData.country;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-20">
      {/* Atmospheric overlay */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6bTAgMzJjLTcuNzMyIDAtMTQtNi4yNjgtMTQtMTRzNi4yNjgtMTQgMTQtMTQgMTQgNi4yNjggMTQgMTQtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-30 pointer-events-none" />
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-900/80 via-violet-800/80 to-purple-900/80 border-b border-purple-500/30">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-100 transition-colors mb-4"
          >
            <span>←</span>
            <span>Back to Profile</span>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🏠</span>
            Delivery Addresses
          </h1>
          <p className="text-purple-200/70 mt-1">Where your potions shall arrive</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-8 text-center border border-purple-500/20">
            <span className="text-4xl mb-4 block animate-pulse">🔮</span>
            <p className="text-purple-300">Loading your addresses...</p>
          </div>
        )}
        
        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-900/30 border border-green-600/50 text-green-300' 
              : 'bg-red-900/30 border border-red-600/50 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Add New Button */}
        {!isLoading && !isAddingNew && !editingId && (
          <button
            onClick={() => {
              resetForm();
              setIsAddingNew(true);
              setMessage(null);
            }}
            className="w-full bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-dashed border-purple-500/40 hover:border-purple-400/60 transition-all duration-300 text-center group"
          >
            <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">➕</span>
            <span className="text-purple-300 font-medium">Add New Delivery Location</span>
          </button>
        )}

        {/* Address Form */}
        {(isAddingNew || editingId) && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="First name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="Street address"
                  required
                />
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="Apt, suite, unit, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="State"
                    required
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="ZIP"
                    required
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    Country *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors"
                    required
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="(555) 555-5555"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || !isFormValid()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address List */}
        {!isLoading && addresses.length > 0 && !isAddingNew && !editingId && (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border transition-all duration-300 ${
                  address.isDefault 
                    ? 'border-purple-400/50 shadow-lg shadow-purple-500/10' 
                    : 'border-purple-500/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">📍</span>
                      <h3 className="text-white font-semibold">
                        {address.firstName} {address.lastName}
                      </h3>
                      {address.isDefault && (
                        <span className="px-2 py-1 bg-purple-600/30 text-purple-300 text-xs font-medium rounded border border-purple-500/50">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-purple-300/70 text-sm space-y-1 ml-8">
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>{address.city}, {address.state} {address.zipCode}</p>
                      <p>{address.country}</p>
                      {address.phone && <p className="text-purple-400">{address.phone}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEdit(address)}
                      className="px-3 py-1 text-purple-300 hover:text-purple-100 text-sm transition-colors"
                    >
                      Edit
                    </button>
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="px-3 py-1 text-purple-300 hover:text-purple-100 text-sm transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteConfirmId(address.id)}
                      className="px-3 py-1 text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {deleteConfirmId === address.id && (
                  <div className="mt-4 p-3 bg-red-900/30 rounded-lg border border-red-600/50">
                    <p className="text-red-200 text-sm mb-3">
                      Remove this address from your records?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && addresses.length === 0 && !isAddingNew && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-8 text-center border border-purple-500/20">
            <span className="text-6xl mb-4 block">🏠</span>
            <h2 className="text-xl font-bold text-white mb-2">No Addresses Yet</h2>
            <p className="text-purple-300/70 mb-4">
              Add a delivery location for your alchemical acquisitions.
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function AddressesPage() {
  return (
    <ProtectedRoute>
      <AddressesContent />
    </ProtectedRoute>
  );
}
