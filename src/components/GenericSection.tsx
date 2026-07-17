import React from 'react';
import Reveal from './Reveal';
import { useSectionDirty } from '../hooks/useSectionDirty';
import { motion, AnimatePresence } from 'motion/react';

interface GenericSectionProps {
  id: string;
  heading: string;
  children: React.ReactNode;
}

export default function GenericSection({ id, heading, children }: GenericSectionProps) {
  const isDirty = useSectionDirty(id);

  return (
    <section id={id} className="relative w-full">
      {/* 1. Top Spacing */}
      <div 
        className="w-full transition-all duration-300" 
        style={{ height: 'var(--section-spacing)' }} 
      />
      
      {/* 2. Landing Anchor */}
      <div 
        id={`${id}-anchor`} 
        className="absolute pointer-events-none" 
        style={{ top: 'var(--section-spacing)', height: '0px', width: '0px' }} 
      />
      
      {/* 3. Heading */}
      <div className="text-center mb-12 md:mb-16 lg:mb-20 w-full px-6 sm:px-12 md:px-16 lg:px-20 xl:px-24">
        <Reveal>
          <h2 
            className="text-xl md:text-3xl font-serif font-light uppercase tracking-[0.25em] leading-none inline-flex items-center justify-center relative" 
            style={{ color: 'var(--color-text)' }}
          >
            {heading}
            <AnimatePresence>
              {isDirty && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute -right-5 top-0 w-2 h-2 rounded-full bg-[#C9A227]"
                  title="Unsaved changes"
                />
              )}
            </AnimatePresence>
          </h2>
        </Reveal>
      </div>
      
      {/* 4. Content */}
      <div className="w-full px-6 sm:px-12 md:px-16 lg:px-20 xl:px-24 max-w-[var(--content-max-width)] mx-auto">
        {children}
      </div>
      
      {/* 5. Bottom Spacing */}
      <div 
        className="w-full transition-all duration-300" 
        style={{ height: 'var(--section-spacing)' }} 
      />
    </section>
  );
}
