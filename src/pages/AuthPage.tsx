import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  Download, 
  Zap, 
  Globe, 
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const mapAuthError = (errorString: string): string => {
  const err = errorString.toLowerCase();
  
  // 1. Invalid credentials
  if (
    err.includes('invalid login credentials') ||
    err.includes('invalid credentials') ||
    err.includes('invalid_credentials') ||
    err.includes('invalid email or password') ||
    err.includes('user not found')
  ) {
    return 'The email or password you entered is incorrect. Please verify your credentials and try again.';
  }

  // 2. Unverified/unconfirmed email
  if (
    err.includes('email not confirmed') ||
    err.includes('email not verified') ||
    err.includes('email_not_confirmed') ||
    err.includes('confirmation required') ||
    err.includes('verification required')
  ) {
    return 'Your email address has not been verified yet. Please check your inbox for the confirmation link to activate your account.';
  }

  // 3. Existing account conflict
  if (
    err.includes('already registered') ||
    err.includes('already exists') ||
    err.includes('email_exists') ||
    err.includes('email already in use') ||
    err.includes('user_already_exists')
  ) {
    return 'An account with this email address already exists. Please sign in instead, or use the "Forgot Password" link to regain access.';
  }

  // 4. Password too weak
  if (
    err.includes('password should be') || 
    err.includes('weak_password') || 
    err.includes('password too weak')
  ) {
    return 'The password you entered is too weak. Please ensure it meets all safety requirements.';
  }

  // 5. Rate limits or too many requests
  if (
    err.includes('too many requests') || 
    err.includes('rate limit') || 
    err.includes('over_limit')
  ) {
    return 'Too many login attempts. Please wait a few moments before trying again.';
  }

  // Fallback
  return errorString;
};

interface AuthPageProps {
  initialTab?: 'login' | 'signup';
  onSuccess: () => void;
  setActiveTab: (tab: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ 
  initialTab = 'login', 
  onSuccess,
  setActiveTab 
}) => {
  const { login, signup, loginWithOAuth, isLoading } = useAuth();
  const { settings } = useSettings();

  const [mode, setMode] = useState<'login' | 'signup'>(initialTab === 'signup' ? 'signup' : 'login');

  // Form Fields - Strictly blank by default with no pre-filling
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Status & Validation
  const [error, setError] = useState<string | null>(null);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);

  // Guarantee fields remain completely blank when component mounts or switches mode
  useEffect(() => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setOauthNotice(null);
  }, [initialTab, mode]);

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setOauthNotice(null);
  };

  // Password Requirement Checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const passwordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Password Strength Score (0 to 4)
  const calculateStrength = () => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumber) score++;
    return score;
  };

  const strengthScore = calculateStrength();

  const getStrengthLabel = () => {
    if (password.length === 0) return { label: 'None', color: 'bg-zinc-200', text: 'text-zinc-500' };
    if (strengthScore <= 2) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600' };
    if (strengthScore === 3) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-600' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const strengthInfo = getStrengthLabel();

  // LOGIN SUBMIT
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please type your email and password to log in.');
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      setError(mapAuthError(res.error || "Invalid email or password. Please check your credentials and try again."));
      return;
    }

    onSuccess();
  };

  // SIGNUP SUBMIT
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please type your name, email, and password to create an account.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms & Conditions to create an account.');
      return;
    }

    if (!passwordValid) {
      setError('Your password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.');
      return;
    }

    if (!passwordsMatch) {
      setError('Confirm password does not match the password entered.');
      return;
    }

    const res = await signup(fullName, email, password);
    if (!res.success) {
      setError(mapAuthError(res.error || 'Failed to create account. Please try again.'));
      return;
    }

    if (res.requiresVerification) {
      setActiveTab('verify-email');
    } else {
      onSuccess();
    }
  };

  // OAUTH HANDLER
  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null);
    setOauthNotice(null);
    const res = await loginWithOAuth(provider);
    if (!res.success && res.error) {
      setOauthNotice(mapAuthError(res.error));
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-zinc-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full bg-white border border-zinc-200/90 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT COLUMN: BRANDING & VISUAL AREA (Desktop only) */}
        <div className="lg:col-span-5 bg-zinc-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-r border-zinc-800">
          {/* Subtle Accent Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-8">
            {/* Logo & Tagline */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                {settings.logoUrl ? (
                  <img 
                    src={settings.logoUrl} 
                    alt={settings.websiteName} 
                    className="h-10 w-auto max-w-[140px] object-contain rounded-xl drop-shadow-md" 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-xl tracking-tighter shadow-md shadow-orange-600/20">
                    {(settings.logoText || settings.websiteName || 'S').trim().charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-black tracking-wider text-white">
                    {settings.logoText || settings.websiteName}
                  </h2>
                  <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-widest">
                    {settings.logoSubtext || settings.tagline || 'Digital Marketplace'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed italic border-l-2 border-orange-500 pl-3 py-0.5">
                "{settings.heroSubheadline || settings.tagline || 'Everything Digital, All in One Collection.'}"
              </p>
            </div>

            {/* Feature Perks */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 text-orange-400 shrink-0 border border-zinc-800">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instant Download Vault</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Gain immediate access to source code, Figma UI kits, and vector assets right after purchase.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 text-orange-400 shrink-0 border border-zinc-800">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Verified Commercial Quality</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Every product is rigorously reviewed and includes commercial standard usage rights.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 text-orange-400 shrink-0 border border-zinc-800">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Isolated Customer Accounts</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Secure license keys, download tracking, and order history strictly restricted to your account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Badge */}
          <div className="relative z-10 pt-8 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Customer Authentication Portal</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Verified Account Protection
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: AUTHENTICATION FORM */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            
            {/* TAB SWITCHER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 mb-6 gap-3">
              <div>
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {mode === 'login' 
                    ? 'Enter your email and password to access your account.' 
                    : 'Fill in your details below to create a new customer account.'}
                </p>
              </div>

              {/* Switch Buttons */}
              <div className="bg-zinc-100 p-1 rounded-2xl flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  id="tab-btn-login"
                  onClick={() => switchMode('login')}
                  className={`relative px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                    mode === 'login' 
                      ? 'bg-zinc-950 text-white shadow-sm' 
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="tab-btn-signup"
                  onClick={() => switchMode('signup')}
                  className={`relative px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                    mode === 'signup' 
                      ? 'bg-zinc-950 text-white shadow-sm' 
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Error Message Box */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 bg-red-50 border border-red-200/80 text-red-800 text-xs font-medium rounded-2xl flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 leading-relaxed">{error}</div>
              </motion.div>
            )}

            {/* OAuth Notice Box */}
            {oauthNotice && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium rounded-2xl flex items-start gap-2.5"
              >
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 leading-relaxed">{oauthNotice}</div>
              </motion.div>
            )}

            {/* ANIMATED FORM CONTAINER */}
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                /* LOGIN FORM */
                <motion.form 
                  key="login-form"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLoginSubmit} 
                  autoComplete="off"
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="font-bold text-zinc-800 block mb-1" htmlFor="login-email-input">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                      <input
                        id="login-email-input"
                        name="auth_login_email"
                        type="email"
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-form-type="other"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Type your email address"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-zinc-900 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-zinc-800 block" htmlFor="login-password-input">
                        Password
                      </label>
                      <button
                        type="button"
                        id="forgot-password-link-btn"
                        onClick={() => setActiveTab('forgot-password')}
                        className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                      <input
                        id="login-password-input"
                        name="auth_login_password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-form-type="other"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Type your password"
                        className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-zinc-900 font-medium"
                      />
                      <button
                        type="button"
                        id="toggle-login-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-700"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-700 font-medium">
                      <input
                        type="checkbox"
                        id="remember-me-checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                      />
                      <span>Remember Me</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    id="submit-login-btn"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2 space-y-2">
                    <p className="text-zinc-600 font-medium">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        id="switch-to-signup-link-btn"
                        onClick={() => switchMode('signup')}
                        className="font-bold text-zinc-900 hover:underline"
                      >
                        Create an account
                      </button>
                    </p>
                  </div>
                </motion.form>
              ) : (
                /* SIGN UP FORM */
                <motion.form 
                  key="signup-form"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSignupSubmit} 
                  autoComplete="off"
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="font-bold text-zinc-800 block mb-1" htmlFor="signup-name-input">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-orange-500 absolute left-3.5 top-3" />
                      <input
                        id="signup-name-input"
                        name="auth_signup_fullname"
                        type="text"
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-form-type="other"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Type your full name"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-orange-600 focus:outline-none transition-all text-zinc-900 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-800 block mb-1" htmlFor="signup-email-input">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-orange-500 absolute left-3.5 top-3" />
                      <input
                        id="signup-email-input"
                        name="auth_signup_email"
                        type="email"
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-form-type="other"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Type your email address"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-orange-600 focus:outline-none transition-all text-zinc-900 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-800 block mb-1" htmlFor="signup-password-input">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-orange-500 absolute left-3.5 top-3" />
                      <input
                        id="signup-password-input"
                        name="auth_signup_password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-form-type="other"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Type your password (min. 8 characters)"
                        className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-orange-600 focus:outline-none transition-all text-zinc-900 font-medium"
                      />
                      <button
                        type="button"
                        id="toggle-signup-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-orange-500 hover:text-zinc-700"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* LIVE PASSWORD STRENGTH METER */}
                    {password.length > 0 && (
                      <div className="mt-2.5 p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-zinc-700">Password Strength:</span>
                          <span className={`font-bold ${strengthInfo.text}`}>{strengthInfo.label}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden flex gap-1 p-0.5">
                          <div className={`h-full flex-1 rounded-full ${strengthScore >= 1 ? strengthInfo.color : 'bg-transparent'}`} />
                          <div className={`h-full flex-1 rounded-full ${strengthScore >= 2 ? strengthInfo.color : 'bg-transparent'}`} />
                          <div className={`h-full flex-1 rounded-full ${strengthScore >= 3 ? strengthInfo.color : 'bg-transparent'}`} />
                          <div className={`h-full flex-1 rounded-full ${strengthScore >= 4 ? strengthInfo.color : 'bg-transparent'}`} />
                        </div>
                        {/* Rules Checklist */}
                        <div className="grid grid-cols-2 gap-1 text-[10px] pt-1">
                          <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                            {hasMinLength ? <Check className="w-3 h-3 text-emerald-600" /> : '•'} 8+ Characters
                          </span>
                          <span className={`flex items-center gap-1 ${hasUppercase ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                            {hasUppercase ? <Check className="w-3 h-3 text-emerald-600" /> : '•'} 1 Uppercase Letter
                          </span>
                          <span className={`flex items-center gap-1 ${hasLowercase ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                            {hasLowercase ? <Check className="w-3 h-3 text-emerald-600" /> : '•'} 1 Lowercase Letter
                          </span>
                          <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                            {hasNumber ? <Check className="w-3 h-3 text-emerald-600" /> : '•'} 1 Number
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-zinc-800 block mb-1" htmlFor="signup-confirmpassword-input">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-orange-500 absolute left-3.5 top-3" />
                      <input
                        id="signup-confirmpassword-input"
                        name="auth_signup_confirmpassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-form-type="other"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Retype your password"
                        className={`w-full pl-10 pr-10 py-2.5 bg-zinc-50 border rounded-xl focus:bg-white focus:outline-none transition-all font-medium text-zinc-900 ${
                          confirmPassword.length > 0 
                            ? passwordsMatch 
                              ? 'border-emerald-500 focus:border-emerald-600' 
                              : 'border-red-400 focus:border-red-500'
                            : 'border-zinc-200 focus:border-orange-600'
                        }`}
                      />
                      <button
                        type="button"
                        id="toggle-signup-confirmpassword-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-orange-500 hover:text-zinc-700"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && (
                      <p className={`text-[10px] mt-1 font-semibold flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                        {passwordsMatch ? (
                          <>
                            <Check className="w-3 h-3" /> Passwords match
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" /> Passwords do not match
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-zinc-700 font-medium">
                      <input
                        type="checkbox"
                        id="agree-terms-checkbox"
                        required
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 shrink-0"
                      />
                      <span className="text-[11px] leading-snug">
                        I agree to the{' '}
                        <button
                          type="button"
                          id="terms-link-btn"
                          onClick={() => setActiveTab('terms')}
                          className="font-bold text-zinc-900 underline hover:text-zinc-700"
                        >
                          Terms & Conditions
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          id="privacy-link-btn"
                          onClick={() => setActiveTab('privacy')}
                          className="font-bold text-zinc-900 underline hover:text-zinc-700"
                        >
                          Privacy Policy
                        </button>
                        .
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    id="submit-signup-btn"
                    disabled={isLoading || !agreeTerms}
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create Customer Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-zinc-600 font-medium">
                      Already have an account?{' '}
                      <button
                        type="button"
                        id="switch-to-login-link-btn"
                        onClick={() => switchMode('login')}
                        className="font-bold text-zinc-900 hover:underline"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* SOCIAL OAUTH AUTHENTICATION BUTTONS */}
            <div className="mt-6 pt-6 border-t border-zinc-100 space-y-3">
              <div className="relative text-center">
                <span className="bg-white px-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider relative z-10">
                  Or Continue With
                </span>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-100" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="oauth-google-btn"
                  onClick={() => handleOAuth('google')}
                  className="py-2.5 px-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-xl text-zinc-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all group cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  id="oauth-github-btn"
                  onClick={() => handleOAuth('github')}
                  className="py-2.5 px-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-xl text-zinc-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all group cursor-pointer"
                >
                  <Github className="w-4 h-4 text-zinc-900 group-hover:scale-110 transition-transform" />
                  <span>GitHub</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
