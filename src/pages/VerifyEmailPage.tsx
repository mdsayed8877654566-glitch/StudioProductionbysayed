import React, { useState, useEffect, useRef } from 'react';
import { Mail, CheckCircle2, ArrowLeft, RefreshCw, Edit3, ShieldAlert, Sparkles, ArrowRight, KeyRound, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface VerifyEmailPageProps {
  setActiveTab: (tab: string) => void;
  onVerifiedSuccess?: () => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ 
  setActiveTab,
  onVerifiedSuccess 
}) => {
  const { user, pendingEmailVerification, currentOtp, generateAndSendOtp, verifyOtp, isLoading } = useAuth();

  const targetEmail = user?.email || pendingEmailVerification || 'customer@studiocollection.com';

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState<number>(60);
  const [resentSuccess, setResentSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>(targetEmail);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const activeOtpCode = currentOtp || '849201';

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    setErrorMsg(null);
    const numericVal = value.replace(/\D/g, '');
    
    if (numericVal.length > 1) {
      // Pasted multi-digit code
      const pastedDigits = numericVal.slice(0, 6).split('');
      const newOtp = [...otpDigits];
      pastedDigits.forEach((digit, idx) => {
        if (idx < 6) newOtp[idx] = digit;
      });
      setOtpDigits(newOtp);
      const nextIdx = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const newOtp = [...otpDigits];
    newOtp[index] = numericVal;
    setOtpDigits(newOtp);

    // Auto advance focus
    if (numericVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle KeyDown for Backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste event on any box
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const digits = pastedData.split('');
    const newOtp = ['', '', '', '', '', ''];
    digits.forEach((d, idx) => {
      newOtp[idx] = d;
    });
    setOtpDigits(newOtp);

    const focusIdx = Math.min(digits.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  // Auto-fill active OTP helper
  const handleAutoFill = () => {
    const digits = activeOtpCode.split('');
    setOtpDigits(digits);
    setErrorMsg(null);
  };

  // Verification Submit Handler
  const handleSubmitVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    const res = await verifyOtp(fullCode);
    if (res.success) {
      setSuccessMsg('Account verified successfully! Redirecting...');
      setTimeout(() => {
        if (onVerifiedSuccess) {
          onVerifiedSuccess();
        } else {
          setActiveTab('account');
        }
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Invalid OTP verification code. Please try again or resend code.');
    }
  };

  // Resend OTP / Verification Email Handler
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setResentSuccess(false);

    const res = await generateAndSendOtp(targetEmail);
    if (res.success) {
      setResentSuccess(true);
      setCooldown(60); // Reset 60-second timer
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setResentSuccess(false), 5000);
    } else {
      setErrorMsg(res.error || 'Failed to resend verification OTP email.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-zinc-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-lg w-full bg-white border border-zinc-200 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200/80 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <KeyRound className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Email OTP Verification</h2>
          <p className="text-xs text-zinc-700 max-w-sm mx-auto leading-relaxed">
            To confirm your email address is authentic, please enter the 6-digit verification OTP sent to your email.
          </p>
        </div>

        {/* Email Address Display Pill */}
        <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="font-bold text-zinc-900 truncate">{targetEmail}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsChangingEmail(!isChangingEmail)}
            className="text-[11px] font-bold text-zinc-700 hover:text-zinc-900 flex items-center gap-1 shrink-0 hover:underline"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Change</span>
          </button>
        </div>

        {/* Change Email Inline Form */}
        {isChangingEmail && (
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3 text-xs">
            <p className="font-bold text-amber-900">Enter Updated Email Address:</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-zinc-900 font-medium"
                placeholder="new.email@example.com"
              />
              <button
                type="button"
                onClick={() => {
                  setIsChangingEmail(false);
                  setActiveTab('signup');
                }}
                className="px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl"
              >
                Update & Signup
              </button>
            </div>
          </div>
        )}

        {/* SIMULATED EMAIL INBOX BANNER */}
        <div className="p-4 bg-zinc-950 text-white rounded-2xl space-y-2 text-xs shadow-md border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400 shrink-0 animate-pulse" />
              <span className="font-bold text-orange-400">Simulated Email Inbox Notification</span>
            </div>
            <span className="text-[10px] bg-zinc-850 text-zinc-300 px-2 py-0.5 rounded font-mono border border-zinc-700">OTP Delivered</span>
          </div>

          <p className="text-[11px] text-zinc-400">
            Verification code sent to <strong className="text-white">{targetEmail}</strong>:
          </p>

          <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-mono text-[11px]">OTP Code:</span>
              <span className="font-mono text-lg font-black tracking-widest text-orange-400 select-all">
                {activeOtpCode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(activeOtpCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 border border-zinc-700"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleAutoFill}
                className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-extrabold rounded-lg transition-colors"
              >
                Auto-fill Code
              </button>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {resentSuccess && (
          <div className="p-3.5 bg-orange-50 border border-orange-200 text-orange-900 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
            <span>A new 6-digit verification OTP has been sent to {targetEmail}!</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 6-DIGIT OTP INPUT FORM */}
        <form onSubmit={handleSubmitVerification} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 text-center block">
              Enter 6-Digit OTP Code
            </label>

            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold bg-zinc-50 border rounded-2xl focus:bg-white focus:outline-none transition-all shadow-sm ${
                    digit 
                      ? 'border-orange-500 text-zinc-900 bg-white ring-2 ring-orange-500/20' 
                      : 'border-zinc-200 text-zinc-800 focus:border-orange-500'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* VERIFY SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isLoading || otpDigits.join('').length !== 6}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Verify Email & Activate Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* RESEND OTP WITH 60s TIMER */}
        <div className="pt-2 border-t border-zinc-100 space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
            <span>Didn't receive code?</span>
            <span className="font-mono text-orange-600 font-bold">
              {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend ready'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={cooldown > 0 || isLoading}
            className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border ${
              cooldown > 0 
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed' 
                : 'bg-orange-50 hover:bg-orange-100 text-orange-950 border-orange-200 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>
              {cooldown > 0 
                ? `Resend Verification Email (${cooldown}s)` 
                : 'Resend Verification Email'}
            </span>
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
        </div>

        {/* Helpful Tips */}
        <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-[11px] text-zinc-600 space-y-1">
          <p className="font-bold text-zinc-700">Verification Guidelines:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-zinc-500">
            <li>Check your email inbox or the simulated email notification banner above.</li>
            <li>If the code doesn't arrive immediately, wait for the 60-second timer and click "Resend Verification Email".</li>
            <li>Once verified, your account will have full access to downloads and purchases.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

