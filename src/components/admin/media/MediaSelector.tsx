import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileCode, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleDrivePicker } from '../GoogleDrivePicker';
import { useMediaUpload, MediaEngineConfig } from '../../../lib/editing/mediaEngine';

interface MediaSelectorProps {
  onSelected: (url: string, metadata?: any) => void;
  config?: MediaEngineConfig;
  className?: string;
  placeholderText?: string;
}

/**
 * Shared Media Selection abstraction. Supports Drag-and-Drop, manual upload,
 * and Google Drive Picker in one cohesive Visual CMS component.
 */
export function MediaSelector({
  onSelected,
  config,
  className = '',
  placeholderText = 'Drag & drop file here or click to browse'
}: MediaSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const { uploadMedia, progress, isUploading } = useMediaUpload(config);

  // Propagate the completed URL to the parent
  useEffect(() => {
    if (progress.status === 'completed' && progress.percentage === 100) {
      // Small visual delay for completion state satisfaction
    }
  }, [progress.status]);

  const handleProcessFile = async (file: File) => {
    try {
      const url = await uploadMedia(file);
      onSelected(url, {
        name: file.name,
        size: file.size,
        mimeType: file.type
      });
    } catch (err) {
      console.error('[MediaSelector] File selection/upload failed:', err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleProcessFile(e.target.files[0]);
    }
  };

  const triggerFileBrowser = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDrivePick = (url: string, metadata?: any) => {
    onSelected(url, metadata);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Dropzone Container */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileBrowser}
        className={`relative border-2 border-dashed rounded-sm p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[140px] ${
          isDragActive
            ? 'border-[#C9A227] bg-[#C9A227]/5'
            : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.01]'
        } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={config?.allowedTypes?.join(',') || 'image/*,video/*'}
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {/* Overlay Progress State */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4">
            <Loader2 className="w-5 h-5 text-[#C9A227] animate-spin mb-3" />
            <div className="text-[10px] font-mono text-white uppercase tracking-widest mb-2">
              {progress.status === 'optimizing' ? 'Optimizing Asset...' : 'Uploading Asset...'}
            </div>
            <div className="w-40 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C9A227] transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="text-[9px] font-mono text-neutral-400 mt-1.5">{progress.percentage}%</div>
          </div>
        )}

        {/* Error State */}
        {progress.status === 'error' && (
          <div className="absolute top-2 right-2 flex items-center space-x-1.5 text-rose-500 bg-rose-950/40 border border-rose-950 px-2 py-1 rounded text-[10px] font-mono">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{progress.error}</span>
          </div>
        )}

        {/* Action Icon / Text */}
        <Upload className={`w-5 h-5 mb-2.5 transition-colors ${isDragActive ? 'text-[#C9A227]' : 'text-neutral-500'}`} />
        <span className="text-xs text-[color:inherit] font-sans font-medium px-4">{placeholderText}</span>
        <span className="text-[10px] text-neutral-500 font-mono uppercase mt-1">
          Max: {config?.maxSizeMB || 30}MB
        </span>
      </div>

      {/* Alternative Sources Bar */}
      <div className="flex items-center justify-between border-t border-white/5 pt-2">
        <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
          <FileCode className="w-3.5 h-3.5" />
          <span>Alternate Cloud Selection</span>
        </div>

        <GoogleDrivePicker onPick={handleDrivePick} />
      </div>
    </div>
  );
}
