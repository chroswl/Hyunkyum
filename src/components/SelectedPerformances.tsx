import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { Language, PerformanceSlide } from '../types';
import { fetchSelectedPerformances } from '../firebase';

const PERFORMANCE_SLIDES: PerformanceSlide[] = [
  {
    id: 'perf-slide-dead-man',
    image: '/src/assets/images/opera_backstage_1783548390414.jpg',
    bgPosition: 'center 35%',
    production: {
      EN: "Dead Man Walking",
      DE: "Dead Man Walking",
      KO: "데드 맨 워킹"
    },
    role: {
      EN: "Joseph de Rocher",
      DE: "Joseph de Rocher",
      KO: "조셉 드 로셰"
    },
    house: {
      EN: "Pfalztheater Kaiserslautern",
      DE: "Pfalztheater Kaiserslautern",
      KO: "팔츠 시어터 카이저슬라우테른"
    }
  },
  {
    id: 'perf-slide-1',
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=1600&auto=format&fit=crop',
    bgPosition: 'center',
    production: {
      EN: "Don Giovanni",
      DE: "Don Giovanni",
      KO: "돈 조반니"
    },
    role: {
      EN: "Don Giovanni (Title Role)",
      DE: "Don Giovanni (Titelrolle)",
      KO: "돈 조반니 (주역)"
    },
    house: {
      EN: "State Opera House, Prague",
      DE: "Staatsoper, Prag",
      KO: "프라하 국립 오페라 극장"
    }
  },
  {
    id: 'perf-slide-2',
    image: 'https://images.unsplash.com/photo-1460881680858-30d872d5b530?q=80&w=1600&auto=format&fit=crop',
    bgPosition: 'center',
    production: {
      EN: "Rigoletto",
      DE: "Rigoletto",
      KO: "리골레토"
    },
    role: {
      EN: "Rigoletto (Title Role)",
      DE: "Rigoletto (Titelrolle)",
      KO: "리골레토 (주역)"
    },
    house: {
      EN: "Deutsche Oper Berlin",
      DE: "Deutsche Oper Berlin",
      KO: "도이체 오페라 베를린"
    }
  },
  {
    id: 'perf-slide-3',
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1600&auto=format&fit=crop',
    bgPosition: 'center',
    production: {
      EN: "Die Zauberflöte",
      DE: "Die Zauberflöte",
      KO: "마술피리"
    },
    role: {
      EN: "Papageno",
      DE: "Papageno",
      KO: "파파게노"
    },
    house: {
      EN: "Vienna Volksoper",
      DE: "Volksoper Wien",
      KO: "빈 폴크스오퍼"
    }
  },
  {
    id: 'perf-slide-4',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1600&auto=format&fit=crop',
    bgPosition: 'center',
    production: {
      EN: "Le Nozze di Figaro",
      DE: "Le Nozze di Figaro",
      KO: "피가로의 결혼"
    },
    role: {
      EN: "Figaro",
      DE: "Figaro",
      KO: "피가로"
    },
    house: {
      EN: "Hamburg State Opera",
      DE: "Staatsoper Hamburg",
      KO: "함부르크 국립 오페라 극장"
    }
  }
];

interface SelectedPerformancesProps {
  currentLang: Language;
  slides?: PerformanceSlide[];
}

export default function SelectedPerformances({ currentLang, slides: propSlides }: SelectedPerformancesProps) {
  const [slides, setSlides] = useState<PerformanceSlide[]>(propSlides && propSlides.length > 0 ? propSlides : PERFORMANCE_SLIDES);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (propSlides && propSlides.length > 0) {
      setSlides(propSlides);
    }
  }, [propSlides]);

  useEffect(() => {
    if (!propSlides || propSlides.length === 0) {
      let active = true;
      fetchSelectedPerformances().then((data) => {
        if (active && data && data.length > 0) {
          setSlides(data);
        }
      });
      return () => { active = false; };
    }
  }, [propSlides]);

  useEffect(() => {
    if (currentIdx >= slides.length && slides.length > 0) {
      setCurrentIdx(0);
    }
  }, [slides, currentIdx]);

  useEffect(() => {
    if (slides.length <= 1) return;
    // Auto slide every 5.5 seconds for extremely elegant slow transition
    // By adding currentIdx to dependencies, we reset the interval whenever the user manually changes slide.
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [slides.length, currentIdx]);

  const handleNext = () => {
    if (slides.length === 0) return;
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    if (slides.length === 0) return;
    setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (slides.length === 0) return null;

  const slide = slides[currentIdx] || slides[0];
  const mediaType = slide.mediaType || (
    slide.image && (slide.image.includes('youtube.com') || slide.image.includes('youtu.be')) ? 'youtube' :
    slide.image && slide.image.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image'
  );

  return (
    <div id="performances-slider-root" className="w-full relative h-[450px] md:h-[550px] bg-black overflow-hidden border-y border-neutral-900 flex flex-col justify-end">
      {/* Background Slides with Zoom animation */}
      <AnimatePresence>
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 0.8, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {mediaType === 'video' ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              src={slide.image}
              onCanPlay={(e) => {
                e.currentTarget.play().catch((err) => {
                  console.log("Slider video autoplay prevented:", err);
                });
              }}
            />
          ) : mediaType === 'youtube' ? (
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
              <iframe
                className="absolute top-1/2 left-1/2 w-[300vw] h-[300vh] min-w-[100vw] min-h-[100vh] -translate-x-1/2 -translate-y-1/2 opacity-70 pointer-events-none"
                src={`https://www.youtube.com/embed/${(() => {
                  const match = slide.image.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                  return match ? match[1] : '';
                })()}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&enablejsapi=1&playsinline=1&playlist=${(() => {
                  const match = slide.image.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                  return match ? match[1] : '';
                })()}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ 
                backgroundImage: `url('${slide.image}')`,
                backgroundPosition: slide.bgPosition || 'center'
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Elegant Dark Curtain Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/80" />
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent hidden md:block" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent hidden md:block" />

      {/* Floating UI Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 pb-16 md:pb-20 flex flex-col md:flex-row md:justify-between md:items-end gap-8">
        
        {/* Caption Info */}
        <div className="space-y-4 max-w-lg">
          <span className="text-[10px] tracking-[0.4em] text-neutral-400 uppercase font-semibold block">
            Selected Performances
          </span>
          <div className="space-y-1">
            <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-white uppercase tracking-wider">
              {slide.production[currentLang]}
            </h3>
            <p className="font-serif text-sm md:text-base text-neutral-300 tracking-wide">
              {slide.role[currentLang]}
            </p>
          </div>
          <p className="text-xs text-neutral-400 font-sans tracking-widest uppercase">
            {slide.house[currentLang]}
          </p>
        </div>

        {/* Action / Slider Navigation Controls */}
        <div className="flex items-center space-x-6">
          {/* Slide Indicators Ticks */}
          <div className="flex space-x-2.5">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                id={`slider-tick-${idx}`}
                onClick={() => setCurrentIdx(idx)}
                className={`h-1 rounded-full transition-all duration-500 cursor-pointer ${
                  currentIdx === idx ? 'w-8 bg-white' : 'w-2 bg-neutral-800 hover:bg-neutral-600'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="h-6 w-[1px] bg-neutral-800" />

          {/* Navigation Arrows */}
          <div className="flex space-x-2">
            <button
              id="slider-prev-btn"
              onClick={handlePrev}
              className="w-10 h-10 rounded-full border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer accent-hover-border"
              aria-label="Previous Performance Slide"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              id="slider-next-btn"
              onClick={handleNext}
              className="w-10 h-10 rounded-full border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer accent-hover-border"
              aria-label="Next Performance Slide"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
