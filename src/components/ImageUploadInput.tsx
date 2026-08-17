import React, { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { compressAndConvertToBase64 } from '../utils/imageUtils';
import { uploadImageToSupabase } from '../lib/supabase';

interface ImageUploadInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label, value, onChange, disabled, placeholder = 'https://...', className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<'url' | 'upload'>('upload');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      const urlOrBase64 = await uploadImageToSupabase(file, 'products');
      onChange(urlOrBase64);
    } catch (err) {
      console.error('Failed to process image, falling back to compressed base64', err);
      try {
        const base64 = await compressAndConvertToBase64(file, 1000);
        onChange(base64);
      } catch (fallbackErr) {
        alert('Failed to process image. Please try again.');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <label className="font-bold text-orange-800 block text-xs">{label}</label>
        <div className="flex bg-orange-100 rounded-lg p-0.5">
          <button 
            type="button" 
            onClick={() => setMode('upload')}
            className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${mode === 'upload' ? 'bg-white text-orange-900 shadow-sm' : 'text-orange-600 hover:text-orange-800'}`}
          >
            <Upload className="w-3 h-3" /> Upload File
          </button>
          <button 
            type="button" 
            onClick={() => setMode('url')}
            className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${mode === 'url' ? 'bg-white text-orange-900 shadow-sm' : 'text-orange-600 hover:text-orange-800'}`}
          >
            <LinkIcon className="w-3 h-3" /> Image URL
          </button>
        </div>
      </div>
      
      {mode === 'url' ? (
        <input 
          type="text" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          disabled={disabled} 
          placeholder={placeholder} 
          className="w-full p-2.5 border border-orange-100 rounded-xl font-medium text-xs disabled:bg-orange-50 disabled:text-orange-400 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all" 
        />
      ) : (
        <div 
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`w-full p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer
            ${disabled ? 'border-orange-100 bg-orange-50 cursor-not-allowed opacity-60' : 'border-orange-200 bg-orange-50/50 hover:bg-orange-50 hover:border-orange-300'}`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml" 
            className="hidden" 
            disabled={disabled}
          />
          {isUploading ? (
            <span className="text-xs font-bold text-orange-600 animate-pulse">Processing image...</span>
          ) : (
            <>
              <ImageIcon className="w-6 h-6 text-orange-400" />
              <div className="text-center">
                <span className="text-xs font-bold text-orange-700">Click to browse from gallery/disk</span>
                <p className="text-[10px] text-orange-500 mt-0.5">Supports PNG, JPG, WEBP, SVG</p>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Preview */}
      {value && (
        <div className="mt-2 flex items-center gap-3 bg-white p-2 border border-orange-100 rounded-lg">
          <img src={value} alt="Preview" className="w-10 h-10 rounded object-cover border border-orange-100" />
          <span className="text-[10px] font-bold text-orange-600 truncate max-w-[200px]">
            {value.startsWith('data:') ? 'Local Upload' : value}
          </span>
          <button 
            type="button" 
            onClick={() => onChange('')} 
            disabled={disabled}
            className="ml-auto text-[10px] text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-50 rounded"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
