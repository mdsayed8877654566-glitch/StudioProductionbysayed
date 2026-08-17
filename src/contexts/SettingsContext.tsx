import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteSettings } from '../types';
import { storeService } from '../services/storeService';
import { applyThemeColor, updateDynamicBrowserMeta } from '../utils/themeUtils';
import { fetchSettingsFromSupabase, upsertSettingsInSupabase, isSupabaseConfigured, initialSettingsPromise } from '../lib/supabase';

interface SettingsContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: SiteSettings) => void;
  updateSettingsAsync: (newSettings: SiteSettings) => Promise<{success: boolean, error?: string}>;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const s = storeService.getSettings();
    if (typeof window !== 'undefined') {
      applyThemeColor(s.primaryColor);
      updateDynamicBrowserMeta(s);
    }
    return s;
  });

  // Apply theme and browser tab/meta updates whenever settings change
  useEffect(() => {
    applyThemeColor(settings.primaryColor);
    updateDynamicBrowserMeta(settings);
  }, [settings]);

  // Initial cloud sync from Supabase database (for Vercel & multi-device persistence)
  useEffect(() => {
    let mounted = true;
    async function syncCloudSettings() {
      try {
        const cloudSettings = await initialSettingsPromise;
        if (cloudSettings && mounted) {
          const merged: SiteSettings = {
            ...storeService.getSettings(),
            ...cloudSettings
          };
          setSettings(merged);
          storeService.saveSettings(merged);
          applyThemeColor(merged.primaryColor);
          updateDynamicBrowserMeta(merged);
        } else if (!cloudSettings && mounted && isSupabaseConfigured) {
          // If no settings exist in Supabase yet, and Supabase is configured, 
          // only seed if we really have no local settings (which is unlikely given storeService defaults)
          const current = storeService.getSettings();
          upsertSettingsInSupabase(current);
        }
      } catch (e) {
        console.warn('Supabase settings initial sync notice:', e);
      }
    }
    syncCloudSettings();
    return () => {
      mounted = false;
    };
  }, []);

  // Listen to local store events
  useEffect(() => {
    const handleStoreChange = () => {
      const s = storeService.getSettings();
      setSettings(s);
      applyThemeColor(s.primaryColor);
      updateDynamicBrowserMeta(s);
    };
    window.addEventListener('studio_collection_store_change', handleStoreChange);
    return () => window.removeEventListener('studio_collection_store_change', handleStoreChange);
  }, []);

  const updateSettingsAsync = async (newSettings: SiteSettings) => {
    const res = await storeService.saveSettingsVerified(newSettings);
    if (!res.success) {
      return { success: false, error: res.error };
    }
    const updated = res.data!;
    setSettings(updated);
    applyThemeColor(updated.primaryColor);
    updateDynamicBrowserMeta(updated);
    return { success: true };
  };

  const updateSettings = (newSettings: SiteSettings) => {
    const updated = storeService.saveSettings(newSettings);
    setSettings(updated);
    applyThemeColor(updated.primaryColor);
    updateDynamicBrowserMeta(updated);
    upsertSettingsInSupabase(updated);
  };

  const resetSettings = () => {
    const s = storeService.resetSettingsToDefault();
    setSettings(s);
    applyThemeColor(s.primaryColor);
    updateDynamicBrowserMeta(s);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateSettingsAsync, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsContext');
  return context;
};
