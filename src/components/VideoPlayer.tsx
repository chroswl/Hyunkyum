import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Tv, Disc, Award, Video } from 'lucide-react';
import { VideoItem, Language } from '../types';
import { translations } from '../translations';
import { getMediaSource } from '../lib/mediaUtils';

interface VideoPlayerProps {
  items: VideoItem[];
  currentLang: Language;
}

export default function VideoPlayer({ items, currentLang }: VideoPlayerProps) {
  const [activeVideo, setActiveVideo] = useState<VideoItem | undefined>(items[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const t = translations[currentLang];

  // Sync activeVideo when items load or change
  useEffect(() => {
    if (items.length > 0) {
      if (!activeVideo || !items.some(item => item.id === activeVideo.id)) {
        setActiveVideo(items[0]);
      }
    } else {
      setActiveVideo(undefined);
    }
  }, [items, activeVideo]);

  // Helper to get nice opera icons based on roles or title
  const getIcon = (role?: string) => {
    const text = role?.toLowerCase() || '';
    if (text.includes('giovanni') || text.includes('don')) return <Disc className="w-4 h-4 text-neutral-400" />;
    if (text.includes('figaro')) return <Award className="w-4 h-4 text-neutral-400" />;
    return <Tv className="w-4 h-4 text-neutral-400" />;
  };

  if (items.length === 0 || !activeVideo) {
    return (
      <div id="video-player-loading" className="w-full py-24 text-center border border-neutral-900 rounded bg-[var(--color-bg)] animate-pulse">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-[1px] bg-[var(--color-bg)]" />
          <span className="text-[10px] tracking-[0.3em] text-neutral-400 uppercase font-sans">
            Loading Repertoire Videos...
          </span>
        </div>
      </div>
    );
  }

  const media = getMediaSource(activeVideo.youtubeId);
  const isYouTube = media.type === 'youtube' && media.ytId;

  return (
    <div id="video-player-root" className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Main Theater Screen (8 cols) */}
      <div id="video-screen-container" className="lg:col-span-8 space-y-4">
        <div className="relative aspect-video w-full bg-[var(--color-bg)] rounded-sm overflow-hidden border border-neutral-900 group shadow-2xl">
          {/* Immersive Theater overlay when not active */}
          {!isPlaying ? (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center bg-cover bg-center" 
              style={isYouTube ? { backgroundImage: `url('https://img.youtube.com/vi/${media.ytId}/maxresdefault.jpg')` } : { backgroundColor: '#111' }}
            >
              <div className="absolute inset-0 bg-[var(--color-bg)]/75 transition-all duration-500 group-hover:bg-[var(--color-bg)]/70" />
              <motion.button
                id="play-button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPlaying(true)}
                className="relative z-10 w-16 h-16 md:w-20 md:h-20 bg-white hover:bg-[var(--color-bg)] rounded-full flex items-center justify-center text-black shadow-lg cursor-pointer transition-all duration-300"
                aria-label="Play Performance Video"
              >
                <Play className="w-8 h-8 fill-black translate-x-0.5" />
              </motion.button>
              <div className="relative z-10 text-center mt-6 px-4">
                <span className="text-[10px] tracking-[0.3em] text-neutral-400 uppercase font-semibold block mb-1">
                  {t.watchNow}
                </span>
                <h3 className="text-lg md:text-xl font-serif font-light text-[var(--color-text)] tracking-wide">
                  {activeVideo.title[currentLang] || activeVideo.title['EN']}
                </h3>
                {activeVideo.role && (
                  <p className="text-xs text-neutral-400 font-sans tracking-wider mt-1.5">
                    {activeVideo.role[currentLang] || activeVideo.role['EN']}
                  </p>
                )}
              </div>
            </div>
          ) : (
            isYouTube ? (
              <iframe
                id="youtube-iframe"
                src={`https://www.youtube.com/embed/${media.ytId}?autoplay=1&rel=0&modestbranding=1${media.start ? `&start=${media.start}` : ''}`}
                title={activeVideo.title[currentLang] || activeVideo.title['EN']}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : media.type === 'drive' ? (
              <iframe
                id="drive-iframe"
                src={media.src}
                title={activeVideo.title[currentLang] || activeVideo.title['EN']}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay"
                allowFullScreen
              />
            ) : (
              <video
                src={media.src}
                autoPlay
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-contain bg-[var(--color-bg)]"
                onEnded={() => setIsPlaying(false)}
              />
            )
          )}
        </div>
      </div>

      {/* Right Column: Playlist Sidebar (4 cols) */}
      <div id="video-playlist-sidebar" className="lg:col-span-4 space-y-3">
        <h3 className="text-xs tracking-[0.25em] text-neutral-400 uppercase font-sans font-semibold mb-4 px-2">
          Repertoire Reels
        </h3>
        <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
          {items.map((video) => {
            const isSelected = activeVideo.id === video.id;
            return (
              <button
                key={video.id}
                id={`video-list-item-${video.id}`}
                onClick={() => {
                  setActiveVideo(video);
                  setIsPlaying(true); // Auto play when selecting from sidebar
                }}
                className={`w-full text-left p-4 rounded-sm border transition-all duration-300 flex items-start space-x-3.5 group cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--color-bg)] border-white text-[var(--color-text)] shadow-md'
                    : 'bg-[var(--color-bg)] border-neutral-900 text-neutral-400 hover:bg-[var(--color-bg)] hover:border-neutral-800 hover:text-[var(--color-text)]'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {getIcon(video.role?.EN)}
                </div>
                <div className="space-y-1">
                  <h4 className={`text-xs md:text-sm font-sans tracking-wide transition-colors ${
                    isSelected ? 'text-[var(--color-text)] font-bold' : 'text-neutral-300 group-hover:text-[var(--color-text)]'
                  }`}>
                    {video.title[currentLang] || video.title['EN']}
                  </h4>
                  {video.role && (
                    <p className="text-[11px] text-neutral-500 tracking-wider">
                      {video.role[currentLang] || video.role['EN']}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
