import React, { useState, useEffect } from 'react';
import { File, Upload, Trash2, ExternalLink, RefreshCw, Loader2, HardDrive } from 'lucide-react';
import { listDriveFiles, uploadToGoogleDrive, deleteDriveFile, DriveFile } from '../../services/googleDriveService';
import { getAccessToken, googleSignIn } from '../../lib/auth';
import { motion, AnimatePresence } from 'motion/react';

const DriveBrowser: React.FC = () => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const driveFiles = await listDriveFiles();
      setFiles(driveFiles);
      setNeedsAuth(false);
    } catch (err) {
      setError('Failed to fetch files from Google Drive');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        fetchFiles();
      }
    } catch (err) {
      setError('Sign in failed');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedFile = await uploadToGoogleDrive(file);
      if (uploadedFile) {
        setFiles(prev => [uploadedFile, ...prev]);
      }
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      const success = await deleteDriveFile(fileId);
      if (success) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
      }
    } catch (err) {
      setError('Delete failed');
    }
  };

  if (needsAuth) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
          <HardDrive className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 mb-2">Connect Google Drive</h3>
        <p className="text-zinc-500 mb-8 max-w-sm">
          Access and manage your Google Drive files directly from your admin dashboard.
        </p>
        <button
          onClick={handleSignIn}
          className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Google Drive</h2>
          <p className="text-zinc-500 text-sm">Manage your cloud storage and assets</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="p-2.5 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh files"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3 text-sm">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          {error}
        </div>
      )}

      {loading && !files.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-400 gap-4">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Fetching files...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <AnimatePresence mode="popLayout">
                  {files.map((file) => (
                    <motion.tr
                      key={file.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-zinc-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-500 flex-shrink-0">
                            {file.thumbnailLink ? (
                              <img src={file.thumbnailLink} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <File className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-zinc-900 truncate">{file.name}</div>
                            <div className="text-xs text-zinc-500">{file.mimeType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Open in Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(file.id, file.name)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {files.length === 0 && !loading && (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-zinc-400">
                      No files found in your Google Drive.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriveBrowser;
