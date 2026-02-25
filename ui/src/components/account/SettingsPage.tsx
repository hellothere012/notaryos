import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  Shield,
  Moon,
  Sun,
  Download,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Smartphone,
  FileJson,
  Clock,
  Globe,
} from 'lucide-react';
import { authClient, API_ENDPOINTS } from '../../config/api';

interface NotificationSettings {
  emailNotifications: boolean;
  verificationAlerts: boolean;
  weeklyReports: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
}

interface VerificationSettings {
  autoExpandResults: boolean;
  showChainVisualization: boolean;
  defaultView: 'overview' | 'raw' | 'crypto';
  timestampFormat: '12h' | '24h';
}

interface ExportSettings {
  defaultFormat: 'json' | 'csv' | 'pdf';
  includeMetadata: boolean;
  compressExports: boolean;
}

interface ThemeSettings {
  darkMode: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
}

export const SettingsPage: React.FC = () => {
  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    verificationAlerts: true,
    weeklyReports: false,
    securityAlerts: true,
    marketingEmails: false,
  });

  // Verification settings
  const [verification, setVerification] = useState<VerificationSettings>({
    autoExpandResults: true,
    showChainVisualization: true,
    defaultView: 'overview',
    timestampFormat: '24h',
  });

  // Export settings
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    defaultFormat: 'json',
    includeMetadata: true,
    compressExports: false,
  });

  // Theme settings
  const [theme, setTheme] = useState<ThemeSettings>({
    darkMode: true,
    reduceMotion: false,
    highContrast: false,
  });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Guard: prevent change-tracking from firing during initial API load
  const isLoadingFromApi = React.useRef(true);

  // Track changes (skip during initial API load)
  useEffect(() => {
    if (isLoadingFromApi.current) return;
    setHasChanges(true);
    setSaveSuccess(false);
  }, [notifications, verification, exportSettings, theme]);

  // Load settings on mount from real API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await authClient.get(API_ENDPOINTS.settings);
        const saved = response.data;
        if (saved.notifications) setNotifications(saved.notifications);
        if (saved.verification) setVerification(saved.verification);
        if (saved.export) setExportSettings(saved.export);
        if (saved.theme) setTheme(saved.theme);
      } catch (error) {
        console.error('Failed to load settings:', error);
        // If load fails (new user or network error), keep defaults — no action needed
      } finally {
        isLoadingFromApi.current = false;
        setHasChanges(false);
      }
    };

    loadSettings();
  }, []);

  // Save all settings
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await authClient.put(API_ENDPOINTS.settings, {
        notifications,
        verification,
        export: exportSettings,
        theme,
      });
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setSaveError(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Customize your Notary experience</p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveSuccess ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Error Message */}
      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{saveError}</p>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Notification Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
              <p className="text-sm text-gray-500">Control how we communicate with you</p>
            </div>
          </div>

          <div className="space-y-4">
            <ToggleSetting
              icon={<Mail className="w-4 h-4" />}
              label="Email Notifications"
              description="Receive notifications via email"
              enabled={notifications.emailNotifications}
              onChange={(enabled) =>
                setNotifications((prev) => ({ ...prev, emailNotifications: enabled }))
              }
            />
            <ToggleSetting
              icon={<Shield className="w-4 h-4" />}
              label="Verification Alerts"
              description="Get notified when verifications complete"
              enabled={notifications.verificationAlerts}
              onChange={(enabled) =>
                setNotifications((prev) => ({ ...prev, verificationAlerts: enabled }))
              }
            />
            <ToggleSetting
              icon={<FileJson className="w-4 h-4" />}
              label="Weekly Reports"
              description="Receive weekly usage reports"
              enabled={notifications.weeklyReports}
              onChange={(enabled) =>
                setNotifications((prev) => ({ ...prev, weeklyReports: enabled }))
              }
            />
            <ToggleSetting
              icon={<AlertCircle className="w-4 h-4" />}
              label="Security Alerts"
              description="Important security notifications"
              enabled={notifications.securityAlerts}
              onChange={(enabled) =>
                setNotifications((prev) => ({ ...prev, securityAlerts: enabled }))
              }
              recommended
            />
            <ToggleSetting
              icon={<Smartphone className="w-4 h-4" />}
              label="Marketing Emails"
              description="Updates about new features and tips"
              enabled={notifications.marketingEmails}
              onChange={(enabled) =>
                setNotifications((prev) => ({ ...prev, marketingEmails: enabled }))
              }
            />
          </div>
        </motion.div>

        {/* Default Verification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Verification Settings</h2>
              <p className="text-sm text-gray-500">Customize verification behavior</p>
            </div>
          </div>

          <div className="space-y-4">
            <ToggleSetting
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Auto-expand Results"
              description="Automatically show result details after verification"
              enabled={verification.autoExpandResults}
              onChange={(enabled) =>
                setVerification((prev) => ({ ...prev, autoExpandResults: enabled }))
              }
            />
            <ToggleSetting
              icon={<Globe className="w-4 h-4" />}
              label="Chain Visualization"
              description="Show the verification chain sidebar"
              enabled={verification.showChainVisualization}
              onChange={(enabled) =>
                setVerification((prev) => ({ ...prev, showChainVisualization: enabled }))
              }
            />

            {/* Default View Dropdown */}
            <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  <FileJson className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-white font-medium">Default Detail View</p>
                  <p className="text-sm text-gray-500">Tab to show when expanding results</p>
                </div>
              </div>
              <select
                value={verification.defaultView}
                onChange={(e) =>
                  setVerification((prev) => ({
                    ...prev,
                    defaultView: e.target.value as 'overview' | 'raw' | 'crypto',
                  }))
                }
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="overview">Overview</option>
                <option value="raw">Raw JSON</option>
                <option value="crypto">Crypto Details</option>
              </select>
            </div>

            {/* Timestamp Format */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-white font-medium">Timestamp Format</p>
                  <p className="text-sm text-gray-500">How to display times</p>
                </div>
              </div>
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() =>
                    setVerification((prev) => ({ ...prev, timestampFormat: '12h' }))
                  }
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    verification.timestampFormat === '12h'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  12-hour
                </button>
                <button
                  onClick={() =>
                    setVerification((prev) => ({ ...prev, timestampFormat: '24h' }))
                  }
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    verification.timestampFormat === '24h'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  24-hour
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Theme Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Moon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Theme Preferences</h2>
              <p className="text-sm text-gray-500">Customize the appearance</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  {theme.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </span>
                <div>
                  <p className="text-white font-medium">Dark Mode</p>
                  <p className="text-sm text-gray-500">Use dark color scheme</p>
                </div>
              </div>
              <Toggle
                enabled={theme.darkMode}
                onChange={(enabled) => setTheme((prev) => ({ ...prev, darkMode: enabled }))}
              />
            </div>

            <ToggleSetting
              icon={<Settings className="w-4 h-4" />}
              label="Reduce Motion"
              description="Minimize animations for accessibility"
              enabled={theme.reduceMotion}
              onChange={(enabled) => setTheme((prev) => ({ ...prev, reduceMotion: enabled }))}
            />
            <ToggleSetting
              icon={<Sun className="w-4 h-4" />}
              label="High Contrast"
              description="Increase contrast for better visibility"
              enabled={theme.highContrast}
              onChange={(enabled) => setTheme((prev) => ({ ...prev, highContrast: enabled }))}
            />
          </div>
        </motion.div>

        {/* Export Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Export Preferences</h2>
              <p className="text-sm text-gray-500">Configure data export options</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Default Format Dropdown */}
            <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  <FileJson className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-white font-medium">Default Export Format</p>
                  <p className="text-sm text-gray-500">Format for downloading data</p>
                </div>
              </div>
              <select
                value={exportSettings.defaultFormat}
                onChange={(e) =>
                  setExportSettings((prev) => ({
                    ...prev,
                    defaultFormat: e.target.value as 'json' | 'csv' | 'pdf',
                  }))
                }
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            <ToggleSetting
              icon={<FileJson className="w-4 h-4" />}
              label="Include Metadata"
              description="Add verification metadata to exports"
              enabled={exportSettings.includeMetadata}
              onChange={(enabled) =>
                setExportSettings((prev) => ({ ...prev, includeMetadata: enabled }))
              }
            />
            <ToggleSetting
              icon={<Download className="w-4 h-4" />}
              label="Compress Exports"
              description="Compress large exports to ZIP format"
              enabled={exportSettings.compressExports}
              onChange={(enabled) =>
                setExportSettings((prev) => ({ ...prev, compressExports: enabled }))
              }
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Toggle Component
interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
      enabled ? 'bg-purple-600' : 'bg-gray-700'
    }`}
  >
    <motion.div
      className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"
      animate={{ x: enabled ? 24 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  </button>
);

// Toggle Setting Row Component
interface ToggleSettingProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  recommended?: boolean;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({
  icon,
  label,
  description,
  enabled,
  onChange,
  recommended,
}) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0">
    <div className="flex items-center gap-3">
      <span className="text-gray-400">{icon}</span>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-white font-medium">{label}</p>
          {recommended && (
            <span className="badge-purple text-xs">Recommended</span>
          )}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
    <Toggle enabled={enabled} onChange={onChange} />
  </div>
);
