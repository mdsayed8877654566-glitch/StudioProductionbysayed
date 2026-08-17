import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ForgotPasswordPageProps {
  setActiveTab: (tab: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ setActiveTab }) => {
  const { sendPasswordResetEmail, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    const res = await sendPasswordResetEmail(email);
    if (!res.success) {
      setError(res.error || 'Failed to send password reset link. Please try again.');
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
            <Sparkles className="w-6 h-6 text-orange-400" />
          </div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">Forgot Your Password?</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Enter the email address associated with your Studio Collection account and we'll send you a password reset link.
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
            <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl space-y-2">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-emerald-900">Reset Email Sent</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                We've sent a password reset link to <strong className="font-bold text-zinc-900">{email}</strong>.
              </p>
              <p className="text-[11px] text-zinc-500 pt-1">
                Please check your inbox (and spam folder) for further instructions.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-xl transition-colors"
              >
                Resend Reset Link
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="w-full py-2.5 text-zinc-700 hover:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </div>
          </div>
        ) : (
          /* FORM STATE */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-800 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-zinc-900 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="text-xs font-bold text-zinc-700 hover:text-zinc-900 flex items-center justify-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
