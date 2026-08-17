import React, { useState, useEffect } from 'react';
import { Mail, Send, History, Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendEmail, listEmails, GmailMessage } from '../../services/gmailService';
import { getAccessToken, googleSignIn } from '../../lib/auth';
import { motion, AnimatePresence } from 'motion/react';

const MarketingManager: React.FC = () => {
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const fetchHistory = async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setLoading(true);
    try {
      const history = await listEmails('label:sent');
      setEmails(history);
      setNeedsAuth(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        fetchHistory();
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Sign in failed' });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) return;

    setSending(true);
    setStatus(null);
    try {
      const success = await sendEmail(to, subject, body);
      if (success) {
        setStatus({ type: 'success', msg: 'Email sent successfully!' });
        setTo('');
        setSubject('');
        setBody('');
        fetchHistory();
      } else {
        setStatus({ type: 'error', msg: 'Failed to send email' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'An error occurred' });
    } finally {
      setSending(false);
    }
  };

  if (needsAuth) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
          <Mail className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 mb-2">Connect Gmail</h3>
        <p className="text-zinc-500 mb-8 max-w-sm">
          Send marketing emails and notifications directly using your Gmail account.
        </p>
        <button
          onClick={handleSignIn}
          className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors"
        >
          Authorize Gmail
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Compose Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Compose Email</h2>
          <p className="text-zinc-500 text-sm">Send a direct message or marketing update</p>
        </div>

        <form onSubmit={handleSend} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">Recipient Email</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-medium"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-medium"
                placeholder="Weekly Store Update"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">Message Content (HTML Supported)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-medium resize-none"
                placeholder="Hello! We have some exciting updates..."
              />
            </div>
          </div>

          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}
              >
                {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {status.msg}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending Message...' : 'Send Email Now'}
          </button>
        </form>
      </div>

      {/* History Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Sent History</h2>
            <p className="text-zinc-500 text-sm">Recent communications sent from this account</p>
          </div>
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-3">
          {loading && !emails.length ? (
            <div className="py-24 flex flex-col items-center justify-center text-zinc-400 gap-4">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">Loading history...</p>
            </div>
          ) : (
            <>
              {emails.map((email) => (
                <div key={email.id} className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm hover:border-zinc-300 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{email.date}</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Sent</span>
                  </div>
                  <h4 className="font-bold text-zinc-900 truncate">{email.subject || '(No Subject)'}</h4>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{email.snippet}</p>
                </div>
              ))}
              {emails.length === 0 && !loading && (
                <div className="py-24 flex flex-col items-center justify-center text-zinc-400 gap-4 text-center">
                  <History className="w-8 h-8 opacity-20" />
                  <p className="text-sm font-medium">No sent history found.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketingManager;
