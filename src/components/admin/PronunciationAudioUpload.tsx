import React, { useState, useRef } from 'react';
import { Volume2, Upload, Trash2, RefreshCw, CheckCircle, AlertCircle, Play, Pause, Music } from 'lucide-react';
import { uploadToR2 } from '../../r2';

interface PronunciationAudioUploadProps {
  audioUrl?: string;
  onChange: (url: string) => void;
  className?: string;
}

export default function PronunciationAudioUpload({
  audioUrl = '',
  onChange,
  className = ''
}: PronunciationAudioUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Audio test player state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!audioUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('playing', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', (err) => {
      console.error("Audio playback error:", err);
      setIsPlaying(false);
      setErrorMessage("Could not play audio. Please verify the file format or URL.");
    });

    audio.play().catch(err => {
      console.error("Playback failed:", err);
      setIsPlaying(false);
      setErrorMessage("Failed to play audio.");
    });
  };

  const handleFile = async (file: File) => {
    clearMessages();

    // Validate file type
    const validAudioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.aac', '.flac', '.webm'];
    const fileNameLower = file.name.toLowerCase();
    const hasValidExt = validAudioExtensions.some(ext => fileNameLower.endsWith(ext));
    const isAudioMime = file.type.startsWith('audio/') || file.type === 'video/mp4' || file.type === 'video/webm';

    if (!hasValidExt && !isAudioMime) {
      setErrorMessage("Please select a valid audio file (.mp3, .m4a, .wav, .ogg, .aac).");
      return;
    }

    // Maximum 25MB for audio clips
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("File is too large. Audio recording must be under 25MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Direct upload to R2 audio folder with server-side authorization
      const uploadedUrl = await uploadToR2(
        file,
        (progress) => {
          setUploadProgress(progress);
        },
        'audio'
      );

      // Stop any previous playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
      }

      onChange(uploadedUrl);
      setSuccessMessage(`Audio successfully uploaded and linked! (${file.name})`);
    } catch (err: any) {
      console.error("Audio upload error:", err);
      setErrorMessage(err.message || "Failed to upload audio to storage. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
    onChange('');
    clearMessages();
    setSuccessMessage("Audio removed. Playback button will be hidden until a new file is uploaded.");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-start space-x-2 p-3 bg-rose-950/50 border border-rose-500/30 rounded text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
          <span className="flex-1">{errorMessage}</span>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)} 
            className="text-rose-400 hover:text-white text-xs font-mono"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start space-x-2 p-3 bg-emerald-950/50 border border-emerald-500/30 rounded text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
          <span className="flex-1">{successMessage}</span>
          <button 
            type="button" 
            onClick={() => setSuccessMessage(null)} 
            className="text-emerald-400 hover:text-white text-xs font-mono"
          >
            ×
          </button>
        </div>
      )}

      {/* Current Audio Status Box */}
      {audioUrl ? (
        <div className="p-4 bg-white/[0.03] border border-white/10 rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-medium text-white/90">
              <Music className="w-4 h-4 text-[#C9A227]" />
              <span className="tracking-wide">Current Pronunciation Audio</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              Active on Site
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Test Playback button */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-sans tracking-wider uppercase transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-[#C9A227] text-black font-semibold shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Test Playback'}</span>
            </button>

            {/* Replace button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-sans tracking-wider uppercase bg-white/5 hover:bg-[#C9A227]/20 border border-white/10 hover:border-[#C9A227]/50 text-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>Replace Recording</span>
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-sm text-xs font-sans tracking-wider uppercase bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/20 text-rose-300 transition-all cursor-pointer"
              title="Remove audio recording"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>

          {/* Audio URL display */}
          <div className="pt-2 border-t border-white/5 text-[10px] text-neutral-400 font-mono break-all select-all bg-black/30 p-2 rounded">
            {audioUrl}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-white/[0.02] border border-dashed border-white/10 rounded-sm text-center">
          <p className="text-xs text-neutral-400 font-sans">
            No Korean pronunciation recording uploaded yet.
          </p>
          <p className="text-[10px] text-neutral-500 mt-0.5">
            The playback button will only appear in the Biography section once an audio file is uploaded.
          </p>
        </div>
      )}

      {/* Upload & Drop Zone */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase text-[#C9A227] tracking-widest font-semibold block">
          Upload / Replace Audio File (.mp3, .m4a, .wav)
        </label>
        
        <div
          className={`relative border-2 border-dashed rounded-sm p-5 text-center transition-all ${
            isDragOver
              ? 'border-[#C9A227] bg-[#C9A227]/5'
              : 'border-white/15 bg-white/[0.02] hover:border-white/30'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files?.[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-4">
              <div className="w-7 h-7 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-neutral-300 font-mono">
                Uploading to Storage: {uploadProgress ?? 0}%
              </span>
              <div className="w-48 bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#C9A227] h-full transition-all duration-300" 
                  style={{ width: `${uploadProgress ?? 0}%` }}
                />
              </div>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center space-y-1 py-1 w-full h-full">
              <Upload className="w-5 h-5 text-neutral-400 mb-1 group-hover:text-[#C9A227] transition-colors" />
              <span className="text-[11px] text-neutral-200 font-sans font-medium">
                Drag & Drop audio file here or <span className="text-[#C9A227] underline">Browse</span>
              </span>
              <span className="text-[9px] text-neutral-400 font-sans">
                MP3, M4A, WAV, OGG, AAC up to 25MB • Secure Admin Upload
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
