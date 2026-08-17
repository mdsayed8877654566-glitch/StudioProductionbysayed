import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Lock, 
  Pipette, 
  Image as ImageIcon, 
  RefreshCw, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  Star, 
  ShoppingBag, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { PRESET_THEME_COLORS, applyThemeColor, extractProminentColorFromImageUrl, hexToRgb } from '../../utils/themeUtils';
import { SiteSettings } from '../../types';

interface ThemeCustomizerProps {
  settings: SiteSettings;
  onUpdateSettings: (newSettings: SiteSettings) => void;
  isSuperAdmin: boolean;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  settings,
  onUpdateSettings,
  isSuperAdmin
}) => {
  const currentColor = settings.primaryColor || '#ea580c';
  const [selectedHex, setSelectedHex] = useState<string>(currentColor);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(settings.themePreset || 'orange');
  const [isExtractingLogo, setIsExtractingLogo] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedHex(settings.primaryColor || '#ea580c');
    setSelectedPresetId(settings.themePreset || 'orange');
  }, [settings.primaryColor, settings.themePreset]);

  // Handle color change with live preview
  const handleColorChange = (hex: string, presetId?: string) => {
    if (!isSuperAdmin) return;
    let cleanHex = hex.trim();
    if (!cleanHex.startsWith('#')) {
      cleanHex = '#' + cleanHex;
    }
    setSelectedHex(cleanHex);
    if (presetId) {
      setSelectedPresetId(presetId);
    } else {
      const match = PRESET_THEME_COLORS.find(p => p.hex.toLowerCase() === cleanHex.toLowerCase());
      setSelectedPresetId(match ? match.id : 'custom');
    }
    // Live update CSS variables across DOM
    applyThemeColor(cleanHex);
  };

  // Extract color from logo image
  const handleExtractFromLogo = async () => {
    if (!isSuperAdmin) return;
    const logoSource = settings.logoUrl || '/logo.svg';
    setIsExtractingLogo(true);
    setExtractError(null);

    try {
      const extracted = await extractProminentColorFromImageUrl(logoSource);
      if (extracted) {
        handleColorChange(extracted, 'custom');
        setSaveSuccessMessage(`Extracted color ${extracted.toUpperCase()} from logo!`);
        setTimeout(() => setSaveSuccessMessage(null), 3000);
      } else {
        setExtractError('Could not sample a prominent color from the logo. Try picking a color manually.');
      }
    } catch {
      setExtractError('Unable to analyze logo image.');
    } finally {
      setIsExtractingLogo(false);
    }
  };

  // Screen Eyedropper (if browser supports it)
  const handleScreenEyedropper = async () => {
    if (!isSuperAdmin) return;
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          handleColorChange(result.sRGBHex, 'custom');
        }
      } catch {
        // User canceled eyedropper
      }
    } else {
      alert('The native Eyedropper API is supported in modern Chrome, Edge, and Opera browsers. You can also use the color picker below.');
    }
  };

  // Save changes permanently
  const handleSaveTheme = () => {
    if (!isSuperAdmin) return;
    const updatedSettings: SiteSettings = {
      ...settings,
      primaryColor: selectedHex,
      themePreset: selectedPresetId
    };
    onUpdateSettings(updatedSettings);
    setSaveSuccessMessage('Theme color updated and saved successfully! Changes are live across the entire website.');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (!isSuperAdmin) return;
    const defaultHex = '#ea580c';
    handleColorChange(defaultHex, 'orange');
    const updatedSettings: SiteSettings = {
      ...settings,
      primaryColor: defaultHex,
      themePreset: 'orange'
    };
    onUpdateSettings(updatedSettings);
    setSaveSuccessMessage('Reset theme color to default Studio Orange.');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const rgb = hexToRgb(selectedHex) || { r: 234, g: 88, b: 12 };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl text-orange-600 shadow-sm shrink-0">
              <Palette className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-zinc-900 tracking-tight">Theme & Color Customizer</h2>
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Access
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Lock className="w-3.5 h-3.5" /> Super Admin Only
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 mt-1 max-w-2xl">
                Change your website’s theme color at any time. Match your brand logo or choose from high-contrast designer presets. Updates buttons, badges, glows, active navigation, and highlights across the entire site.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {isSuperAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTheme}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply & Save Theme</span>
                </button>
              </>
            )}
          </div>
        </div>

        {saveSuccessMessage && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {!isSuperAdmin && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Theme customization is restricted. Only the Super Administrator (mdsayed8877654566@gmail.com) can modify the website theme color.</span>
          </div>
        )}

        {/* Color Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          
          {/* Left Column: Preset Colors & Logo Sync (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Preset Palettes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>Curated Designer Color Presets</span>
                </label>
                <span className="text-[11px] text-zinc-500 font-medium">{PRESET_THEME_COLORS.length} Presets Available</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_THEME_COLORS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id || selectedHex.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={!isSuperAdmin}
                      onClick={() => handleColorChange(preset.hex, preset.id)}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-orange-50/50 border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
                          : 'bg-zinc-50/70 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100'
                      } ${!isSuperAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full border border-black/10 shadow-sm shrink-0 flex items-center justify-center text-white"
                            style={{ backgroundColor: preset.hex }}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span className="font-bold text-xs text-zinc-900 truncate">{preset.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>{preset.hex.toUpperCase()}</span>
                        {isSelected && <span className="text-orange-600 font-bold font-sans">Active</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Custom Hex & Eyedropper Tools */}
            <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-orange-500" />
                  <span>Custom Color Picker & Fine-Tuning</span>
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">RGB({rgb.r}, {rgb.g}, {rgb.b})</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Native Color Input Swatch */}
                <div className="relative flex items-center gap-2 bg-white border border-zinc-200 p-1.5 rounded-xl shadow-xs">
                  <input
                    type="color"
                    id="theme-native-color-picker"
                    disabled={!isSuperAdmin}
                    value={selectedHex.startsWith('#') ? selectedHex : '#' + selectedHex}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-9 h-9 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                  />
                  <span className="text-xs font-bold text-zinc-700 pr-2">Palette Wheel</span>
                </div>

                {/* Hex Text Input */}
                <div className="flex items-center gap-2 bg-white border border-zinc-200 px-3 py-2 rounded-xl shadow-xs flex-1 min-w-[140px]">
                  <span className="text-xs font-bold text-zinc-400">#</span>
                  <input
                    type="text"
                    id="theme-hex-text-input"
                    disabled={!isSuperAdmin}
                    maxLength={7}
                    value={selectedHex.replace('#', '')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9a-fA-F]/g, '');
                      handleColorChange('#' + val);
                    }}
                    placeholder="ea580c"
                    className="w-full text-xs font-mono font-bold text-zinc-900 uppercase focus:outline-none bg-transparent"
                  />
                </div>

                {/* Screen Eyedropper Button */}
                {typeof window !== 'undefined' && 'EyeDropper' in window && (
                  <button
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={handleScreenEyedropper}
                    className="px-3.5 py-2.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Pipette className="w-3.5 h-3.5 text-orange-500" />
                    <span>Screen Eyedropper</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. Logo Sync Feature */}
            <div className="p-5 bg-orange-50/50 border border-orange-200/80 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">Sync Theme with Brand Logo</h4>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      Automatically extract the dominant color from your uploaded logo image and align the entire store palette.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isSuperAdmin || isExtractingLogo}
                  onClick={handleExtractFromLogo}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isExtractingLogo ? 'Analyzing...' : 'Extract From Logo'}</span>
                </button>
              </div>

              {extractError && (
                <p className="text-[11px] text-red-600 font-semibold">{extractError}</p>
              )}
            </div>

          </div>

          {/* Right Column: Live Interactive Theme Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-orange-500" />
                <span>Live UI Component Preview</span>
              </label>
              <span className="text-[11px] text-orange-600 font-bold">Real-time Rendering</span>
            </div>

            {/* Interactive Preview Card */}
            <div className="bg-zinc-950 text-white rounded-3xl p-5 border border-zinc-800 shadow-lg space-y-5">
              
              {/* Mini Navigation Bar */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-xs">
                <div className="flex items-center gap-2 font-black tracking-wider text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                  <span>{settings.logoText || 'STUDIO'}</span>
                  <span className="text-orange-500 text-[11px] font-bold">{settings.logoSubtext || 'PRODUCTION'}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-zinc-400">
                  <span className="text-white border-b-2 border-orange-600 pb-1">Shop</span>
                  <span>Apps</span>
                  <span>Themes</span>
                </div>
              </div>

              {/* Sample Product Showcase Card */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-600 text-white shadow-xs">
                    40% OFF
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" /> 5.0 (64)
                  </span>
                </div>

                <div>
                  <h5 className="font-bold text-sm text-white">NextGen Full-Stack SaaS Template</h5>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">Ultra-clean React 19 architecture with instant checkout.</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-orange-500">
                    {settings.currencySymbol || '৳'}49.00
                  </span>
                  <span className="text-xs text-zinc-500 line-through">
                    {settings.currencySymbol || '৳'}89.00
                  </span>
                </div>

                {/* Button Action Previews */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Get Access</span>
                  </button>

                  <button
                    type="button"
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all"
                  >
                    <span>Live Demo</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Sample Metrics / Badges */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-orange-400">Monthly Growth</span>
                  <div className="text-base font-black text-white flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> +34.2%
                  </div>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-orange-400">Active Theme</span>
                  <div className="text-xs font-mono font-bold text-white truncate">
                    {selectedHex.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-orange-950/40 border border-orange-800/40 rounded-xl text-[11px] text-orange-200 flex items-center justify-between">
                <span>⚡ Theme changes are applied globally in real time.</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
