import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ZoomIn, X } from 'lucide-react';
import { MediaEngine } from '../../../lib/editing/mediaEngine';

interface MediaPreviewProps {
  url?: string;
  explicitType?: 'image' | 'video' | 'youtube';
  className?: string;
  imageClassName?: string;
  iframeClassName?: string;
  videoClassName?: string;
  videoRef?: React.Ref<HTMLVideoElement>;
  onLoadedData?: () => void;
  altText?: string;
  enableLightbox?: boolean;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
  showPlayIcon?: boolean;
  onEnded?: () => void;
}

/**
 * Shared media preview component. Gracefully handles images, local videos,
 * YouTube videos, and Google Drive files.
 */
export function MediaPreview({
  url,
  explicitType,
  className = '',
  imageClassName = '',
  iframeClassName = '',
  videoClassName = '',
  videoRef,
  onLoadedData,
  altText = 'Media asset',
  enableLightbox = false,
  muted,
  loop,
  autoPlay,
  controls,
  showPlayIcon,
  onEnded,
}: MediaPreviewProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const shouldShowPlayIcon = showPlayIcon ?? !autoPlay;

  if (!url) {
    return (
      <div className={`flex flex-col items-center justify-center border border-dashed border-white/10 bg-black/40 text-neutral-500 rounded-sm font-mono text-[10px] uppercase tracking-wider ${className}`}>
        No media selected
      </div>
    );
  }

  // Resolve structured info
  const media = MediaEngine.resolve(url, explicitType);

  const renderContent = (isLightbox = false) => {
    const baseClasses = isLightbox ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover';
    const finalImageClass = `${baseClasses} ${imageClassName}`;

    switch (media.type) {
      case 'video':
        return (
          <video
            ref={videoRef}
            src={media.src}
            className={`${baseClasses} ${videoClassName}`}
            muted={muted !== undefined ? muted : true}
            loop={loop !== undefined ? loop : true}
            autoPlay={autoPlay !== undefined ? autoPlay : true}
            playsInline
            controls={controls !== undefined ? controls : isLightbox}
            onLoadedData={onLoadedData}
            onEnded={onEnded}
          />
        );

      case 'youtube':
        const ytMute = muted !== undefined ? muted : true;
        const ytAutoPlay = autoPlay !== undefined ? autoPlay : isLightbox;
        
        // Build robust params for background autoplay, looping and mobile browsers (playsinline)
        const params = new URLSearchParams();
        if (media.start) params.set('start', String(media.start));
        if (ytAutoPlay) {
          params.set('autoplay', '1');
          params.set('playsinline', '1');
        }
        if (ytMute) {
          params.set('mute', '1');
        }
        // YouTube requires 'playlist' parameter to match the video ID in order for single-video looping to work
        if (loop || loop === undefined) {
          params.set('loop', '1');
          params.set('playlist', media.ytId || '');
        }
        params.set('controls', controls ? '1' : '0');
        params.set('rel', '0');
        params.set('enablejsapi', '1');
        params.set('iv_load_policy', '3'); // Hides video annotations
        params.set('modestbranding', '1'); // Minimizes YouTube logo

        return (
          <iframe
            src={`https://www.youtube.com/embed/${media.ytId}?${params.toString()}`}
            className={iframeClassName || "w-full h-full border-0"}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={altText}
          />
        );

      case 'drive':
        return (
          <iframe
            src={media.src}
            className={iframeClassName || "w-full h-full border-0"}
            allowFullScreen
            title={altText}
          />
        );

      case 'image':
      default:
        return (
          <img
            src={media.src}
            alt={altText}
            className={finalImageClass}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        );
    }
  };

  return (
    <>
      <div className={`relative overflow-hidden group ${className}`}>
        {renderContent(false)}

        {/* Video overlay icon */}
        {media.type !== 'image' && !enableLightbox && shouldShowPlayIcon && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none group-hover:bg-black/45 transition-colors">
            <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
              <Play className="w-4 h-4 fill-white/80 translate-x-[1px]" />
            </div>
          </div>
        )}

        {/* Lightbox Trigger Overlay */}
        {enableLightbox && media.type === 'image' && (
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100 cursor-zoom-in text-white z-10"
            aria-label="Zoom Image"
          >
            <div className="bg-black/60 border border-white/10 p-2.5 rounded-sm backdrop-blur-md">
              <ZoomIn className="w-4 h-4 text-[#C9A227]" />
            </div>
          </button>
        )}
      </div>

      {/* Lightbox Popup Dialog */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 cursor-zoom-out select-none"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer z-[120]"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-7xl max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {renderContent(true)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
