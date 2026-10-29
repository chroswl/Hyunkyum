import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { Language } from '../types';

interface PronunciationAudioPlayerProps {
  audioUrl?: string;
  currentLang?: Language;
  className?: string;
}

export default function PronunciationAudioPlayer({
  audioUrl,
  currentLang = 'EN',
  className = ''
}: PronunciationAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tooltipText = 
    currentLang === 'KO' ? '한국어 발음 듣기' :
    currentLang === 'DE' ? 'Koreanische Aussprache anhören' :
    'Listen to Korean pronunciation';

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setHasError(false);
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!audioUrl || typeof audioUrl !== 'string' || audioUrl.trim() === '') {
    return null;
  }

  const getOrCreateAudio = () => {
    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audio.preload = 'auto';

      audio.addEventListener('playing', () => {
        setIsLoading(false);
        setIsPlaying(true);
      });

      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      });

      audio.addEventListener('error', (err) => {
        console.error('Audio playback error:', err);
        setIsLoading(false);
        setIsPlaying(false);
        setHasError(true);
      });

      audioRef.current = audio;
    }
    return audioRef.current;
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const audio = getOrCreateAudio();

      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        if (hasError) setHasError(false);
        await audio.play();
        setIsLoading(false);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Failed to play pronunciation audio:', err);
      setIsLoading(false);
      setIsPlaying(false);
      setHasError(true);
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-label={isPlaying ? 'Pause pronunciation' : tooltipText}
        title={tooltipText}
        className={`group/btn relative inline-flex items-center justify-center w-5 h-5 rounded-full border transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-[#C9A227]/50 ${
          isPlaying
            ? 'border-[#C9A227] bg-[#C9A227]/20 text-[#C9A227] shadow-[0_0_8px_rgba(201,162,39,0.35)]'
            : hasError
            ? 'border-rose-500/40 bg-rose-950/20 text-rose-400'
            : 'border-current/25 text-current/60 hover:text-[#C9A227] hover:border-[#C9A227]/60 hover:bg-[#C9A227]/10'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-2.5 h-2.5 animate-spin text-[#C9A227]" />
        ) : isPlaying ? (
          <Pause className="w-2.5 h-2.5 text-[#C9A227] fill-current" />
        ) : (
          <Play className="w-2.5 h-2.5 ml-0.5 fill-current transition-transform duration-200 group-hover/btn:scale-110" />
        )}
      </button>
    </div>
  );
}
