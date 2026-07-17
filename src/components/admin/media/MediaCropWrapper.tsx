import React from 'react';
import ImageCropperModal from '../../ImageCropperModal';

/**
 * Represent a media crop request.
 */
export interface CropTarget {
  src: string;
  aspect?: number;
  copyright?: string;
  copyrightUrl?: string;
  onCrop: (base64: string, copyright?: string, copyrightUrl?: string) => void;
  onCancel: () => void;
}

interface MediaCropWrapperProps {
  target: CropTarget | null;
}

/**
 * Shared Crop abstraction that connects visual editing pages with the robust ImageCropperModal.
 */
export function MediaCropWrapper({ target }: MediaCropWrapperProps) {
  if (!target) return null;

  // Format copyright string prefix to start with '©' for aesthetic consistency
  const formatCopyright = (val?: string) => {
    if (!val) return '';
    const trimmed = val.trim();
    if (trimmed.startsWith('©')) return trimmed;
    return `© ${trimmed}`;
  };

  return (
    <ImageCropperModal
      imageSrc={target.src}
      aspect={target.aspect}
      copyright={formatCopyright(target.copyright)}
      copyrightUrl={target.copyrightUrl}
      onCropCancel={target.onCancel}
      onCropDone={target.onCrop}
    />
  );
}
