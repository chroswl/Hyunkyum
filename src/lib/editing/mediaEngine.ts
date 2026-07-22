import { useState, useCallback } from 'react';
import { uploadToR2, isAIStudioPreview } from '../../r2';
import { compressBase64, optimizeImageFile } from '../imageCompressor';
import { getMediaSource } from '../mediaUtils';

/**
 * Universal media types supported by the Visual CMS framework.
 */
export type MediaType = 'image' | 'video' | 'youtube' | 'drive';

/**
 * Normalized source representation of any media asset.
 */
export interface MediaSource {
  type: MediaType;
  src: string;
  ytId?: string;
  start?: number;
}

/**
 * Reusable metadata for copyright and photo credits.
 */
export interface MediaCopyright {
  text?: string;
  url?: string;
}

/**
 * The standard, CMS-wide structure for media items.
 */
export interface MediaItem {
  id?: string;
  url: string;
  type?: MediaType;
  name?: string;
  size?: number;
  copyright?: string;
  copyrightUrl?: string;
}

/**
 * Config options for specific media widgets.
 */
export interface MediaEngineConfig {
  folder?: string;
  aspectRatio?: number;
  maxWidth?: number;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

/**
 * Unified progress state tracking for media operations.
 */
export interface UploadProgress {
  percentage: number;
  status: 'idle' | 'optimizing' | 'uploading' | 'completed' | 'error';
  error?: string;
}

/**
 * Reusable functional methods for media manipulation.
 */
export const MediaEngine = {
  /**
   * Safe preview check.
   */
  isPreviewEnv(): boolean {
    return isAIStudioPreview();
  },

  /**
   * Normalizes any image/video/youtube/drive URL or identifier to its structured MediaSource representation.
   */
  resolve(url: string, explicitType?: 'image' | 'video' | 'youtube'): MediaSource {
    return getMediaSource(url, explicitType);
  },

  /**
   * Optimizes a raw image file, scaling it down and compressing it to fit within database limits.
   */
  async optimize(file: File, onProgress?: (progress: number) => void): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files can be optimized.');
    }
    return optimizeImageFile(file, onProgress);
  },

  /**
   * Uploads media to Cloudflare R2 storage using direct presigned URLs.
   */
  async upload(
    fileOrBase64: File | string,
    folder = 'media',
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      return await uploadToR2(fileOrBase64, onProgress, folder);
    } catch (err: any) {
      console.error('[MediaEngine] Upload failed:', err);
      throw err;
    }
  }
};

/**
 * Reusable React Hook for simple, structured upload state management.
 */
export function useMediaUpload(config?: MediaEngineConfig) {
  const [progress, setProgress] = useState<UploadProgress>({
    percentage: 0,
    status: 'idle'
  });

  const uploadMedia = useCallback(async (
    fileOrBase64: File | string,
    customFolder?: string
  ): Promise<string> => {
    const folderName = customFolder || config?.folder || 'media';
    const maxSize = (config?.maxSizeMB || 100) * 1024 * 1024;

    if (fileOrBase64 instanceof File && fileOrBase64.size > maxSize) {
      const errMsg = `File size exceeds the max limit of ${config?.maxSizeMB || 100} MB.`;
      setProgress({ percentage: 0, status: 'error', error: errMsg });
      throw new Error(errMsg);
    }

    try {
      // Step 1: Optimize if it is an image File
      let sourceToUpload = fileOrBase64;
      if (fileOrBase64 instanceof File && fileOrBase64.type.startsWith('image/')) {
        setProgress({ percentage: 0, status: 'optimizing' });
        sourceToUpload = await MediaEngine.optimize(fileOrBase64, (optProgress) => {
          setProgress({ percentage: Math.round(optProgress * 0.4), status: 'optimizing' });
        });
      }

      // Step 2: Upload source
      setProgress({ percentage: 40, status: 'uploading' });
      const url = await MediaEngine.upload(sourceToUpload, folderName, (uploadProg) => {
        const scaledProgress = 40 + Math.round(uploadProg * 0.6);
        setProgress({ percentage: scaledProgress, status: 'uploading' });
      });

      setProgress({ percentage: 100, status: 'completed' });
      return url;
    } catch (err: any) {
      const errMsg = err?.message || 'Media upload failed';
      setProgress({ percentage: 0, status: 'error', error: errMsg });
      throw err;
    }
  }, [config]);

  const resetUploadProgress = useCallback(() => {
    setProgress({ percentage: 0, status: 'idle' });
  }, []);

  return {
    progress,
    isUploading: progress.status === 'uploading' || progress.status === 'optimizing',
    uploadMedia,
    resetUploadProgress
  };
}
