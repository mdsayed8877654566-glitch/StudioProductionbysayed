import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ResetPasswordPageProps {
  setActiveTab: (tab: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ setActiveTab }) => {
  const { resetPasswordWithToken, isLoading } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Requirement Checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  const passwordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (!passwordValid) {
      setError('Your password must meet all complexity requirements below.');
      return;
    }

    if (!passwordsMatch) {
      setError('New passwords do not match.');
      return;
    }

    const res = await resetPasswordWithToken(newPassword);
    if (!res.success) {
      setError(res.error || 'Failed to update password. Please try again or request a new reset link.');
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-zinc-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-zinc-950 text-white rounded-2xl shadow-sm mb-1 border border-zinc-800">
            <Lock className="w-6 h-6 text-orange-400" />
          </div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">Set New Password</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Please choose a strong password for your Studio Collection customer account.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-medium rounded-2xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          /* SUCCESS STATE */
          <div className="space-y-6 text-center">
            <div className="p-5 bg-emerald-50 border border-emerald-200/80 rounded-2xl space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-emerald-900">Password Reset Successful!</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your password has been updated successfully. You can now log in with your new credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* FORM STATE */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-800 block mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-zinc-900 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Requirements Checklist */}
              <div className="mt-2.5 p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl grid grid-cols-2 gap-1 text-[10px]">
                <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                  {hasMinLength ? <Check className="w-3 h-3 text-emerald-600" /> : '•'} 8+ Chars
                </span>
                <span className={`flex items-center gap-1 ${hasUppercase ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                  {hasUppercase ? <Check className="w-3 h-3 text-emerald-600" /> : '•'} 1 Uppercase
                </span>
                <span className={`flex items-center gap-1 ${hasLowercase ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                  {hasLowercase ? <Check className="w-3 h-3 text-emerald-600" /> : '•'} 1 Lowercase
                </span>
                <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                  {hasNumber ? <Check className="w-3 h-3 text-emerald-600" /> : '•'} 1 Number
                </span>
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-800 block mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-zinc-900 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-[10px] mt-1 font-semibold flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                  {passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !passwordValid || !passwordsMatch}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
