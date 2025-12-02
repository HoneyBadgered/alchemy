'use client';

/**
 * Account Information Page
 * 
 * Manage personal details, password, and account settings
 * with a dark-fairytale aesthetic.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import BottomNavigation from '@/components/BottomNavigation';
import { profileApi } from '@/lib/profile-api';

function AccountContent() {
  const { user, logout, refreshAuth } = useAuth();
  const { accessToken } = useAuthStore();
  
  // Form states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  
  // Profile form state
  const [firstName, setFirstName] = useState(user?.profile?.firstName || '');
  const [lastName, setLastName] = useState(user?.profile?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status states
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Update form state when user data changes
  useEffect(() => {
    if (user) {
      setFirstName(user.profile?.firstName || '');
      setLastName(user.profile?.lastName || '');
      setEmail(user.email || '');
    }
  }, [user]);
  
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    
    if (!accessToken) {
      setProfileMessage({ type: 'error', text: 'You must be logged in to update your profile.' });
      setProfileSaving(false);
      return;
    }
    
    try {
      // Update profile (firstName, lastName)
      await profileApi.updateProfile({ firstName, lastName }, accessToken);
      
      // Update account (email) if changed
      if (email !== user?.email) {
        await profileApi.updateAccount({ email }, accessToken);
      }
      
      // Refresh user data to update the UI
      await refreshAuth();
      
      setProfileMessage({ type: 'success', text: 'Your arcane credentials have been updated successfully.' });
      setIsEditingProfile(false);
    } catch (error) {
      setProfileMessage({ type: 'error', text: (error as Error).message || 'Failed to update profile. Please try again.' });
    } finally {
      setProfileSaving(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    
    if (!accessToken) {
      setPasswordMessage({ type: 'error', text: 'You must be logged in to change your password.' });
      return;
    }
    
    setPasswordSaving(true);
    setPasswordMessage(null);
    
    try {
      await profileApi.updateAccount({ currentPassword, newPassword }, accessToken);
      
      setPasswordMessage({ type: 'success', text: 'Your secret incantation has been changed.' });
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordMessage({ type: 'error', text: (error as Error).message || 'Failed to change password. Please verify your current password.' });
    } finally {
      setPasswordSaving(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!accessToken) {
      alert('You must be logged in to delete your account.');
      return;
    }
    
    if (!deletePassword) {
      alert('Please enter your password to confirm account deletion.');
      return;
    }
    
    setDeletingAccount(true);
    
    try {
      await profileApi.deleteAccount(deletePassword, accessToken);
      logout();
    } catch (error) {
      alert((error as Error).message || 'Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
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
            <span className="text-3xl">📜</span>
            Account Information
          </h1>
          <p className="text-purple-200/70 mt-1">Manage your arcane credentials</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* Avatar Section */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h2 className="text-lg font-semibold text-white mb-4">Profile Avatar</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center text-5xl shadow-lg shadow-purple-500/30 border-2 border-purple-400/50">
                {user?.profile?.avatarUrl ? (
                  <img 
                    src={user.profile.avatarUrl} 
                    alt={user?.username} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>🧙</span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-purple-200/70 text-sm mb-3">
                Your avatar represents your identity in the realm of alchemy.
              </p>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors">
                  Upload Image
                </button>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded-lg font-medium transition-colors">
                  Choose Avatar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Personal Details</h2>
            {!isEditingProfile && (
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                Edit
              </button>
            )}
          </div>
          
          {profileMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              profileMessage.type === 'success' 
                ? 'bg-green-900/30 border border-green-600/50 text-green-300' 
                : 'bg-red-900/30 border border-red-600/50 text-red-300'
            }`}>
              {profileMessage.text}
            </div>
          )}
          
          {isEditingProfile ? (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setFirstName(user?.profile?.firstName || '');
                    setLastName(user?.profile?.lastName || '');
                    setEmail(user?.email || '');
                  }}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-purple-300/60 text-sm">First Name</p>
                  <p className="text-white font-medium">{user?.profile?.firstName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-purple-300/60 text-sm">Last Name</p>
                  <p className="text-white font-medium">{user?.profile?.lastName || 'Not set'}</p>
                </div>
              </div>
              <div>
                <p className="text-purple-300/60 text-sm">Email Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">{user?.email}</p>
                  {user?.emailVerified ? (
                    <span className="text-green-400 text-sm">✓ Verified</span>
                  ) : (
                    <span className="text-amber-400 text-sm">⚠ Not verified</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-purple-300/60 text-sm">Username</p>
                <p className="text-white font-medium">{user?.username}</p>
              </div>
              <div>
                <p className="text-purple-300/60 text-sm">Member Since</p>
                <p className="text-white font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Password Section */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Password</h2>
            {!isChangingPassword && (
              <button 
                onClick={() => setIsChangingPassword(true)}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                Change Password
              </button>
            )}
          </div>
          
          {passwordMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              passwordMessage.type === 'success' 
                ? 'bg-green-900/30 border border-green-600/50 text-green-300' 
                : 'bg-red-900/30 border border-red-600/50 text-red-300'
            }`}>
              {passwordMessage.text}
            </div>
          )}
          
          {isChangingPassword ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-purple-300/60 text-sm">
              Your password was last changed... well, we don&apos;t actually track that. It&apos;s a secret!
            </p>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-red-950/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <h2 className="text-lg font-semibold text-red-300 mb-2">Danger Zone</h2>
          <p className="text-red-200/60 text-sm mb-4">
            These actions are irreversible. Proceed with caution, young alchemist.
          </p>
          
          {showDeleteConfirm ? (
            <div className="bg-red-900/30 rounded-lg p-4 border border-red-600/50">
              <p className="text-red-200 mb-4">
                Are you sure you wish to dissolve your account? All your data, orders, and achievements will be lost forever.
              </p>
              <div className="mb-4">
                <label className="block text-red-200 text-sm font-medium mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-red-500/30 rounded-lg text-white placeholder-red-300/50 focus:outline-none focus:border-red-400 transition-colors"
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || !deletePassword}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {deletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-200 rounded-lg font-medium transition-colors border border-red-700/50"
            >
              Delete Account
            </button>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}
