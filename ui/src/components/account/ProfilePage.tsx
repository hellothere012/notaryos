import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  Edit3,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  BarChart3,
  Calendar,
  Key,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser as useClerkUser } from '@clerk/nextjs';
import { authClient, API_ENDPOINTS } from '../../lib/api-client';

interface UsageStats {
  totalVerifications: number;
  validCount: number;
  invalidCount: number;
  apiKeysCount: number;
  memberSince: string;
}

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { user: clerkUser } = useClerkUser();

  // Username editing state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Usage stats state
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch usage statistics from real API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authClient.get(API_ENDPOINTS.clerkStats);
        const data = response.data;
        setUsageStats({
          totalVerifications: data.total_verifications ?? 0,
          validCount: data.valid_count ?? 0,
          invalidCount: data.invalid_count ?? 0,
          apiKeysCount: data.api_keys_count ?? 0,
          memberSince: data.member_since || user?.createdAt || new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to fetch usage stats:', error);
        // Fallback: honest zeros — never show fake data to new users
        setUsageStats({
          totalVerifications: 0,
          validCount: 0,
          invalidCount: 0,
          apiKeysCount: 0,
          memberSince: user?.createdAt || new Date().toISOString(),
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user?.createdAt]);

  // Handle username save
  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }

    if (newUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
      setUsernameError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    setIsSavingUsername(true);
    setUsernameError(null);

    try {
      // Update username via Clerk — triggers reactive state update
      if (clerkUser) {
        await clerkUser.update({ username: newUsername });
      }
      await refreshUser();
      setIsEditingUsername(false);
    } catch (error: any) {
      setUsernameError(error?.errors?.[0]?.message || 'Failed to update username');
    } finally {
      setIsSavingUsername(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Clerk manages passwords — use Clerk's updatePassword method
      if (clerkUser) {
        await clerkUser.updatePassword({
          currentPassword,
          newPassword,
        });
      }
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordSection(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error: any) {
      setPasswordError(error?.errors?.[0]?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Get tier badge styling
  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return {
          gradient: 'from-purple-500 to-cyan-500',
          label: 'Enterprise',
          features: ['Unlimited verifications', 'Priority support', 'Custom integrations'],
        };
      case 'pro':
        return {
          gradient: 'from-purple-500 to-pink-500',
          label: 'Professional',
          features: ['50,000 verifications/mo', 'Email support', 'API access'],
        };
      case 'basic':
        return {
          gradient: 'from-blue-500 to-purple-500',
          label: 'Basic',
          features: ['5,000 verifications/mo', 'Community support', 'Basic API'],
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-600',
          label: 'Free',
          features: ['500 verifications/mo', 'Documentation access', 'Public API'],
        };
    }
  };

  const tierConfig = getTierConfig(user?.tier || 'free');

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full overflow-x-hidden">
      {/* Gradient Hero Header */}
      <div className="mb-8 px-6 py-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
          Profile
        </h1>
        <p className="text-gray-400 text-sm md:text-base">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Profile Information
            </h2>

            <div className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Username
                </label>
                {isEditingUsername ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => {
                          setNewUsername(e.target.value);
                          setUsernameError(null);
                        }}
                        className="input-field flex-1"
                        placeholder="Enter username"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveUsername}
                        disabled={isSavingUsername}
                        className="btn-primary flex items-center gap-2"
                      >
                        {isSavingUsername ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingUsername(false);
                          setNewUsername(user.username || '');
                          setUsernameError(null);
                        }}
                        className="btn-ghost"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {usernameError && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {usernameError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <span className="text-white font-medium">
                      {user.username || user.email.split('@')[0]}
                    </span>
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="btn-ghost text-sm flex items-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span className="text-white">{user.email}</span>
                  </div>
                  {user.emailVerified ? (
                    <span className="badge-success flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <button className="text-sm text-purple-400 hover:text-purple-300">
                      Verify Email
                    </button>
                  )}
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Account Role
                </label>
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <span className="text-white capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Change Password Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                Password
              </h2>
              {!showPasswordSection && (
                <button
                  onClick={() => setShowPasswordSection(true)}
                  className="btn-secondary text-sm"
                >
                  Change Password
                </button>
              )}
            </div>

            {showPasswordSection ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                {/* Error/Success Messages */}
                {passwordError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Password changed successfully!</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordError(null);
                    }}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-gray-500 text-sm">
                Keep your account secure by using a strong password.
              </p>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Tier Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Account Tier
            </h2>

            <div
              className={`p-4 rounded-xl bg-gradient-to-br ${tierConfig.gradient} bg-opacity-20 border border-white/10 mb-4`}
            >
              <p className="text-2xl font-bold text-white">{tierConfig.label}</p>
              <p className="text-white/70 text-sm">Current Plan</p>
            </div>

            <ul className="space-y-2">
              {tierConfig.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {user.tier !== 'enterprise' && (
              <button className="w-full btn-primary mt-4">Upgrade Plan</button>
            )}
          </motion.div>

          {/* Usage Statistics Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Usage Statistics
            </h2>

            {isLoadingStats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : usageStats ? (
              <div className="space-y-4">
                <StatItem
                  icon={<FileCheck className="w-4 h-4" />}
                  label="Total Verifications"
                  value={usageStats.totalVerifications.toLocaleString()}
                />
                <StatItem
                  icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                  label="Valid"
                  value={usageStats.validCount.toLocaleString()}
                  subValue={`${((usageStats.validCount / usageStats.totalVerifications) * 100).toFixed(1)}%`}
                />
                <StatItem
                  icon={<AlertCircle className="w-4 h-4 text-red-400" />}
                  label="Invalid"
                  value={usageStats.invalidCount.toLocaleString()}
                  subValue={`${((usageStats.invalidCount / usageStats.totalVerifications) * 100).toFixed(1)}%`}
                />
                <StatItem
                  icon={<Key className="w-4 h-4" />}
                  label="Active API Keys"
                  value={usageStats.apiKeysCount.toString()}
                />
                <StatItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Member Since"
                  value={formatDate(usageStats.memberSince)}
                />
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                Unable to load statistics
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Stat Item Component
interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, subValue }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
    <div className="flex items-center gap-2 text-gray-400">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <div className="text-right">
      <span className="text-white font-medium">{value}</span>
      {subValue && (
        <span className="text-xs text-gray-500 ml-1">({subValue})</span>
      )}
    </div>
  </div>
);
